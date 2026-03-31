import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.875rem',
            boxShadow: 'var(--shadow-md)',
          },
          success: {
            iconTheme: { primary: '#C9A96E', secondary: 'var(--bg-primary)' }
          }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
