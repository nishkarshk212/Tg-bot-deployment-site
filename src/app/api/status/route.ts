import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Server from '@/models/Server';
import { execRemote } from '@/lib/ssh';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
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
        // Try common ways to run pm2 jlist
        let stdout = '';
        try {
          const res = await execRemote(server, 'npx pm2 jlist');
          stdout = res.stdout;
        } catch (e) {
          try {
            const res = await execRemote(server, 'pm2 jlist');
            stdout = res.stdout;
          } catch (e2) {
            // Try to find pm2 path in common locations
            const res = await execRemote(server, 'which pm2 || find /usr/local/bin /usr/bin /opt/node/bin -name pm2 -type f 2>/dev/null | head -n 1');
            const pm2Path = res.stdout.trim();
            if (pm2Path) {
              const res2 = await execRemote(server, `${pm2Path} jlist`);
              stdout = res2.stdout;
            } else {
              throw new Error('pm2 not found on remote server');
            }
          }
        }

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
