import { useState, useEffect } from 'react'
import { PACKS, type Pack } from './PackBrowser'

interface PackSearchProps {
  selectedPackIds: string[]
  onPackChange: (ids: string[]) => void
}

interface PackResult {
  id: string
  score: number
  reason: string
}

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  Behavioral: { bg: 'var(--pale-blue-bg)', fg: 'var(--pale-blue-fg)' },
  Leadership:  { bg: 'var(--pale-amber-bg)', fg: 'var(--pale-amber-fg)' },
  Situational: { bg: 'var(--pale-green-bg)', fg: 'var(--pale-green-fg)' },
  Technical:   { bg: 'var(--pale-red-bg)',   fg: 'var(--pale-red-fg)'   },
  Product:     { bg: 'var(--pale-blue-bg)',  fg: 'var(--pale-blue-fg)' },
}

export function PackSearch({ selectedPackIds, onPackChange }: PackSearchProps) {
  const [packs, setPacks] = useState<Pack[]>(PACKS)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<PackResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null)
  const [txToast, setTxToast] = useState<{ packName: string; txHash: string } | null>(null)

  useEffect(() => {
    const purchased = JSON.parse(localStorage.getItem('purchasedPacks') || '[]') as string[]
    if (purchased.length > 0) {
      setPacks((prev) => prev.map((p) => (purchased.includes(p.id) ? { ...p, installed: true } : p)))
    }
  }, [])

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setError(null)
    setResults(null)
    try {
      const status = await window.qvacAPI.getModelsStatus()
      if (!status.llm) {
        setError('LLM not loaded yet — wait for models to finish loading.')
        return
      }
      const allPacks = packs.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        industries: p.industries,
        roles: p.roles,
        description: p.description,
      }))
      const ranked = await window.qvacAPI.searchPacksRanked(q, allPacks)
      setResults(ranked)
    } catch (err) {
      console.error('[PackSearch] error:', err)
      setError(`Search failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSearching(false)
    }
  }

  const handleBuy = async (packId: string) => {
    setBuyingPackId(packId)
    try {
      const result = await window.qvacAPI.purchasePack(packId)
      if (!result.success) {
        setBuyingPackId(null)
        return
      }
      if (result.questions && result.questions.length > 0) {
        await window.qvacAPI.ingestPack(packId, result.questions)
      }
      setPacks((prev) => prev.map((p) => (p.id === packId ? { ...p, installed: true } : p)))
      const purchased = JSON.parse(localStorage.getItem('purchasedPacks') || '[]') as string[]
      purchased.push(packId)
      localStorage.setItem('purchasedPacks', JSON.stringify(purchased))
      if (result.txHash) {
        const packName = packs.find((p) => p.id === packId)?.name ?? packId
        setTxToast({ packName, txHash: result.txHash })
        setTimeout(() => setTxToast(null), 8000)
      }
    } catch { /* ignore */ }
    setBuyingPackId(null)
  }

  const handleToggle = (id: string) => {
    if (selectedPackIds.includes(id)) {
      const next = selectedPackIds.filter((p) => p !== id)
      if (next.length === 0) return
      onPackChange(next)
    } else {
      onPackChange([...selectedPackIds, id])
    }
  }

  const packMap = Object.fromEntries(packs.map((p) => [p.id, p]))

  const displayResults: Array<{ pack: Pack; result: PackResult }> = results
    ? results
        .filter((r) => packMap[r.id])
        .map((r) => ({ pack: packMap[r.id], result: r }))
        .sort((a, b) => b.result.score - a.result.score)
    : []

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
        style={{ width: 360, height: 360, background: '#C8C5BE', top: '-8%', right: '2%' }}
      />

      <div style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="animate-entry stagger-1" style={{ marginBottom: 32 }}>
          <h1
            className="font-serif"
            style={{ fontSize: 36, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--ink)', marginBottom: 8 }}
          >
            Find Packs
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
            Describe your target role or company. AI ranks all packs by relevance with reasoning.
          </p>
        </div>

        {/* Search box */}
        <div className="animate-entry stagger-2" style={{ marginBottom: 36 }}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder="e.g. Software engineer at Google, senior level, focusing on distributed systems and system design interviews"
            rows={3}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: 14,
              fontFamily: 'inherit',
              color: 'var(--ink)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.55,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              Press Enter or click Search · Shift+Enter for new line
            </span>
            <button
              className="btn-primary"
              style={{ padding: '9px 22px', fontSize: 13 }}
              onClick={handleSearch}
              disabled={searching || !query.trim()}
            >
              {searching ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <SpinnerIcon /> Analyzing…
                </span>
              ) : 'Search'}
            </button>
          </div>
          {error && (
            <p style={{ fontSize: 13, color: 'var(--pale-red-fg)', marginTop: 10 }}>{error}</p>
          )}
        </div>

        {/* Results */}
        {searching && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        )}

        {!searching && results !== null && (
          <div className="animate-entry stagger-2">
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
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Results
              </span>
              <span className="tag" style={{ background: 'var(--pale-green-bg)', color: 'var(--pale-green-fg)', border: 'none' }}>
                {displayResults.length} packs ranked
              </span>
            </div>

            {displayResults.length === 0 && (
              <p style={{ fontSize: 14, color: 'var(--ink-muted)', padding: '20px 0' }}>
                No packs matched. Try a more specific role or industry.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {displayResults.map(({ pack, result }, i) => (
                <SearchResultCard
                  key={pack.id}
                  pack={pack}
                  result={result}
                  index={i}
                  isActive={selectedPackIds.includes(pack.id)}
                  buying={buyingPackId === pack.id}
                  onToggle={() => handleToggle(pack.id)}
                  onBuy={() => handleBuy(pack.id)}
                />
              ))}
            </div>
          </div>
        )}

        {!searching && results === null && (
          <EmptyState />
        )}
      </div>

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

function SearchResultCard({
  pack,
  result,
  index,
  isActive,
  buying,
  onToggle,
  onBuy,
}: {
  pack: Pack
  result: PackResult
  index: number
  isActive: boolean
  buying: boolean
  onToggle: () => void
  onBuy: () => void
}) {
  const colors = CATEGORY_COLORS[pack.category] ?? { bg: 'var(--surface)', fg: 'var(--ink-secondary)' }
  const score = Math.min(100, Math.max(0, Math.round(result.score)))

  const scoreColor =
    score >= 75 ? 'var(--pale-green-fg)' :
    score >= 45 ? 'var(--pale-amber-fg)' :
    'var(--ink-muted)'

  const scoreBg =
    score >= 75 ? 'var(--pale-green-bg)' :
    score >= 45 ? 'var(--pale-amber-bg)' :
    'var(--border)'

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
        animationDelay: `${index * 50}ms`,
        transition: 'box-shadow 150ms ease',
      }}
    >
      {/* Score column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, width: 52 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-md)',
            background: scoreBg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 600, color: scoreColor, fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 10, color: scoreColor, fontFamily: 'Geist Mono, monospace', opacity: 0.8 }}>%</span>
        </div>
        {/* Score bar */}
        <div style={{ width: 52, height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
          <div
            style={{
              width: `${score}%`,
              height: '100%',
              background: scoreColor,
              borderRadius: 99,
              transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{pack.name}</span>
            <span className="tag" style={{ background: colors.bg, color: colors.fg, border: 'none' }}>
              {pack.category}
            </span>
            {pack.type === 'built-in' && (
              <span className="tag" style={{ background: 'var(--pale-green-bg)', color: 'var(--pale-green-fg)', border: 'none' }}>
                Free
              </span>
            )}
            {pack.installed && pack.type === 'marketplace' && (
              <span className="tag" style={{ background: 'var(--pale-amber-bg)', color: 'var(--pale-amber-fg)', border: 'none' }}>
                Owned
              </span>
            )}
          </div>

          {/* Action */}
          <div style={{ flexShrink: 0 }}>
            {pack.installed ? (
              isActive ? (
                <button className="btn-ghost" style={{ padding: '5px 14px', fontSize: 12 }} onClick={onToggle}>
                  Disable
                </button>
              ) : (
                <button className="btn-primary" style={{ padding: '5px 14px', fontSize: 12 }} onClick={onToggle}>
                  Enable
                </button>
              )
            ) : (
              <button
                disabled={buying}
                onClick={onBuy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  color: buying ? 'var(--ink-muted)' : '#ffffff',
                  background: buying ? 'var(--border)' : 'var(--ink)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: buying ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 150ms ease',
                }}
              >
                {buying ? (
                  <><SpinnerIcon />Installing…</>
                ) : (
                  <><PriceTag price={pack.price_usdt} />Buy</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* AI reasoning */}
        <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.55, marginBottom: 8 }}>
          {result.reason}
        </p>

        {/* Mentor */}
        {pack.mentor && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 10px',
              background: 'var(--canvas)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.2 }}>
                {pack.mentor.name}
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pack.mentor.role}
              </span>
            </div>
          </div>
        )}

        {/* Pack meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'Geist Mono, monospace' }}>
            {pack.questions} questions
          </span>
          <span style={{ fontSize: 12, color: 'var(--border)' }}>·</span>
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
          {pack.type === 'marketplace' && !pack.installed && (
            <>
              <span style={{ fontSize: 12, color: 'var(--border)' }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{pack.price_usdt} USDT0</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PriceTag({ price }: { price: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 5px',
        fontSize: 10,
        fontWeight: 600,
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 3,
        fontFamily: 'Geist Mono, monospace',
      }}
    >
      {price} USDT0
    </span>
  )
}

function SpinnerIcon() {
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

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        gap: 20,
        animationDelay: `${index * 80}ms`,
        opacity: 0.6,
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'var(--border)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: '40%', height: 14, borderRadius: 4, background: 'var(--border)' }} />
        <div style={{ width: '90%', height: 12, borderRadius: 4, background: 'var(--border)' }} />
        <div style={{ width: '70%', height: 12, borderRadius: 4, background: 'var(--border)' }} />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 0',
        gap: 12,
        opacity: 0.5,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21 21l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 14h8M14 10v8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: 14, color: 'var(--ink-secondary)', textAlign: 'center' }}>
        Describe your target role above to find the most relevant packs.
      </p>
    </div>
  )
}
