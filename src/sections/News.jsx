import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'

const CATEGORY_COLORS = {
  'Breaking':     { bg: 'rgba(255,50,50,0.1)',   border: 'rgba(255,50,50,0.35)',   text: '#ff5555' },
  'Team Update':  { bg: 'rgba(57,255,20,0.08)',   border: 'rgba(57,255,20,0.3)',    text: 'var(--primary)' },
  'Race Report':  { bg: 'rgba(80,160,255,0.08)',  border: 'rgba(80,160,255,0.3)',   text: '#5aaeff' },
  'Other':        { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)', text: '#aaa' },
}
const DEFAULT_CAT = CATEGORY_COLORS['Other']

function NewsCard({ item, index }) {
  const cat = CATEGORY_COLORS[item.category] || DEFAULT_CAT
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', transition: 'border-color 0.3s, box-shadow 0.3s', cursor: 'default',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(57,255,20,0.3)'
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(57,255,20,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Top accent line in category color */}
      <div style={{ height: '3px', background: cat.text, boxShadow: `0 0 10px ${cat.text}` }} />

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {/* Category */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px',
            textTransform: 'uppercase', color: cat.text,
            background: cat.bg, border: `1px solid ${cat.border}`, padding: '3px 10px',
          }}>{item.category || 'News'}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px' }}>{item.date}</span>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800,
          letterSpacing: '0.5px', color: 'var(--text)', lineHeight: 1.15, textTransform: 'uppercase',
        }}>{item.title}</h3>

        {/* Body */}
        <p style={{
          fontSize: '14px', color: 'var(--muted)', lineHeight: 1.65, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.body}</p>

        {/* Author */}
        {item.author && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(57,255,20,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
              {item.author[0]}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              <span style={{ color: 'var(--text)' }}>{item.author}</span>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function News() {
  const { dbData } = useDatabase()
  const sorted = [...(dbData.news || [])].sort((a, b) => (b.date > a.date ? 1 : -1))

  return (
    <div style={{ background: 'var(--bg)', position: 'relative' }}>
      {/* Subtle background glow */}
      <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(57,255,20,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="section-wrapper">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="section-header">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
              <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.5em', verticalAlign: 'middle', marginRight: '12px', opacity: 0.7 }}>// 04</span>
              Latest News
            </h2>
            <div className="section-underline" />
          </div>
        </motion.div>

        {sorted.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)', letterSpacing: '2px', textAlign: 'center', padding: '60px 20px', border: '1px dashed rgba(57,255,20,0.12)' }}>
            &gt; NO_NEWS_YET
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {sorted.map((item, i) => <NewsCard key={item.id || i} item={item} index={i} />)}
          </div>
        )}
      </div>
    </div>
  )
}
