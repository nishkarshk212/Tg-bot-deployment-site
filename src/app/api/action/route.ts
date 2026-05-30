import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getServers } from '@/lib/servers';
import { execRemote } from '@/lib/ssh';

export async function POST(req: NextRequest) {
  try {
    const { action, name, serverId } = await req.json();

    if (!action || !name || !serverId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const servers = getServers();
    const server = servers.find(s => s.id === serverId);
    if (!server) throw new Error('Server not found');

    switch (action) {
      case 'restart':
        await execRemote(server, `npx pm2 restart "${name}"`);
        break;
      case 'stop':
        await execRemote(server, `npx pm2 stop "${name}"`);
        break;
      case 'delete':
        await execRemote(server, `npx pm2 delete "${name}"`);
        // Cleanup deployment dir if local
        if (server.isLocal) {
          const deploymentDir = path.join(process.cwd(), 'deployments', name);
          if (fs.existsSync(deploymentDir)) {
            fs.rmSync(deploymentDir, { recursive: true, force: true });
          }
        } else {
          // Cleanup remotely
          await execRemote(server, `rm -rf ~/bot_deployments/${name}`);
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message: `Action ${action} successful` });
  } catch (error: any) {
    console.error('Action error:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
