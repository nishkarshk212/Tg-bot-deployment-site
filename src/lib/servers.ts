import fs from 'fs';
import path from 'path';

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.cwd().includes('/var/task');
const DATA_DIR = isServerless ? '/tmp' : process.cwd();
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');

export interface Server {
  id: string;
  name: string;
  host: string;
  username: string;
  password?: string;
  isLocal?: boolean;
}

export function getServers(): Server[] {
  try {
    if (!fs.existsSync(SERVERS_FILE)) {
      const initialServers = [{ id: 'local', name: 'Local Server', host: 'localhost', username: 'local', isLocal: true }];
      // Only write if we can, or if we are in /tmp
      fs.writeFileSync(SERVERS_FILE, JSON.stringify(initialServers, null, 2));
      return initialServers;
    }
    return JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf-8'));
  } catch (error) {
    console.warn('Warning: Could not read/write servers.json. Using memory-only mode for this request.', error);
    return [{ id: 'local', name: 'Local Server', host: 'localhost', username: 'local', isLocal: true }];
  }
}

export function saveServers(servers: Server[]) {
  try {
    fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2));
  } catch (error) {
    console.error('Error saving servers.json:', error);
    throw new Error('Persistence failed: The file system is read-only. Please host on a VPS for persistent server management.');
  }
}
