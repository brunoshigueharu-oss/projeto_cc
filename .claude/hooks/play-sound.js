// Toca um som de aviso no Mac (afplay) ou no Windows (SoundPlayer).
// Uso: node play-sound.js <glass|ping> [--only-if-stop-active]
// Com --only-if-stop-active, só toca quando o JSON do hook traz stop_hook_active = true.
const fs = require('fs')
const { spawn } = require('child_process')

const SOUNDS = {
  glass: { mac: '/System/Library/Sounds/Glass.aiff', win: 'C:\\Windows\\Media\\Windows Notify System Generic.wav' },
  ping: { mac: '/System/Library/Sounds/Ping.aiff', win: 'C:\\Windows\\Media\\Windows Notify Messaging.wav' },
}

const [name = 'ping', flag] = process.argv.slice(2)

if (flag === '--only-if-stop-active') {
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8'))
    if (!input.stop_hook_active) process.exit(0)
  } catch (_) {
    process.exit(0)
  }
}

const sound = SOUNDS[name] || SOUNDS.ping

if (process.platform === 'darwin') {
  spawn('afplay', [sound.mac], { stdio: 'ignore' })
} else if (process.platform === 'win32') {
  const script = `(New-Object Media.SoundPlayer '${sound.win}').PlaySync()`
  spawn('powershell.exe', ['-NoProfile', '-Command', script], { stdio: 'ignore', windowsHide: true })
}
