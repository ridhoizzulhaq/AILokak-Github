import { useState } from 'react'
import { HomeScreen } from './HomeScreen'
import { InterviewSession } from './InterviewSession'
import { SessionSummary } from './SessionSummary'
import { PackBrowser, PACKS, type InputMode } from './PackBrowser'
import { PackSearch } from './PackSearch'
import { HistoryScreen } from './HistoryScreen'
import { saveSession } from './HistoryScreen'
import { WalletWidget } from './WalletWidget'

type Page = 'home' | 'packs' | 'search' | 'history'
type InterviewScreen = 'home' | 'interview' | 'summary'

interface Round {
  question: string
  answer: string
  evaluation: string
  score: number
  category: string
}

interface LayoutProps {
  modelsReady: boolean
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 6.5L8 2l6 4.5V14H10v-3.5H6V14H2V6.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'packs',
    label: 'Question Packs',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" fill="none" />
        <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.25" />
        <path d="M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Find Packs',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.25" fill="none" />
        <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M4.5 6.5h4M6.5 4.5v4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25" fill="none" />
        <path d="M8 5.5V8l2 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const DEFAULT_PACKS = ['behavioral-core', 'leadership-fundamentals', 'situational-judgment', 'software-engineering']

export function Layout({ modelsReady }: LayoutProps) {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [interviewScreen, setInterviewScreen] = useState<InterviewScreen>('home')
  const [jobDescription, setJobDescription] = useState<string | undefined>()
  const [sessionRounds, setSessionRounds] = useState<Round[]>([])
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(DEFAULT_PACKS)

  const isInterviewActive = interviewScreen !== 'home'

  const resolvedInputMode: InputMode = (() => {
    const activePacks = PACKS.filter((p) => selectedPackIds.includes(p.id))
    const modes = new Set(activePacks.map((p) => p.inputMode))
    if (modes.size === 0) return 'both'
    if (modes.size === 1) return [...modes][0] as InputMode
    // mixed: any 'both' or mix of text+audio → 'both'
    return 'both'
  })()

  const handleStartCustom = (jd: string): void => {
    setJobDescription(jd)
    setInterviewScreen('interview')
  }

  const handleFinish = (rounds: Round[]): void => {
    setSessionRounds(rounds)
    setInterviewScreen('summary')
    const avg = rounds.length > 0 ? rounds.reduce((s, r) => s + r.score, 0) / rounds.length : 0
    saveSession({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
      jobDescription,
      packIds: selectedPackIds,
      rounds,
      avgScore: Math.round(avg * 10) / 10,
    })
  }

  const handleRestart = (): void => {
    setSessionRounds([])
    setJobDescription(undefined)
    setInterviewScreen('home')
  }

  const renderMain = () => {
    if (currentPage === 'home') {
      if (interviewScreen === 'interview') {
        return <InterviewSession jobDescription={jobDescription} onFinish={handleFinish} selectedPackIds={selectedPackIds} inputMode={resolvedInputMode} onBack={handleRestart} />
      }
      if (interviewScreen === 'summary') {
        return <SessionSummary rounds={sessionRounds} onRestart={handleRestart} onBack={handleRestart} />
      }
      return <HomeScreen onStartCustom={handleStartCustom} modelsReady={modelsReady} selectedPackIds={selectedPackIds} />
    }
    if (currentPage === 'packs') {
      return <PackBrowser selectedPackIds={selectedPackIds} onPackChange={setSelectedPackIds} />
    }
    if (currentPage === 'search') {
      return <PackSearch selectedPackIds={selectedPackIds} onPackChange={setSelectedPackIds} />
    }
    if (currentPage === 'history') {
      return <HistoryScreen />
    }
    return null
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', background: 'var(--canvas)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          userSelect: 'none',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 16px 18px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2L2 5.5v5h3V8h4v2.5h3v-5L7 2z" fill="white" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                LokakAI
              </p>
              <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 1 }}>Local-first practice</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id
            const isDisabled = isInterviewActive && item.id !== 'home'
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!isDisabled) setCurrentPage(item.id)
                }}
                disabled={isDisabled}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--ink)' : 'transparent',
                  color: isActive ? 'var(--accent-fg)' : isDisabled ? 'var(--ink-muted)' : 'var(--ink-secondary)',
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  fontFamily: 'inherit',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.35 : 1,
                  transition: 'background 150ms ease, color 150ms ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isDisabled) {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isDisabled) {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-secondary)'
                  }
                }}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Wallet */}
        <WalletWidget />

        {/* Footer */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: modelsReady ? 'var(--pale-green-fg)' : '#C8A95A',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
              {modelsReady ? 'Models loaded' : 'Loading models…'}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'Geist Mono, monospace' }}>
            v0.1.0
          </span>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {renderMain()}
      </main>
    </div>
  )
}
