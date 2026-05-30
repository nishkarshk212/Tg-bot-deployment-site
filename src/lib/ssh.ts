import { exec } from 'child_process';
import { promisify } from 'util';
import { Server } from './servers';
import { Client } from 'ssh2';

const execPromise = promisify(exec);

export async function execRemote(server: Server, command: string): Promise<{ stdout: string; stderr: string }> {
  if (server.isLocal) {
    // For local, we still use PM2_HOME isolation if it's a PM2 command
    const env = command.includes('pm2') ? `PM2_HOME=${process.cwd()}/node_modules/.pm2_home ` : '';
    return execPromise(`${env}${command}`);
  }

  if (!server.password) {
    throw new Error(`Password required for remote server ${server.name}`);
  }

  // Robust environment setup for remote servers
  // We try to find where node/npm might be if they aren't in PATH
  const envSetup = [
    'export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/sbin',
    '[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"',
    '[ -s "$HOME/.profile" ] && . "$HOME/.profile"',
    '[ -s "$HOME/.bashrc" ] && . "$HOME/.bashrc"',
    'export PM2_HOME=$HOME/.pm2',
    // Final check: if npm still not found, try to find it
    'if ! command -v npm &> /dev/null; then export PATH="$PATH:$(find /usr/local/lib/nodejs /opt/node/bin /usr/local/bin -name npm -type f -exec dirname {} \; 2>/dev/null | head -n 1)"; fi'
  ].join('; ');

  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';

    conn.on('ready', () => {
      // Use bash -l -c to ensure PATH is set correctly on the remote server
      const escapedCommand = command.replace(/"/g, '\\"');
      // We wrap the whole thing in a subshell to ensure envSetup applies to the command
      const fullCommand = `bash -l -c "${envSetup}; ${escapedCommand}"`;

      conn.exec(fullCommand, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        }).stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        }).on('close', (code: number) => {
          conn.end();
          if (code === 0) {
            resolve({ stdout, stderr });
          } else {
            const error = new Error(`Command failed with exit code ${code}\n${stderr}`);
            (error as any).code = code;
            (error as any).stderr = stderr;
            (error as any).stdout = stdout;
            reject(error);
          }
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect({
      host: server.host,
      port: 22,
      username: server.username,
      password: server.password,
      readyTimeout: 20000,
      // Avoid host key checking issues for simplicity in this project, 
      // similar to -o StrictHostKeyChecking=no
      hostHash: 'md5', 
    });
  });
}
