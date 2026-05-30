import { NextRequest, NextResponse } from 'next/server';
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

    const { searchParams } = new URL(req.url);
    const botName = searchParams.get('name');
    const serverId = searchParams.get('serverId');
    const isServerLog = searchParams.get('type') === 'server';

    if (!serverId) {
      return NextResponse.json({ error: 'Missing server ID' }, { status: 400 });
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

    const logCmd = isServerLog 
      ? 'npx pm2 logs --nostream --lines 200' 
      : `npx pm2 logs ${botName} --nostream --lines 100`;

    const { stdout } = await execRemote(server as any, logCmd);
    return NextResponse.json({ logs: stdout });
  } catch (error: any) {
    console.error('Logs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
