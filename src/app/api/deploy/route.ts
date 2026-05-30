import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import dbConnect from '@/lib/mongodb';
import Server from '@/models/Server';
import { execRemote } from '@/lib/ssh';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (phase: string, message: string, status: 'pending' | 'in_progress' | 'completed' | 'error') => {
        controller.enqueue(encoder.encode(JSON.stringify({ phase, message, status }) + '\n'));
      };

      try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
          sendUpdate('auth', 'Unauthorized', 'error');
          controller.close();
          return;
        }

        const { repoUrl: rawRepoUrl, botToken: rawBotToken, envVars, botName: rawBotName, serverId } = await req.json();
        const repoUrl = rawRepoUrl?.trim();
        const botToken = rawBotToken?.trim();
        const botName = rawBotName?.trim();

        if (!repoUrl || !botToken || !botName || !serverId) {
          sendUpdate('validation', 'Missing required fields', 'error');
          controller.close();
          return;
        }

        await dbConnect();
        const userId = (session.user as any).id;
        
        let server;
        if (serverId === 'local') {
          server = { id: 'local', name: 'Local Server', host: 'localhost', username: 'local', isLocal: true };
        } else {
          server = await Server.findOne({ _id: serverId, userId });
        }

        if (!server) {
          sendUpdate('validation', `Server not found (ID: ${serverId})`, 'error');
          controller.close();
          return;
        }

        if (server.isLocal && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
          sendUpdate('validation', 'Local deployment is not supported on Vercel', 'error');
          controller.close();
          return;
        }

        const remoteBaseDir = server.isLocal ? path.join(process.cwd(), 'deployments') : '$HOME/bot_deployments';
        const deploymentDir = server.isLocal ? path.join(remoteBaseDir, botName) : `${remoteBaseDir}/${botName}`;

        // PHASE 1: CREATING
        sendUpdate('creating', 'Creating deployment directory and cloning repository...', 'in_progress');
        const createCommands = [
          `mkdir -p "${remoteBaseDir}"`,
          `if [ -d "${deploymentDir}" ]; then cd "${deploymentDir}" && git pull; else git clone "${repoUrl}" "${deploymentDir}"; fi`,
          `echo "BOT_TOKEN=${botToken}" > "${deploymentDir}/.env"`,
        ];
        if (envVars) {
          Object.entries(envVars).forEach(([key, value]) => {
            createCommands.push(`echo "${key}=${value}" >> "${deploymentDir}/.env"`);
          });
        }
        await execRemote(server as any, createCommands.join(' && '));
        sendUpdate('creating', 'Repository cloned and environment configured.', 'completed');

        // PHASE 2: BUILDING
        sendUpdate('building', 'Installing dependencies (npm/yarn)...', 'in_progress');
        const buildCmd = `cd "${deploymentDir}" && ( [ -f yarn.lock ] && (yarn install || npx yarn install) || [ -f pnpm-lock.yaml ] && (pnpm install || npx pnpm install) || (npm install || npx npm install) )`;
        await execRemote(server as any, buildCmd);
        sendUpdate('building', 'Dependencies installed successfully.', 'completed');

        // PHASE 3: DEPLOYING
        sendUpdate('deploying', 'Starting bot with PM2...', 'in_progress');
        
        // Find entry point
        const entryPoints = ['index.js', 'bot.js', 'main.js', 'src/index.js'];
        const findEntryCmd = `cd "${deploymentDir}" && for f in ${entryPoints.join(' ')}; do [ -f $f ] && echo $f && break; done`;
        let entryPoint = 'index.js';
        try {
          const { stdout } = await execRemote(server as any, findEntryCmd);
          if (stdout.trim()) entryPoint = stdout.trim();
        } catch (e) {}

        const pm2Cmd = `(pm2 start ${entryPoint} --name "${botName}" --update-env --cwd "${deploymentDir}" || npx pm2 start ${entryPoint} --name "${botName}" --update-env --cwd "${deploymentDir}")`;
        await execRemote(server as any, pm2Cmd);
        sendUpdate('deploying', 'Bot is now live and running!', 'completed');
        
        controller.close();
      } catch (error: any) {
        sendUpdate('error', error.message || 'Deployment failed', 'error');
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
