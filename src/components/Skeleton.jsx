export function CardSkeleton() {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ paddingTop: '133%', background: '#111', position: 'relative', overflow: 'hidden' }}>
        <div className="shimmer" style={{ position: 'absolute', inset: 0 }} />
      </div>
      <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="shimmer" style={{ height: '10px', width: '40%', borderRadius: '2px' }} />
        <div className="shimmer" style={{ height: '18px', width: '75%', borderRadius: '2px' }} />
        <div className="shimmer" style={{ height: '12px', width: '90%', borderRadius: '2px' }} />
        <div className="shimmer" style={{ height: '12px', width: '60%', borderRadius: '2px' }} />
      </div>
      <style>{`
        .shimmer {
          background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
          background-size: 200% 100%;
          animation: shimmerSlide 1.6s ease-in-out infinite;
        }
        @keyframes shimmerSlide {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '18px 16px', display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div className="shimmer" style={{ height: '14px', width: '32px', borderRadius: '2px', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div className="shimmer" style={{ height: '14px', width: '50%', borderRadius: '2px' }} />
        <div className="shimmer" style={{ height: '10px', width: '30%', borderRadius: '2px' }} />
      </div>
      <div className="shimmer" style={{ height: '12px', width: '80px', borderRadius: '2px', flexShrink: 0 }} />
      <div className="shimmer" style={{ height: '24px', width: '56px', borderRadius: '2px', flexShrink: 0 }} />
    </div>
  )
}
