import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getServers } from '@/lib/servers';
import { execRemote } from '@/lib/ssh';

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, botToken, envVars, botName, serverId } = await req.json();

    if (!repoUrl || !botToken || !botName || !serverId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const servers = getServers();
    const server = servers.find(s => s.id === serverId);

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.isLocal && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
      return NextResponse.json({ 
        error: 'Local deployment is not supported on serverless platforms like Vercel. Please add a remote VPS to deploy your bots.' 
      }, { status: 400 });
    }

    // Define remote path (we'll use a standard path for simplicity)
    const remoteBaseDir = server.isLocal ? path.join(process.cwd(), 'deployments') : '~/bot_deployments';
    const deploymentDir = server.isLocal ? path.join(remoteBaseDir, botName) : `${remoteBaseDir}/${botName}`;

    // 1. Prepare commands
    const commands = [
      `mkdir -p ${remoteBaseDir}`,
      `if [ -d "${deploymentDir}" ]; then cd ${deploymentDir} && git pull; else git clone ${repoUrl} ${deploymentDir}; fi`,
      `echo "BOT_TOKEN=${botToken}" > ${deploymentDir}/.env`,
    ];

    // Add custom env vars
    if (envVars) {
      Object.entries(envVars).forEach(([key, value]) => {
        commands.push(`echo "${key}=${value}" >> ${deploymentDir}/.env`);
      });
    }

    // 2. Install dependencies
    commands.push(`cd ${deploymentDir} && ( [ -f yarn.lock ] && yarn install || [ -f pnpm-lock.yaml ] && pnpm install || npm install )`);

    // 3. Find entry point
    // This is a bit tricky remotely, so we'll try common names
    const entryPoints = ['index.js', 'bot.js', 'main.js', 'src/index.js'];
    const findEntryCmd = `cd ${deploymentDir} && for f in ${entryPoints.join(' ')}; do [ -f $f ] && echo $f && break; done`;
    
    // We'll run the find command first
    let entryPoint = 'index.js';
    try {
      const { stdout } = await execRemote(server, findEntryCmd);
      if (stdout.trim()) entryPoint = stdout.trim();
    } catch (e) {
      // fallback to index.js
    }

    // 4. Start with PM2
    const pm2Cmd = `npx pm2 start ${entryPoint} --name "${botName}" --update-env --cwd ${deploymentDir}`;
    commands.push(pm2Cmd);

    // Execute all commands in sequence
    const fullCmd = commands.join(' && ');
    await execRemote(server, fullCmd);

    return NextResponse.json({ message: 'Deployment successful', botName, server: server.name });
  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json({ error: error.message || 'Deployment failed' }, { status: 500 });
  }
}
