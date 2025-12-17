import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './utils/codeSplitting'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for offline support
registerServiceWorker()

// Dev startup log
if (import.meta.env.DEV) console.log('Starting frontend (dev mode) - Vite URL should be visible in terminal');
