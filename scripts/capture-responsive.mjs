import { writeFile } from 'node:fs/promises'

const [url, outputPath, widthInput, heightInput, portInput = '9223'] = process.argv.slice(2)
const width = Number(widthInput)
const height = Number(heightInput)
const port = Number(portInput)

if (!url || !outputPath || !Number.isFinite(width) || !Number.isFinite(height)) {
  throw new Error(
    'Usage: node scripts/capture-responsive.mjs <url> <output> <width> <height> [port]',
  )
}

const response = await fetch(`http://127.0.0.1:${port}/json`)
const targets = await response.json()
const page = targets.find((target) => target.type === 'page')

if (!page?.webSocketDebuggerUrl) {
  throw new Error('Không tìm thấy tab Chromium DevTools để chụp preview.')
}

const socket = new WebSocket(page.webSocketDebuggerUrl)
const pending = new Map()
let requestId = 0

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  const request = pending.get(message.id)
  if (!request) return
  pending.delete(message.id)
  if (message.error) request.reject(new Error(message.error.message))
  else request.resolve(message.result)
})

function send(method, params = {}) {
  const id = ++requestId
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

await send('Page.enable')
await send('Runtime.enable')
await send('Page.bringToFront')
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 768,
  screenWidth: width,
  screenHeight: height,
})
await send('Emulation.setTouchEmulationEnabled', { enabled: width < 768, maxTouchPoints: 1 })
await send('Page.navigate', { url })
await new Promise((resolve) => setTimeout(resolve, 1600))
await send('Runtime.evaluate', { expression: 'document.fonts?.ready', awaitPromise: true })

const screenshot = await send('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: false,
})

await writeFile(outputPath, Buffer.from(screenshot.data, 'base64'))
socket.close()
