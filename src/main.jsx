import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a24',
          color: '#e5e7eb',
          border: '1px solid rgba(212,160,23,0.25)',
          borderRadius: '10px',
          fontSize: '13px',
          fontFamily: '"DM Sans", sans-serif',
        },
        success: { iconTheme: { primary: '#d4a017', secondary: '#0a0a0f' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#0a0a0f' } },
      }}
    />
  </React.StrictMode>,
)
