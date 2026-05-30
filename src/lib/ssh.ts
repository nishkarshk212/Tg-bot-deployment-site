import { exec } from 'child_process';
import { promisify } from 'util';
import { Server } from './servers';

const execPromise = promisify(exec);

export async function execRemote(server: Server, command: string) {
  if (server.isLocal) {
    // For local, we still use PM2_HOME isolation if it's a PM2 command
    const env = command.includes('pm2') ? `PM2_HOME=${process.cwd()}/node_modules/.pm2_home ` : '';
    return execPromise(`${env}${command}`);
  }

  if (!server.password) {
    throw new Error(`Password required for remote server ${server.name}`);
  }

  // Use sshpass for password-based SSH
  // -o StrictHostKeyChecking=no to avoid interactive prompts for new hosts
  const sshCmd = `sshpass -p "${server.password}" ssh -o StrictHostKeyChecking=no ${server.username}@${server.host} "${command}"`;
  return execPromise(sshCmd);
}
