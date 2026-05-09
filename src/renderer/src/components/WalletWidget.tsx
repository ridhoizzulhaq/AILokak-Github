import { useState, useEffect, useCallback } from 'react'

function shortenAddress(addr: string): string {
  if (addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatUsdt0(raw: string): string {
  const n = Number(raw)
  if (isNaN(n)) return '—'
  const usdt0 = n / 1_000_000
  if (usdt0 === 0) return '0 USDT0'
  if (usdt0 < 0.0001) return `${usdt0.toFixed(8)} USDT0`
  if (usdt0 < 1) return `${usdt0.toFixed(6)} USDT0`
  return `${usdt0.toFixed(4)} USDT0`
}

export function WalletWidget() {
  const [address, setAddress] = useState<string>('')
  const [balance, setBalance] = useState<string>('—')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const info = await window.qvacAPI.getWalletInfo()
      if (info.error) {
        setError(info.error)
        return
      }
      setAddress(info.address)
      setBalance(formatUsdt0(info.balanceUsdt0))
      setReady(info.ready)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  const handleCopy = async () => {
    if (!address) return
    try {
      await window.qvacAPI.copyToClipboard(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  if (error) {
    return (
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, color: '#9F2F2D', fontFamily: 'Geist Mono, monospace' }}>
          Wallet error
        </span>
      </div>
    )
  }

  if (!ready && !address) {
    return (
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'Geist Mono, monospace' }}>
          Initializing wallet…
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--ink-muted)' }}>
          <rect x="1" y="3.5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <path d="M1 6h12" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="10.5" cy="9" r="1" fill="currentColor" />
        </svg>
        <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Wallet</span>
      </div>

      <button
        title={address}
        onClick={handleCopy}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'Geist Mono, SF Mono, monospace',
          fontSize: 11,
          color: copied ? 'var(--pale-green-fg)' : 'var(--ink-secondary)',
          transition: 'color 150ms ease',
        }}
      >
        {copied ? 'Copied!' : address ? shortenAddress(address) : '—'}
      </button>

      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--ink)',
          fontFamily: 'Geist Mono, SF Mono, monospace',
          letterSpacing: '-0.01em',
        }}
      >
        {balance}
      </span>
    </div>
  )
}
