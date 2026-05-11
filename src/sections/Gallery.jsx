import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'

export default function Gallery() {
  const { dbData } = useDatabase()
  const gallery = dbData.gallery || []
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setLightbox(null)
    }
    if (lightbox) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightbox])

  return (
    <section id="gallery" style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ marginBottom: '48px' }}
      >
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          letterSpacing: '4px',
          color: 'var(--primary)',
          marginBottom: '12px',
        }}>
          // 06 MEDIA GALLERY
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-1px',
          color: 'var(--text)',
        }}>
          Media Gallery
        </h2>
        <div style={{ width: '60px', height: '3px', background: 'var(--primary)', marginTop: '16px', boxShadow: '0 0 12px rgba(57,255,20,0.5)' }} />
      </motion.div>

      {gallery.length === 0 ? (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          letterSpacing: '3px',
          color: 'var(--muted)',
          textAlign: 'center',
          padding: '80px 40px',
          border: '1px dashed var(--border)',
        }}>
          NO MEDIA UPLOADED YET
        </div>
      ) : (
        <>
          {/* Masonry grid via CSS columns */}
          <div style={{ columns: '3 280px', columnGap: '16px' }}>
            {gallery.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                onClick={() => setLightbox(item)}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '16px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'block',
                }}
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src={item.src}
                  alt={item.caption || 'Gallery image'}
                  style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                  loading="lazy"
                />
                {item.caption && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    padding: '8px 12px',
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    color: 'rgba(255,255,255,0.8)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                  >
                    {item.caption}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9000,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            >
              <img
                src={lightbox.src}
                alt={lightbox.caption || ''}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  display: 'block',
                  border: '1px solid rgba(57,255,20,0.2)',
                  boxShadow: '0 0 60px rgba(0,0,0,0.8)',
                }}
              />
              {lightbox.caption && (
                <div style={{
                  marginTop: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  letterSpacing: '2px',
                  color: 'var(--muted)',
                  textAlign: 'center',
                }}>
                  {lightbox.caption}
                </div>
              )}
              <button
                onClick={() => setLightbox(null)}
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: 0,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '18px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
