import { useState, useEffect } from 'react'

interface PackBrowserProps {
  selectedPackIds: string[]
  onPackChange: (ids: string[]) => void
}

export type InputMode = 'text' | 'audio' | 'both'

export interface Mentor {
  name: string
  role: string
  avatar: string
}

export interface Pack {
  id: string
  name: string
  description: string
  category: string
  questions: number
  inputMode: InputMode
  type: 'built-in' | 'marketplace'
  price_usdt: number
  installed: boolean
  author: string
  mentor?: Mentor
  industries: string[]
  roles: string[]
}

export const PACKS: Pack[] = [
  // ── BUILT-IN ──────────────────────────────────────────────────────────────
  {
    id: 'behavioral-core',
    name: 'Behavioral Core',
    description: 'STAR-method questions on teamwork, conflict, and growth.',
    category: 'Behavioral',
    questions: 12,
    inputMode: 'both',
    type: 'built-in',
    price_usdt: 0,
    installed: true,
    author: 'InterviewAI',
    industries: ['all'],
    roles: ['all'],
  },
  {
    id: 'leadership-fundamentals',
    name: 'Leadership Fundamentals',
    description: 'Influence, delegation, difficult feedback, and team building.',
    category: 'Leadership',
    questions: 8,
    inputMode: 'audio',
    type: 'built-in',
    price_usdt: 0,
    installed: true,
    author: 'InterviewAI',
    industries: ['all'],
    roles: ['manager', 'director', 'vp', 'executive'],
  },
  {
    id: 'situational-judgment',
    name: 'Situational Judgment',
    description: 'Ambiguous scenarios testing problem-solving under constraints.',
    category: 'Situational',
    questions: 10,
    inputMode: 'both',
    type: 'built-in',
    price_usdt: 0,
    installed: true,
    author: 'InterviewAI',
    industries: ['all'],
    roles: ['all'],
  },
  {
    id: 'software-engineering',
    name: 'Software Engineering',
    description: 'System design thinking, debugging approach, technical trade-offs.',
    category: 'Technical',
    questions: 8,
    inputMode: 'text',
    type: 'built-in',
    price_usdt: 0,
    installed: true,
    author: 'InterviewAI',
    industries: ['tech'],
    roles: ['software-engineer', 'sre', 'engineering-manager'],
  },

  // ── MARKETPLACE ───────────────────────────────────────────────────────────
  {
    id: 'product-management',
    name: 'Product Management',
    description: 'Prioritization frameworks, roadmap decisions, metrics, and user empathy for PM roles.',
    category: 'Product',
    questions: 10,
    inputMode: 'both',
    type: 'marketplace',
    price_usdt: 0.0001,
    installed: false,
    author: 'Priya Menon',
    mentor: {
      name: 'Priya Menon',
      role: 'Senior PM · Series B Fintech',
      avatar: 'PM',
    },
    industries: ['tech', 'fintech', 'saas'],
    roles: ['product-manager', 'product-owner', 'associate-pm', 'senior-pm'],
  },
  {
    id: 'data-science',
    name: 'Data Science',
    description: 'Experimental design, model evaluation, and communicating findings to stakeholders.',
    category: 'Technical',
    questions: 9,
    inputMode: 'text',
    type: 'marketplace',
    price_usdt: 0.0001,
    installed: false,
    author: 'Daniel Osei',
    mentor: {
      name: 'Daniel Osei',
      role: 'Staff Data Scientist · Top Tech Company',
      avatar: 'DO',
    },
    industries: ['tech', 'finance', 'healthcare'],
    roles: ['data-scientist', 'ml-engineer', 'data-analyst'],
  },
  {
    id: 'executive-presence',
    name: 'Executive Presence',
    description: 'Senior-level influence, vision communication, board presentations, and org navigation.',
    category: 'Leadership',
    questions: 7,
    inputMode: 'audio',
    type: 'marketplace',
    price_usdt: 0.0001,
    installed: false,
    author: 'Margaret Lin',
    mentor: {
      name: 'Margaret Lin',
      role: 'VP Engineering · SaaS Scale-up',
      avatar: 'ML',
    },
    industries: ['all'],
    roles: ['vp', 'director', 'c-suite', 'general-manager'],
  },
  {
    id: 'faang-swe',
    name: 'FAANG Software Engineer',
    description: 'Distributed systems, system design, and senior-level technical depth for top-tier SWE roles.',
    category: 'Technical',
    questions: 15,
    inputMode: 'text',
    type: 'marketplace',
    price_usdt: 0.0001,
    installed: false,
    author: 'James Nguyen',
    mentor: {
      name: 'James Nguyen',
      role: 'Principal Engineer · Big Tech',
      avatar: 'JN',
    },
    industries: ['tech'],
    roles: ['software-engineer', 'senior-engineer', 'staff-engineer', 'principal-engineer'],
  },
  {
    id: 'consulting-mbb',
    name: 'Consulting — MBB',
    description: 'Case framing, hypothesis-driven analysis, client management, and structured thinking.',
    category: 'Situational',
    questions: 12,
    inputMode: 'both',
    type: 'marketplace',
    price_usdt: 0.0001,
    installed: false,
    author: 'Sofia Reyes',
    mentor: {
      name: 'Sofia Reyes',
      role: 'Engagement Manager · Top-3 Consulting Firm',
      avatar: 'SR',
    },
    industries: ['consulting'],
    roles: ['consultant', 'associate', 'engagement-manager'],
  },
  {
    id: 'startup-general',
    name: 'Startup All-Rounder',
    description: 'Building under ambiguity, resource constraints, culture, and wearing multiple hats.',
    category: 'Behavioral',
    questions: 10,
    inputMode: 'both',
    type: 'marketplace',
    price_usdt: 0.0001,
    installed: false,
    author: 'Tariq Hassan',
    mentor: {
      name: 'Tariq Hassan',
      role: 'Co-founder · 2× Backed Startup',
      avatar: 'TH',
    },
    industries: ['startup'],
    roles: ['all'],
  },
  {
    id: 'healthcare-admin',
    name: 'Healthcare Administration',
    description: 'Patient flow, regulatory compliance, clinical-administrative collaboration, and operational leadership.',
    category: 'Leadership',
    questions: 8,
    inputMode: 'both',
    type: 'marketplace',
    price_usdt: 0.0001,
    installed: false,
    author: 'Dr. Aisha Kamara',
    mentor: {
      name: 'Dr. Aisha Kamara',
      role: 'Director of Operations · Major Teaching Hospital',
      avatar: 'AK',
    },
    industries: ['healthcare'],
    roles: ['administrator', 'operations-manager', 'director-of-nursing', 'department-head'],
  },
  {
    id: 'banking-finance',
    name: 'Banking & Finance',
    description: 'DCF valuation, credit analysis, capital markets, and financial communication for finance roles.',
    category: 'Technical',
    questions: 12,
    inputMode: 'text',
    type: 'marketplace',
    price_usdt: 0.0001,
    installed: false,
    author: 'Connor Walsh',
    mentor: {
      name: 'Connor Walsh',
      role: 'Associate · Bulge Bracket Bank',
      avatar: 'CW',
    },
    industries: ['finance', 'banking', 'private-equity', 'investment-banking'],
    roles: ['analyst', 'associate', 'portfolio-manager', 'credit-analyst'],
  },
]

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  Behavioral: { bg: 'var(--pale-blue-bg)', fg: 'var(--pale-blue-fg)' },
  Leadership: { bg: 'var(--pale-amber-bg)', fg: 'var(--pale-amber-fg)' },
  Situational: { bg: 'var(--pale-green-bg)', fg: 'var(--pale-green-fg)' },
  Technical:  { bg: 'var(--pale-red-bg)',   fg: 'var(--pale-red-fg)'   },
  Product:    { bg: 'var(--pale-blue-bg)',   fg: 'var(--pale-blue-fg)' },
}

