import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Server from '@/models/Server';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    // In next-auth session might not have ID by default in some configs, 
    // but our callback adds it. For simplicity, we can also query by email.
    // However, our callback adds 'id' to the session.user.
    const servers = await Server.find({ userId: (session.user as any).id });
    
    // Add a local server virtual if not present in DB for this user
    const hasLocal = servers.some(s => s.isLocal);
    const results = [...servers];
    if (!hasLocal) {
      results.unshift({
        id: 'local',
        name: 'Local Server',
        host: 'localhost',
        username: 'local',
        isLocal: true,
        _id: 'local'
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverData = await req.json();
    await dbConnect();
    
    const newServer = await Server.create({
      ...serverData,
      userId: (session.user as any).id,
      isLocal: false
    });
    
    return NextResponse.json(newServer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id || id === 'local') {
      return NextResponse.json({ error: 'Cannot delete local server' }, { status: 400 });
    }

    await dbConnect();
    await Server.deleteOne({ _id: id, userId: (session.user as any).id });
    
    return NextResponse.json({ message: 'Server deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
