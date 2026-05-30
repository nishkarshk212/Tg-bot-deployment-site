import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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

    const { action, name, serverId } = await req.json();

    if (!action || !name || !serverId) {
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

    switch (action) {
      case 'restart':
        await execRemote(server as any, `pm2 restart "${name}" || npx pm2 restart "${name}"`);
        break;
      case 'stop':
        await execRemote(server as any, `pm2 stop "${name}" || npx pm2 stop "${name}"`);
        break;
      case 'delete':
        await execRemote(server as any, `pm2 delete "${name}" || npx pm2 delete "${name}"`);
        // Cleanup deployment dir
        if (server.isLocal) {
          const deploymentDir = path.join(process.cwd(), 'deployments', name);
          if (fs.existsSync(deploymentDir)) {
            fs.rmSync(deploymentDir, { recursive: true, force: true });
          }
        } else {
          // Cleanup remotely
          await execRemote(server as any, `rm -rf "$HOME/bot_deployments/${name}"`);
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
