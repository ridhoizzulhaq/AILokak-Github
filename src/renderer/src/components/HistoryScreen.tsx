import { useState, useEffect } from 'react'

export interface SessionRecord {
  id: string
  date: string
  jobDescription?: string
  packIds: string[]
  rounds: {
    question: string
    answer: string
    evaluation: string
    score: number
    category: string
  }[]
  avgScore: number
}

const STORAGE_KEY = 'ailokak_session_history'

export function loadHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SessionRecord[]) : []
  } catch {
    return []
  }
}

export function saveSession(record: SessionRecord): void {
  try {
    const existing = loadHistory()
    const updated = [record, ...existing].slice(0, 50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // storage full or unavailable — fail silently
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 8
      ? { bg: 'var(--pale-green-bg)', fg: 'var(--pale-green-fg)' }
      : score >= 6
        ? { bg: 'var(--pale-amber-bg)', fg: 'var(--pale-amber-fg)' }
        : { bg: 'var(--pale-red-bg)', fg: 'var(--pale-red-fg)' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 12,
        fontWeight: 600,
        background: color.bg,
        color: color.fg,
        fontFamily: 'Geist Mono, monospace',
      }}
    >
      {score.toFixed(1)}
    </span>
  )
}

function SessionDetail({ session, onClose }: { session: SessionRecord; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.25)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 480,
          maxHeight: 'calc(100dvh - 32px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Detail header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            position: 'sticky',
            top: 0,
            background: 'var(--surface)',
            zIndex: 1,
          }}
        >
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
              {formatDate(session.date)} · {formatTime(session.date)}
            </p>
            {session.jobDescription && (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--ink-secondary)',
                  marginTop: 4,
                  lineHeight: 1.4,
                  maxWidth: 320,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session.jobDescription}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ScoreChip score={session.avgScore} />
            <button
              className="btn-ghost"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {/* Rounds */}
        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {session.rounds.map((round, i) => (
            <div key={i} style={{ borderBottom: i < session.rounds.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: i < session.rounds.length - 1 ? 20 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--ink-muted)',
                      fontFamily: 'Geist Mono, monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Q{i + 1}
                  </span>
                  <span
                    className="tag"
                    style={{ background: 'var(--surface)', color: 'var(--ink-secondary)', border: '1px solid var(--border)' }}
                  >
                    {round.category}
                  </span>
                </div>
                <ScoreChip score={round.score} />
              </div>

              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4, marginBottom: 6 }}>
                {round.question}
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.55, marginBottom: 8 }}>
                {round.answer}
              </p>
              {round.evaluation && (
                <div
                  style={{
                    background: 'var(--canvas)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                  }}
                >
                  <p style={{ fontSize: 12, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
                    {round.evaluation.slice(0, 280)}
                    {round.evaluation.length > 280 ? '…' : ''}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [selected, setSelected] = useState<SessionRecord | null>(null)

  useEffect(() => {
    setSessions(loadHistory())
  }, [])

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSessions([])
  }

  return (
    <div
      className="grain"
      style={{
        minHeight: '100%',
        background: 'var(--canvas)',
        padding: '40px 40px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="ambient-blob"
        style={{ width: 360, height: 360, background: '#C8C5BE', bottom: '-5%', left: '-5%' }}
      />

      <div style={{ maxWidth: 680, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div
          className="animate-entry stagger-1"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 32,
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
              History
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-secondary)' }}>
              {sessions.length === 0
                ? 'No sessions yet.'
                : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} on record`}
            </p>
          </div>
          {sessions.length > 0 && (
            <button
              className="btn-ghost"
              style={{ fontSize: 12, padding: '7px 14px', marginTop: 4 }}
              onClick={handleClear}
            >
              Clear all
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div
            className="animate-entry stagger-2"
            style={{
              padding: '48px 32px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 14, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
              Complete an interview session and your results will appear here.
            </p>
          </div>
        ) : (
          <div
            className="animate-entry stagger-2"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            {sessions.map((session, i) => (
              <button
                key={session.id}
                onClick={() => setSelected(session)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'transparent',
                  border: 'none',
                  borderBottomColor: 'var(--border)',
                  borderBottomStyle: 'solid',
                  borderBottomWidth: i < sessions.length - 1 ? 1 : 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--canvas)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
              >
                {/* Score ring */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: `2px solid ${session.avgScore >= 8 ? 'var(--pale-green-fg)' : session.avgScore >= 6 ? 'var(--pale-amber-fg)' : 'var(--pale-red-fg)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'Geist Mono, monospace',
                      color:
                        session.avgScore >= 8
                          ? 'var(--pale-green-fg)'
                          : session.avgScore >= 6
                            ? 'var(--pale-amber-fg)'
                            : 'var(--pale-red-fg)',
                    }}
                  >
                    {session.avgScore.toFixed(1)}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                      {formatDate(session.date)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatTime(session.date)}</span>
                  </div>
                  {session.jobDescription ? (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--ink-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 400,
                      }}
                    >
                      {session.jobDescription}
                    </p>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>No job description</p>
                  )}
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--ink-muted)',
                      fontFamily: 'Geist Mono, monospace',
                    }}
                  >
                    {session.rounds.length}Q
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--ink-muted)' }}>
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && <SessionDetail session={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
