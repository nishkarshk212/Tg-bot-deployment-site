import fs from 'fs';
import path from 'path';

const SERVERS_FILE = path.join(process.cwd(), 'servers.json');

export interface Server {
  id: string;
  name: string;
  host: string;
  username: string;
  password?: string;
  isLocal?: boolean;
}

export function getServers(): Server[] {
  if (!fs.existsSync(SERVERS_FILE)) {
    const initialServers = [{ id: 'local', name: 'Local Server', host: 'localhost', username: 'local', isLocal: true }];
    fs.writeFileSync(SERVERS_FILE, JSON.stringify(initialServers, null, 2));
    return initialServers;
  }
  return JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf-8'));
}

export function saveServers(servers: Server[]) {
  fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2));
}
