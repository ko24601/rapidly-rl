import { useState, useEffect } from 'react'
import { SITE } from '../config.js'

export default function DiscordWidget() {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!SITE.discordGuildId) return
    fetch(`https://discord.com/api/guilds/${SITE.discordGuildId}/widget.json`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json) setData(json) })
      .catch(() => {})
  }, [])

  const onlineCount = data ? data.presence_count : null

  return (
    <div style={{
      background: 'rgba(88,101,242,0.08)',
      border: '1px solid rgba(88,101,242,0.3)',
      borderRadius: '4px',
      padding: '20px',
      maxWidth: '260px',
    }}>
      {/* Discord header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <svg width="28" height="28" viewBox="0 0 127.14 96.36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" fill="#5865F2"/>
        </svg>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.5px' }}>
            {data?.name || SITE.name}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase' }}>
            Official Server
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#23a55a', boxShadow: '0 0 6px rgba(35,165,90,0.6)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--text)' }}>{onlineCount ?? '…'}</strong> online
          </span>
        </div>
      </div>

      {/* Join button */}
      <a
        href={SITE.discord}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          textAlign: 'center',
          background: '#5865F2',
          color: '#fff',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          padding: '10px 16px',
          textDecoration: 'none',
          borderRadius: '3px',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#4752c4'; e.currentTarget.style.boxShadow = '0 0 16px rgba(88,101,242,0.4)' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#5865F2'; e.currentTarget.style.boxShadow = 'none' }}
      >
        Join Discord
      </a>

    </div>
  )
}
