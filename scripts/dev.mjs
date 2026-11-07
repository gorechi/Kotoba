import { createServer } from 'vite'
import { spawn } from 'node:child_process'
import electronPath from 'electron'

const server = await createServer()
await server.listen()
const url = server.resolvedUrls?.local?.[0] ?? 'http://localhost:5173'
console.log(`\n  Котоба: Vite запущен на ${url}\n`)

const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_DEV_SERVER_URL: url, NODE_ENV: 'development' },
})

let closing = false
async function shutdown(code = 0) {
  if (closing) return
  closing = true
  try {
    await server.close()
  } catch {
    /* ignore */
  }
  process.exit(code)
}

child.on('close', (code) => shutdown(code ?? 0))
process.on('SIGINT', () => {
  child.kill()
  shutdown(0)
})
process.on('SIGTERM', () => {
  child.kill()
  shutdown(0)
})
