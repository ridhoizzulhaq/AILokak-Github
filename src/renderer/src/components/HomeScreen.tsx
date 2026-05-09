import { useState } from 'react'

interface HomeScreenProps {
  onStartCustom: (jobDescription: string) => void
  modelsReady: boolean
  selectedPackIds?: string[]
}

const CATEGORIES = ['behavioral', 'leadership', 'situational', 'technical'] as const

const PACK_LABELS: Record<string, string> = {
  'behavioral-core': 'Behavioral',
  'leadership-fundamentals': 'Leadership',
  'situational-judgment': 'Situational',
  'software-engineering': 'Technical',
}

export function HomeScreen({ onStartCustom, modelsReady, selectedPackIds = [] }: HomeScreenProps) {
  const [jobDescription, setJobDescription] = useState('')

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
        padding: '48px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient blob */}
      <div
        className="ambient-blob"
        style={{ width: 520, height: 520, background: '#C8C5BE', top: '-5%', right: '5%' }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 560,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        {/* Header */}
        <div className="animate-entry stagger-1">
          <h1
            className="font-serif"
            style={{
              fontSize: 48,
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'var(--ink)',
              marginBottom: 10,
            }}
          >
            AILokak
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
            Practice English job interviews with local AI —
            <br />
            private, offline, instant feedback.
          </p>
        </div>

        {/* Status strip */}
        <div
          className="animate-entry stagger-2"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: modelsReady ? 'var(--pale-green-fg)' : '#C8A95A',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>
            {modelsReady ? 'All models ready — 100% offline' : 'Loading AI models…'}
          </span>
        </div>

        {/* Active packs */}
        {selectedPackIds.length > 0 && (
          <div className="animate-entry stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Active packs
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {selectedPackIds.map((id) => (
                <span
                  key={id}
                  className="tag"
                  style={{ background: 'var(--pale-blue-bg)', color: 'var(--pale-blue-fg)', border: 'none' }}
                >
                  {PACK_LABELS[id] ?? id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Why local AI — bento grid */}
        <div
          className="animate-entry stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'var(--border)',
          }}
        >
          {[
            { label: 'Private', detail: 'Answers stay on your device' },
            { label: 'Offline', detail: 'No network required after setup' },
            { label: 'Fast', detail: 'No rate limits or API latency' },
            { label: 'Free', detail: 'No cost per session' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: 'var(--surface)',
                padding: '16px 18px',
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
                {item.label}
              </p>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{item.detail}</p>
            </div>
          ))}
        </div>

        {/* Job description form */}
        <div className="animate-entry stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label
            htmlFor="jd-input"
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}
          >
            Job description
          </label>
          <textarea
            id="jd-input"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job posting here. The AI will tailor questions to the role and requirements you're targeting."
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: 14,
              color: 'var(--ink)',
              resize: 'none',
              height: 148,
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.55,
              transition: 'border-color 200ms ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#B0ADA8')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={() => onStartCustom(jobDescription)}
            disabled={!modelsReady || !jobDescription.trim()}
            className="btn-primary"
            style={{ width: '100%', padding: '14px 24px', fontSize: 15 }}
          >
            Start interview
          </button>
        </div>

        {/* Category tags */}
        <div
          className="animate-entry stagger-4"
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
        >
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="tag"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-secondary)' }}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
