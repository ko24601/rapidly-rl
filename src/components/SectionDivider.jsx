export default function SectionDivider({ flip = false }) {
  return (
    <div style={{ position: 'relative', height: '48px', overflow: 'hidden', background: flip ? 'var(--surface)' : 'var(--bg)', marginTop: '-1px' }}>
      <svg viewBox="0 0 1440 48" preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', display: 'block' }}>
        <path
          d={flip ? 'M0,0 L1440,48 L1440,0 Z' : 'M0,48 L1440,0 L1440,48 Z'}
          fill={flip ? 'var(--bg)' : 'var(--surface)'}
        />
        <line x1="0" y1={flip ? '0' : '48'} x2="1440" y2={flip ? '48' : '0'}
          stroke="rgba(57,255,20,0.18)" strokeWidth="1.5" />
      </svg>
    </div>
  )
}
