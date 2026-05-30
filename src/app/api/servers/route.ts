import { NextRequest, NextResponse } from 'next/server';
import { getServers, saveServers, Server } from '@/lib/servers';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  return NextResponse.json(getServers());
}

export async function POST(req: NextRequest) {
  try {
    const serverData = await req.json();
    const servers = getServers();
    
    const newServer: Server = {
      ...serverData,
      id: uuidv4(),
      isLocal: false
    };

    servers.push(newServer);
    saveServers(servers);
    
    return NextResponse.json(newServer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id || id === 'local') {
    return NextResponse.json({ error: 'Cannot delete local server' }, { status: 400 });
  }

  const servers = getServers();
  const filtered = servers.filter(s => s.id !== id);
  saveServers(filtered);
  
  return NextResponse.json({ message: 'Server deleted' });
}
