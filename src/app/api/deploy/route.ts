import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import path from 'path';
import fs from 'fs';
import dbConnect from '@/lib/mongodb';
import Server from '@/models/Server';
import { execRemote } from '@/lib/ssh';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { repoUrl: rawRepoUrl, botToken: rawBotToken, envVars, botName: rawBotName, serverId } = await req.json();

    const repoUrl = rawRepoUrl?.trim();
    const botToken = rawBotToken?.trim();
    const botName = rawBotName?.trim();

    if (!repoUrl || !botToken || !botName || !serverId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
      return NextResponse.json({ error: `Server not found (ID: ${serverId})` }, { status: 404 });
    }

    if (server.isLocal && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
      return NextResponse.json({ 
        error: 'Local deployment is not supported on serverless platforms like Vercel. Please add a remote VPS to deploy your bots.' 
      }, { status: 400 });
    }

    // Define remote path
    const remoteBaseDir = server.isLocal ? path.join(process.cwd(), 'deployments') : '~/bot_deployments';
    const deploymentDir = server.isLocal ? path.join(remoteBaseDir, botName) : `${remoteBaseDir}/${botName}`;

    // 1. Prepare commands
    const commands = [
      `mkdir -p "${remoteBaseDir}"`,
      `if [ -d "${deploymentDir}" ]; then cd "${deploymentDir}" && git pull; else git clone "${repoUrl}" "${deploymentDir}"; fi`,
      `echo "BOT_TOKEN=${botToken}" > "${deploymentDir}/.env"`,
    ];

    // Add custom env vars
    if (envVars) {
      Object.entries(envVars).forEach(([key, value]) => {
        commands.push(`echo "${key}=${value}" >> "${deploymentDir}/.env"`);
      });
    }

    // 2. Install dependencies
    commands.push(`cd "${deploymentDir}" && ( [ -f yarn.lock ] && yarn install || [ -f pnpm-lock.yaml ] && pnpm install || npm install )`);

    // 3. Find entry point
    const entryPoints = ['index.js', 'bot.js', 'main.js', 'src/index.js'];
    const findEntryCmd = `cd "${deploymentDir}" && for f in ${entryPoints.join(' ')}; do [ -f $f ] && echo $f && break; done`;
    
    let entryPoint = 'index.js';
    try {
      const { stdout } = await execRemote(server as any, findEntryCmd);
      if (stdout.trim()) entryPoint = stdout.trim();
    } catch (e) {
      // fallback
    }

    // 4. Start with PM2
    const pm2Cmd = `npx pm2 start ${entryPoint} --name "${botName}" --update-env --cwd "${deploymentDir}"`;
    commands.push(pm2Cmd);

    // Execute all commands
    const fullCmd = commands.join(' && ');
    await execRemote(server as any, fullCmd);

    return NextResponse.json({ message: 'Deployment successful', botName, server: server.name });
  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json({ error: error.message || 'Deployment failed' }, { status: 500 });
  }
}
