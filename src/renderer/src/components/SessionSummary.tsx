import { useState, useEffect, useRef } from 'react'

interface Round {
  question: string
  answer: string
  evaluation: string
  score: number
  category: string
}

interface SessionSummaryProps {
  rounds: Round[]
  onRestart: () => void
  onBack?: () => void
}

function parseSection(text: string, header: string): string {
  const next = ['OVERALL:', 'STRENGTHS:', 'FOCUS:', 'TIPS:'].filter((h) => h !== header).join('|')
  const regex = new RegExp(`${header}\\s*(.+?)(?=${next}|$)`, 'is')
  const match = text.match(regex)
  return match ? match[1].trim() : ''
}

function ScoreRing({ score }: { score: number }) {
  const radius = 36
  const circ = 2 * Math.PI * radius
  const pct = score / 10
  const dashOffset = circ * (1 - pct)
  const color = score >= 8 ? 'var(--pale-green-fg)' : score >= 6 ? '#C8A95A' : 'var(--pale-red-fg)'

  return (
    <div style={{ position: 'relative', width: 90, height: 90 }}>
      <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="45" cy="45" r={radius} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          className="font-mono score-num"
          style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1 }}
        >
          {score.toFixed(1)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>/ 10</span>
      </div>
    </div>
  )
}

function SummaryBlock({
  label,
  text,
  bg,
  fg,
}: {
  label: string
  text: string
  bg: string
  fg: string
}) {
  return (
    <div
      style={{
        background: bg,
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px',
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: fg,
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 13,
          color: fg,
          lineHeight: 1.65,
          whiteSpace: 'pre-line',
        }}
      >
        {text}
      </p>
    </div>
  )
}

export function SessionSummary({ rounds, onRestart, onBack }: SessionSummaryProps) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const cleanupRef = useRef<(() => void) | null>(null)

  const avgScore = rounds.reduce((s, r) => s + r.score, 0) / rounds.length

  useEffect(() => {
    const fetchSummary = async (): Promise<void> => {
      cleanupRef.current = window.qvacAPI.onCompletionToken(({ token }) => {
        setSummary((prev) => prev + token)
      })

      const result = await window.qvacAPI.generateSummary({
        sessionData: rounds.map((r) => ({
          question: r.question,
          answer: r.answer,
          score: r.score,
          evaluation: r.evaluation
        }))
      })

      cleanupRef.current?.()
      cleanupRef.current = null

      if (result.summary) setSummary(result.summary)
      setLoading(false)
    }

    fetchSummary()
    return () => { cleanupRef.current?.() }
  }, [rounds])

  const overall = parseSection(summary, 'OVERALL:')
  const strengths = parseSection(summary, 'STRENGTHS:')
  const focus = parseSection(summary, 'FOCUS:')
  const tips = parseSection(summary, 'TIPS:')

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--canvas)' }}>

      {/* Top bar */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-secondary)',
              fontSize: 13,
              padding: '4px 0',
              fontFamily: 'inherit',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-secondary)')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        )}
        <span
          className="font-serif"
          style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)' }}
        >
          AILokak
        </span>
        <span style={{ color: 'var(--border)' }}>—</span>
        <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>Session complete</span>
      </div>

      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '40px 24px 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Header + score */}
        <div
          className="animate-entry stagger-1"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div>
            <h1
              className="font-serif"
              style={{
                fontSize: 36,
                fontWeight: 400,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: 'var(--ink)',
                marginBottom: 8,
              }}
            >
              Session review
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-secondary)' }}>
              {rounds.length} questions across {[...new Set(rounds.map((r) => r.category))].join(', ')} topics
            </p>
          </div>
          <ScoreRing score={avgScore} />
        </div>

        {/* AI Summary */}
        {loading && !summary && (
          <div
            className="animate-entry stagger-2 card"
            style={{ padding: '16px 18px' }}
          >
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
              Generating personalized summary…
            </p>
          </div>
        )}

        {summary && (
          <div
            className="animate-entry stagger-2"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {overall && (
              <div className="card" style={{ padding: '16px 18px' }}>
                <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>
                  Overall assessment
                </p>
                <p style={{ fontSize: 14, color: 'var(--ink-secondary)', lineHeight: 1.65 }}>{overall}</p>
              </div>
            )}

            {strengths && (
              <SummaryBlock label="Your strengths" text={strengths} bg="var(--pale-green-bg)" fg="var(--pale-green-fg)" />
            )}
            {focus && (
              <SummaryBlock label="Focus areas" text={focus} bg="var(--pale-amber-bg)" fg="var(--pale-amber-fg)" />
            )}
            {tips && (
              <SummaryBlock label="Tips for next session" text={tips} bg="var(--pale-blue-bg)" fg="var(--pale-blue-fg)" />
            )}
          </div>
        )}

        {/* Score chart */}
        <div className="animate-entry stagger-3 card" style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 16 }}>
            Score per question
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rounds.map((round, i) => {
              const color = round.score >= 8 ? 'var(--pale-green-fg)' : round.score >= 6 ? '#C8A95A' : 'var(--pale-red-fg)'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    className="font-mono"
                    style={{ fontSize: 11, color: 'var(--ink-muted)', width: 20, flexShrink: 0 }}
                  >
                    Q{i + 1}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: 'var(--border)',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(round.score / 10) * 100}%`,
                        background: color,
                        borderRadius: 1,
                        transition: `width ${700 + i * 80}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                      }}
                    />
                  </div>
                  <span
                    className="font-mono score-num"
                    style={{ fontSize: 13, fontWeight: 500, color, width: 24, textAlign: 'right', flexShrink: 0 }}
                  >
                    {round.score}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Question breakdown */}
        <div className="animate-entry stagger-4" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
            Question breakdown
          </p>
          {rounds.map((round, i) => {
            const color = round.score >= 8 ? 'var(--pale-green-fg)' : round.score >= 6 ? '#C8A95A' : 'var(--pale-red-fg)'
            return (
              <div
                key={i}
                className="card"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 36 }}>
                  <span
                    className="font-mono score-num"
                    style={{ fontSize: 18, fontWeight: 600, color, display: 'block', lineHeight: 1 }}
                  >
                    {round.score}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>/10</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    className="tag"
                    style={{
                      background: 'var(--canvas)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink-muted)',
                      marginBottom: 6,
                      display: 'inline-flex',
                    }}
                  >
                    {round.category}
                  </span>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--ink)',
                      lineHeight: 1.55,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                    }}
                  >
                    {round.question}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action */}
        <div className="animate-entry stagger-5">
          <button
            onClick={onRestart}
            className="btn-primary"
            style={{ width: '100%', padding: '14px 24px', fontSize: 14 }}
          >
            Practice again
          </button>
        </div>
      </div>
    </div>
  )
}
