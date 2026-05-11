import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'

function NewsCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        padding: '24px',
        borderRadius: '2px',
        transition: 'border-color 0.2s, transform 0.2s',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      whileHover={{ y: -4 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,0,0,0.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Category tag */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
        letterSpacing: '3px', textTransform: 'uppercase',
        color: 'var(--primary)',
        background: 'rgba(255,0,0,0.08)',
        border: '1px solid rgba(255,0,0,0.2)',
        padding: '3px 10px',
        display: 'inline-block', alignSelf: 'flex-start',
      }}>
        {item.category || 'News'}
      </div>

      {/* Date */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '2px' }}>
        {item.date}
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800,
        letterSpacing: '0.5px', color: 'var(--text)', lineHeight: 1.2,
      }}>
        {item.title}
      </h3>

      {/* Body */}
      <p style={{
        fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        flex: 1,
      }}>
        {item.body}
      </p>

      {/* Author */}
      {item.author && (
        <div style={{ fontSize: '12px', color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
          By <span style={{ color: 'var(--text)' }}>{item.author}</span>
        </div>
      )}
    </motion.div>
  )
}

export default function News() {
  const { dbData } = useDatabase()
  const sorted = [...(dbData.news || [])].sort((a, b) => (b.date > a.date ? 1 : -1))

  return (
    <div style={{ background: 'var(--bg)' }}>
      <div className="section-wrapper">
        <div className="section-header">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.55em', verticalAlign: 'middle', marginRight: '12px' }}>// 05</span>
            Latest News
          </h2>
          <div className="section-underline" />
        </div>

        {sorted.length === 0 ? (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)',
            letterSpacing: '2px', textAlign: 'center', padding: '60px 20px',
            border: '1px dashed var(--border)',
          }}>
            &gt; NO_NEWS_YET
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            {sorted.map((item, i) => (
              <NewsCard key={item.id || i} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 480px) {
          .news-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
