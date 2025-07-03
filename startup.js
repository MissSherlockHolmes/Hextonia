const { spawn } = require('child_process');
const path = require('path');

const servers = [
  {
    name: 'FRONTEND',
    script: path.join(__dirname, 'server.js'),
  },
  {
    name: 'API',
    script: path.join(__dirname, 'backend', 'apiServer.js'),
  },
  {
    name: 'WORKFLOW',
    script: path.join(__dirname, 'backend', 'workflowServer.js'),
  },
];

const children = [];

servers.forEach(({ name, script }) => {
  const child = spawn('node', [script], { stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(child);

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });
  child.stderr.on('data', (data) => {
    process.stderr.write(`[${name} ERROR] ${data}`);
  });
  child.on('close', (code) => {
    console.log(`[${name}] exited with code ${code}`);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  children.forEach((child) => child.kill());
  process.exit();
}); 