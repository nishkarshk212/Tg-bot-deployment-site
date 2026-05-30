import { NextRequest, NextResponse } from 'next/server';
import { getServers } from '@/lib/servers';
import { execRemote } from '@/lib/ssh';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botName = searchParams.get('name');
  const serverId = searchParams.get('serverId');
  const isServerLog = searchParams.get('type') === 'server';

  if (!serverId) {
    return NextResponse.json({ error: 'Missing server ID' }, { status: 400 });
  }

  try {
    const servers = getServers();
    const server = servers.find(s => s.id === serverId);
    if (!server) throw new Error('Server not found');

    const logCmd = isServerLog 
      ? 'npx pm2 logs --nostream --lines 200' 
      : `npx pm2 logs ${botName} --nostream --lines 100`;

    const { stdout } = await execRemote(server, logCmd);
    return NextResponse.json({ logs: stdout });
  } catch (error: any) {
    console.error('Logs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
