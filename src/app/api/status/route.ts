import { NextResponse, NextRequest } from 'next/server';
import { getServers } from '@/lib/servers';
import { execRemote } from '@/lib/ssh';

export async function GET(req: NextRequest) {
  try {
    const servers = getServers();
    const allBotStatus = [];

    for (const server of servers) {
      try {
        const { stdout } = await execRemote(server, 'npx pm2 jlist');
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
          serverId: server.id,
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