type BuyPhase = 'connecting' | 'paying' | 'ingesting' | 'done' | 'error'

type CatalogStatus = 'idle' | 'syncing' | 'done' | 'error'

export function PackBrowser({ selectedPackIds, onPackChange }: PackBrowserProps) {
  const [packs, setPacks] = useState<Pack[]>(PACKS)
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null)
  const [buyPhase, setBuyPhase] = useState<BuyPhase>('connecting')
  const [buyError, setBuyError] = useState<string | null>(null)
  const [highlightedIds] = useState<string[] | null>(null)
  const [txToast, setTxToast] = useState<{ packName: string; txHash: string } | null>(null)
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>('idle')
  const [catalogUpdated, setCatalogUpdated] = useState(0)

  // Restore purchased packs from localStorage on mount + fetch remote catalog
  useEffect(() => {
    const purchased = JSON.parse(localStorage.getItem('purchasedPacks') || '[]') as string[]
    if (purchased.length > 0) {
      setPacks((prev) =>
        prev.map((p) => (purchased.includes(p.id) ? { ...p, installed: true } : p))
      )
    }

    // Fetch remote catalog to sync metadata
    setCatalogStatus('syncing')
    window.qvacAPI.fetchPackCatalog().then((res) => {
      if (!res.ok || !res.data?.packs) {
        setCatalogStatus('error')
        setTimeout(() => setCatalogStatus('idle'), 4000)
        return
      }
      const remotePacks = res.data.packs
      let updatedCount = 0
      setPacks((prev) => {
        const purchasedIds = JSON.parse(localStorage.getItem('purchasedPacks') || '[]') as string[]
        return prev.map((local) => {
          const remote = remotePacks.find((r) => r.id === local.id)
          if (!remote) return local
          const merged: Pack = {
            ...local,
            name: remote.name ?? local.name,
            description: remote.description ?? local.description,
            category: remote.category ?? local.category,
            questions: remote.questions_count ?? local.questions,
            inputMode: (remote.inputMode as Pack['inputMode']) ?? local.inputMode,
            price_usdt: remote.price_usdt ?? local.price_usdt,
            author: remote.author ?? local.author,
            mentor: remote.mentor ?? local.mentor,
            industries: remote.industries ?? local.industries,
            roles: remote.roles ?? local.roles,
            installed: local.installed || purchasedIds.includes(local.id),
          }
          updatedCount++
          return merged
        })
      })
      setCatalogUpdated(updatedCount)
      setCatalogStatus('done')
      setTimeout(() => setCatalogStatus('idle'), 3500)
    }).catch(() => {
      setCatalogStatus('error')
      setTimeout(() => setCatalogStatus('idle'), 4000)
    })
  }, [])

  const toggle = (id: string) => {
    if (selectedPackIds.includes(id)) {
      const next = selectedPackIds.filter((p) => p !== id)
      if (next.length === 0) return
      onPackChange(next)
    } else {
      onPackChange([...selectedPackIds, id])
    }
  }

  const handleBuyPack = async (packId: string) => {
    setBuyingPackId(packId)
    setBuyPhase('connecting')
    setBuyError(null)

    try {
      // Ensure wallet is initialized
      setBuyPhase('paying')
      const result = await window.qvacAPI.purchasePack(packId)

      if (!result.success) {
        setBuyPhase('error')
        setBuyError(result.error ?? 'Payment failed')
        setTimeout(() => setBuyingPackId(null), 3000)
        return
      }

      // Ingest questions into RAG
      if (result.questions && result.questions.length > 0) {
        setBuyPhase('ingesting')
        await window.qvacAPI.ingestPack(packId, result.questions)
      }

      // Mark as installed
      setBuyPhase('done')
      setPacks((prev) =>
        prev.map((p) => (p.id === packId ? { ...p, installed: true } : p))
      )

      const purchased = JSON.parse(localStorage.getItem('purchasedPacks') || '[]') as string[]
      purchased.push(packId)
      localStorage.setItem('purchasedPacks', JSON.stringify(purchased))

      if (result.txHash) {
        const packName = packs.find((p) => p.id === packId)?.name ?? packId
        setTxToast({ packName, txHash: result.txHash })
        setTimeout(() => setTxToast(null), 8000)
      }

      setTimeout(() => setBuyingPackId(null), 1200)
    } catch (err) {
      setBuyPhase('error')
      setBuyError(err instanceof Error ? err.message : String(err))
      setTimeout(() => setBuyingPackId(null), 3000)
    }
  }

  const handleRemovePack = (packId: string) => {
    setPacks((prev) => prev.map((p) => (p.id === packId ? { ...p, installed: false } : p)))
    const purchased = JSON.parse(localStorage.getItem('purchasedPacks') || '[]') as string[]
    localStorage.setItem('purchasedPacks', JSON.stringify(purchased.filter((id) => id !== packId)))
    onPackChange(selectedPackIds.filter((id) => id !== packId))
  }

  const installedPacks = packs.filter((p) => p.installed)
  const marketplacePacks = packs.filter((p) => !p.installed)

  const orderedMarketplacePacks = highlightedIds
    ? [
        ...marketplacePacks.filter((p) => highlightedIds.includes(p.id)),
        ...marketplacePacks.filter((p) => !highlightedIds.includes(p.id)),
      ]
    : marketplacePacks

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
        style={{ width: 400, height: 400, background: '#C8C5BE', top: '-10%', right: '0%' }}
      />

      <div style={{ maxWidth: 800, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="animate-entry stagger-1" style={{ marginBottom: 28 }}>
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
            Question Packs
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
            Enable packs to include in your session. Buy marketplace packs to expand your coverage.
          </p>
        </div>

        {/* Catalog sync notif */}
        {catalogStatus !== 'idle' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 14px',
              marginBottom: 12,
              background: catalogStatus === 'error' ? 'var(--pale-red-bg)' : 'var(--pale-blue-bg)',
              border: `1px solid ${catalogStatus === 'error' ? 'var(--pale-red-fg)' : 'var(--pale-blue-fg)'}`,
              borderRadius: 'var(--radius-md)',
              opacity: 1,
              transition: 'opacity 300ms ease',
            }}
          >
            {catalogStatus === 'syncing' && (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: 'spin 0.9s linear infinite', flexShrink: 0 }}>
                  <circle cx="6" cy="6" r="4.5" stroke="var(--pale-blue-fg)" strokeWidth="1.5" strokeDasharray="14 8" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 12, color: 'var(--pale-blue-fg)' }}>Syncing catalog from server…</span>
              </>
            )}
            {catalogStatus === 'done' && (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="6" cy="6" r="5" stroke="var(--pale-blue-fg)" strokeWidth="1.3" />
                  <path d="M3.5 6l2 2 3-3" stroke="var(--pale-blue-fg)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 12, color: 'var(--pale-blue-fg)' }}>
                  Catalog updated — {catalogUpdated} packs synced
                </span>
              </>
            )}
            {catalogStatus === 'error' && (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="6" cy="6" r="5" stroke="var(--pale-red-fg)" strokeWidth="1.3" />
                  <path d="M6 3.5v3M6 8v.5" stroke="var(--pale-red-fg)" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 12, color: 'var(--pale-red-fg)' }}>
                  Server offline — showing cached catalog
                </span>
              </>
            )}
          </div>
        )}

        {/* Active summary strip */}
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
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--pale-green-fg)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{selectedPackIds.length}</span>
            {' '}{selectedPackIds.length === 1 ? 'pack' : 'packs'} active —{' '}
            {packs
              .filter((p) => selectedPackIds.includes(p.id))
              .map((p) => p.name)
              .join(', ')}
          </span>
        </div>

        {/* YOUR PACKS */}
        <div className="animate-entry stagger-2" style={{ marginBottom: 48 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--ink)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Your Packs
            </span>
            <span
              className="tag"
              style={{ background: 'var(--pale-green-bg)', color: 'var(--pale-green-fg)', border: 'none' }}
            >
              {installedPacks.length} installed
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {installedPacks.map((pack, i) => {
              const active = selectedPackIds.includes(pack.id)
              return (
                <InstalledPackCard
                  key={pack.id}
                  pack={pack}
                  index={i}
                  active={active}
                  onToggle={() => toggle(pack.id)}
                  onRemove={pack.type === 'marketplace' ? () => handleRemovePack(pack.id) : undefined}
                />
              )
            })}
          </div>
        </div>

        {/* MARKETPLACE */}
        <div className="animate-entry stagger-3">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--ink)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Marketplace
            </span>
            <span
              className="tag"
              style={{ background: 'var(--pale-amber-bg)', color: 'var(--pale-amber-fg)', border: 'none' }}
            >
              {marketplacePacks.length} packs
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {orderedMarketplacePacks.map((pack, i) => (
              <MarketplacePackCard
                key={pack.id}
                pack={pack}
                index={i}
                buying={buyingPackId === pack.id}
                buyPhase={buyingPackId === pack.id ? buyPhase : 'connecting'}
                buyError={buyingPackId === pack.id ? buyError : null}
                highlighted={highlightedIds !== null && highlightedIds.includes(pack.id)}
                onBuy={() => handleBuyPack(pack.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Transaction toast */}
      {txToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 999,
            background: 'var(--ink)',
            color: '#fff',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxWidth: 360,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            animation: 'fadeInUp 200ms ease',
          }}
        >
          <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="7" cy="7" r="6" stroke="#4ade80" strokeWidth="1.5" />
              <path d="M4.5 7l2 2 3-3" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Payment confirmed</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{txToast.packName} unlocked</span>
          <a
            href={`https://plasmascan.to/tx/${txToast.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'Geist Mono, monospace',
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            {txToast.txHash.slice(0, 18)}…{txToast.txHash.slice(-6)} ↗
          </a>
        </div>
      )}
    </div>
  )
}

function InstalledPackCard({
  pack,
  index,
  active,
  onToggle,
  onRemove,
}: {
  pack: Pack
  index: number
  active: boolean
  onToggle: () => void
  onRemove?: () => void
}) {
  const colors = CATEGORY_COLORS[pack.category] ?? { bg: 'var(--surface)', fg: 'var(--ink-secondary)' }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: active ? '1px solid var(--ink)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        boxShadow: active ? '0 0 0 1px var(--ink)' : 'none',
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>{pack.name}</p>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {pack.type === 'built-in' && (
            <span
              className="tag"
              style={{ background: 'var(--pale-green-bg)', color: 'var(--pale-green-fg)', border: 'none' }}
            >
              Free
            </span>
          )}
          {pack.type === 'marketplace' && (
            <span
              className="tag"
              style={{ background: 'var(--pale-amber-bg)', color: 'var(--pale-amber-fg)', border: 'none' }}
            >
              Purchased
            </span>
          )}
          <span
            className="tag"
            style={{ background: colors.bg, color: colors.fg, border: 'none' }}
          >
            {pack.category}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.5, flex: 1 }}>
        {pack.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {pack.inputMode === 'text' && (
          <span className="tag" style={{ background: 'var(--pale-amber-bg)', color: 'var(--pale-amber-fg)', border: 'none' }}>
            Typing only
          </span>
        )}
        {pack.inputMode === 'audio' && (
          <span className="tag" style={{ background: 'var(--pale-red-bg)', color: 'var(--pale-red-fg)', border: 'none' }}>
            Audio only
          </span>
        )}
        {pack.inputMode === 'both' && (
          <span className="tag" style={{ background: 'var(--pale-green-bg)', color: 'var(--pale-green-fg)', border: 'none' }}>
            Text + Audio
          </span>
        )}
      </div>

      {pack.mentor && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--ink)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 600,
              fontFamily: 'Geist Mono, monospace',
              flexShrink: 0,
            }}
          >
            {pack.mentor.avatar}
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
            {pack.mentor.name} · {pack.mentor.role}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'Geist Mono, monospace' }}>
          {pack.questions} questions
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {onRemove && (
            <button
              className="btn-ghost"
              style={{ padding: '5px 10px', fontSize: 12, color: 'var(--pale-red-fg)' }}
              onClick={onRemove}
              title="Remove pack"
            >
              Remove
            </button>
          )}
          {active ? (
            <button
              className="btn-ghost"
              style={{ padding: '5px 14px', fontSize: 12 }}
              onClick={onToggle}
            >
              Disable
            </button>
          ) : (
            <button
              className="btn-primary"
              style={{ padding: '5px 14px', fontSize: 12 }}
              onClick={onToggle}
            >
              Enable
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function MarketplacePackCard({
  pack,
  index,
  buying,
  buyPhase,
  buyError,
  highlighted,
  onBuy,
}: {
  pack: Pack
  index: number
  buying: boolean
  buyPhase: BuyPhase
  buyError: string | null
  highlighted: boolean
  onBuy: () => void
}) {
  const colors = CATEGORY_COLORS[pack.category] ?? { bg: 'var(--surface)', fg: 'var(--ink-secondary)' }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: highlighted ? '1px solid var(--ink)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        boxShadow: highlighted ? '0 0 0 1px var(--ink)' : 'none',
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>{pack.name}</p>
        <span
          className="tag"
          style={{ background: colors.bg, color: colors.fg, border: 'none', flexShrink: 0 }}
        >
          {pack.category}
        </span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.5, flex: 1 }}>
        {pack.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {pack.inputMode === 'text' && (
          <span className="tag" style={{ background: 'var(--pale-amber-bg)', color: 'var(--pale-amber-fg)', border: 'none' }}>
            Typing only
          </span>
        )}
        {pack.inputMode === 'audio' && (
          <span className="tag" style={{ background: 'var(--pale-red-bg)', color: 'var(--pale-red-fg)', border: 'none' }}>
            Audio only
          </span>
        )}
        {pack.inputMode === 'both' && (
          <span className="tag" style={{ background: 'var(--pale-green-bg)', color: 'var(--pale-green-fg)', border: 'none' }}>
            Text + Audio
          </span>
        )}
      </div>

      {pack.mentor && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--ink)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'Geist Mono, monospace',
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}
          >
            {pack.mentor.avatar}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.2 }}>
              {pack.mentor.name}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--ink-muted)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {pack.mentor.role}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'Geist Mono, monospace' }}>
          {pack.questions} questions
        </span>

        <button
          onClick={onBuy}
          disabled={buying}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'inherit',
            color: buying ? 'var(--ink-muted)' : '#ffffff',
            background: buying ? 'var(--border)' : 'var(--ink)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: buying ? 'not-allowed' : 'pointer',
            transition: 'background 150ms ease, transform 100ms ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!buying) (e.currentTarget as HTMLButtonElement).style.background = '#333'
          }}
          onMouseLeave={(e) => {
            if (!buying) (e.currentTarget as HTMLButtonElement).style.background = 'var(--ink)'
          }}
          onMouseDown={(e) => {
            if (!buying) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'
          }}
          onMouseUp={(e) => {
            if (!buying) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          }}
        >
          {buying ? (
            <>
              {buyPhase !== 'error' && <BuySpinner />}
              {buyPhase === 'connecting' && 'Connecting…'}
              {buyPhase === 'paying' && 'Paying…'}
              {buyPhase === 'ingesting' && 'Installing…'}
              {buyPhase === 'done' && 'Done'}
              {buyPhase === 'error' && (buyError ? buyError.slice(0, 28) : 'Failed')}
            </>
          ) : (
            <>
              <span
                style={{
                  display: 'inline-block',
                  padding: '1px 5px',
                  fontSize: 10,
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 3,
                  fontFamily: 'Geist Mono, monospace',
                  letterSpacing: '0.02em',
                }}
              >
                {pack.price_usdt} USDT0
              </span>
              Buy
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function BuySpinner() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14 8" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  )
}
