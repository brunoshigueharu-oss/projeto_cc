// Garante que o servidor Next.js (npm run dev) esteja rodando na porta 3000.
// Funciona no Mac e no Windows (substitui o antigo ensure-dev-server.sh, que usava lsof).
const fs = require('fs')
const net = require('net')
const path = require('path')
const { spawn } = require('child_process')

const PORT = 3000
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd()

function isListening(host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port: PORT, host })
    socket.setTimeout(1000)
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('timeout', () => { socket.destroy(); resolve(false) })
    socket.once('error', () => resolve(false))
  })
}

async function main() {
  const results = await Promise.all([isListening('127.0.0.1'), isListening('::1')])
  if (results.includes(true)) return

  const log = fs.openSync(path.join(projectDir, '.claude', 'dev-server.log'), 'a')
  const child = spawn('npm run dev', {
    cwd: projectDir,
    shell: true,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
  })
  child.unref()
}

main().finally(() => process.exit(0))
