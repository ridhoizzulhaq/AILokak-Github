interface LoadingScreenProps {
  message: string
  percentage: number
}

export function LoadingScreen({ message, percentage }: LoadingScreenProps) {
  const clamped = Math.min(100, Math.max(0, percentage))

  return (
    <div
      className="grain"
      style={{
        minHeight: '100dvh',
        background: 'var(--canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient blob */}
      <div
        className="ambient-blob"
        style={{
          width: 480,
          height: 480,
          background: '#C8C5BE',
          top: '10%',
          left: '30%',
        }}
      />

      <div
        className="animate-entry"
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >
        {/* Wordmark */}
        <div style={{ marginBottom: 48 }}>
          <h1
            className="font-serif"
            style={{
              fontSize: 40,
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'var(--ink)',
              marginBottom: 8,
            }}
          >
            AILokak
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 400 }}>
            Local AI interview practice
          </p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{message}</span>
            <span
              className="font-mono score-num"
              style={{ fontSize: 13, color: 'var(--ink-muted)' }}
            >
              {clamped.toFixed(0)}%
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${clamped}%` }} />
          </div>
        </div>

        {/* Info list */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {[
            { label: 'Private by design', detail: 'All inference runs on-device. Nothing leaves your machine.' },
            { label: 'One-time download', detail: 'Models cache locally after first run.' },
            { label: 'Apple Silicon', detail: 'Metal GPU acceleration for low-latency responses.' },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`animate-entry stagger-${i + 2}`}
              style={{ display: 'flex', gap: 12 }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--ink-muted)',
                  marginTop: 8,
                  flexShrink: 0,
                }}
              />
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                  {item.label}.{' '}
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
