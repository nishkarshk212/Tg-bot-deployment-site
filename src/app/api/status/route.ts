import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Server from '@/models/Server';
import { execRemote } from '@/lib/ssh';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = (session.user as any).id;
    const servers = await Server.find({ userId });
    
    // Add local server for status check if not in DB
    if (!servers.some(s => s.isLocal)) {
      servers.unshift({
        id: 'local',
        name: 'Local Server',
        host: 'localhost',
        username: 'local',
        isLocal: true,
        _id: 'local'
      } as any);
    }

    const allBotStatus = [];

    for (const server of servers) {
      try {
        const { stdout } = await execRemote(server, 'pm2 jlist || npx pm2 jlist');

        // Check if stdout starts with JSON (skip PM2 banner if any)
        const jsonStart = stdout.indexOf('[');
        if (jsonStart === -1) continue;
        
        const processes = JSON.parse(stdout.substring(jsonStart));
        
        const botStatus = processes.map((p: any) => ({
          name: p.name,
          status: p.pm2_env.status,
          cpu: p.monit.cpu,
          memory: p.monit.memory,
          uptime: Math.floor((Date.now() - p.pm2_env.pm_uptime) / 1000),
          serverId: server.id || server._id.toString(),
          serverName: server.name
        }));
        
        allBotStatus.push(...botStatus);
      } catch (err) {
        console.error(`Failed to fetch status for server ${server.name}:`, err);
      }
    }

    return NextResponse.json(allBotStatus);
  } catch (error: any) {
    console.error('Status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch status' }, { status: 500 });
  }
}
