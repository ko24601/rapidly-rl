import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{
                background: '#0e0e0e',
                border: `1px solid ${toast.type === 'error' ? 'rgba(255,80,80,0.6)' : 'rgba(57,255,20,0.5)'}`,
                borderLeft: `3px solid ${toast.type === 'error' ? '#ff5555' : '#39FF14'}`,
                borderRadius: '2px',
                padding: '12px 20px',
                minWidth: '220px',
                maxWidth: '320px',
                pointerEvents: 'auto',
                boxShadow: toast.type === 'error'
                  ? '0 0 20px rgba(255,80,80,0.15)'
                  : '0 0 20px rgba(57,255,20,0.12)',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                letterSpacing: '1px',
                color: toast.type === 'error' ? '#ff5555' : '#39FF14',
              }}>
                {toast.type === 'error' ? '✗ ' : '✓ '}{toast.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
