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
  const localServer: Server = { id: 'local', name: 'Local Server', host: 'localhost', username: 'local', isLocal: true };
  
  try {
    if (!fs.existsSync(SERVERS_FILE)) {
      // Only write if we can, or if we are in /tmp
      fs.writeFileSync(SERVERS_FILE, JSON.stringify([localServer], null, 2));
      return [localServer];
    }
    
    const content = fs.readFileSync(SERVERS_FILE, 'utf-8');
    if (!content.trim()) {
      return [localServer];
    }
    
    const servers = JSON.parse(content);
    
    // Ensure local server is always present
    if (Array.isArray(servers) && !servers.some(s => s.id === 'local')) {
      return [localServer, ...servers];
    }
    
    return Array.isArray(servers) ? servers : [localServer];
  } catch (error) {
    console.warn('Warning: Could not read/write servers.json. Using memory-only mode for this request.', error);
    return [localServer];
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
