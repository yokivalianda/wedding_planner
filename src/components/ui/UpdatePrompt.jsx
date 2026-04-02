import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Cek update setiap 60 detik saat app aktif
      if (registration) {
        setInterval(() => {
          registration.update()
        }, 60 * 1000)
      }
    },
  })

  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  const handleDismiss = () => {
    setNeedRefresh(false)
  }

  if (!needRefresh) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '5.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--gold)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-gold)',
      whiteSpace: 'nowrap',
      animation: 'slideInUp 0.3s var(--ease) both',
      maxWidth: 'calc(100vw - 2rem)',
    }}>
      <RefreshCw size={15} color="var(--gold)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
        Versi baru tersedia
      </span>
      <button
        onClick={handleUpdate}
        style={{
          padding: '0.35rem 0.875rem',
          background: 'var(--gold)',
          color: '#0F0D0A',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          flexShrink: 0,
        }}
      >
        Perbarui
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-faint)',
          display: 'flex',
          padding: '0.25rem',
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
