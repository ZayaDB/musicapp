import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

registerSW({ immediate: true })

const DYNAMIC_IMPORT_ERROR = 'Failed to fetch dynamically imported module'

function reloadOnceForStaleChunk() {
  const key = 'muse-stale-chunk-reloaded'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  window.location.reload()
}

window.addEventListener('error', (event) => {
  const message = event?.message || ''
  if (message.includes(DYNAMIC_IMPORT_ERROR)) {
    reloadOnceForStaleChunk()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  const message = String(event.reason?.message || event.reason || '')
  if (message.includes(DYNAMIC_IMPORT_ERROR)) {
    reloadOnceForStaleChunk()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
