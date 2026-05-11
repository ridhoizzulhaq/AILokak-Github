import { useState, useEffect } from 'react'

interface LlmOption {
  key: string
  label: string
  size: string
  note: string
  ramGb: number
}

const LLM_OPTIONS: LlmOption[] = [
  { key: 'QWEN3_600M_INST_Q4',      label: 'Qwen3 0.6B',           size: '356 MB',  note: 'Alibaba · fastest, lowest quality',  ramGb: 2  },
  { key: 'QWEN3_1_7B_INST_Q4',      label: 'Qwen3 1.7B',           size: '1.0 GB',  note: 'Alibaba · default, balanced',        ramGb: 4  },
  { key: 'QWEN3_4B_INST_Q4_K_M',    label: 'Qwen3 4B',             size: '2.3 GB',  note: 'Alibaba · better answers',           ramGb: 6  },
  { key: 'QWEN3_8B_INST_Q4_K_M',    label: 'Qwen3 8B',             size: '4.7 GB',  note: 'Alibaba · high quality',             ramGb: 10 },
  { key: 'LLAMA_3_2_1B_INST_Q4_0',  label: 'Llama 3.2 1B',         size: '737 MB',  note: 'Meta · fast alternative',            ramGb: 3  },
  { key: 'GPT_OSS_20B_INST_Q4_K_M', label: 'Unsloth GPT-OSS 20B',  size: '10.8 GB', note: 'Unsloth · largest, 16 GB RAM',      ramGb: 16 },
]

export function ConfigScreen() {
  const [serverUrl, setServerUrl] = useState('')
  const [savedUrl, setSavedUrl] = useState('')
  const [currentModel, setCurrentModel] = useState('')
  const [switching, setSwitching] = useState(false)
  const [switchTarget, setSwitchTarget] = useState<string | null>(null)
  const [switchMsg, setSwitchMsg] = useState('')
  const [switchPct, setSwitchPct] = useState(0)
  const [switchError, setSwitchError] = useState<string | null>(null)
  const [urlSaved, setUrlSaved] = useState(false)

  useEffect(() => {
    window.qvacAPI.getConfig().then((cfg) => {
      setServerUrl(cfg.packServerUrl)
      setSavedUrl(cfg.packServerUrl)
      setCurrentModel(cfg.llmModelKey)
    })
  }, [])

  useEffect(() => {
    if (!switching) return
    const cleanup = window.qvacAPI.onModelProgress(({ message, percentage }) => {
      setSwitchMsg(message)
      setSwitchPct(percentage)
    })
    return cleanup
  }, [switching])

  async function handleSaveUrl(): Promise<void> {
    const trimmed = serverUrl.trim().replace(/\/$/, '')
    await window.qvacAPI.setConfig({ packServerUrl: trimmed })
    setSavedUrl(trimmed)
    setServerUrl(trimmed)
    setUrlSaved(true)
    setTimeout(() => setUrlSaved(false), 2000)
  }

  async function handleSwitchModel(key: string): Promise<void> {
    if (switching || key === currentModel) return
    setSwitching(true)
    setSwitchTarget(key)
    setSwitchError(null)
    setSwitchMsg('Starting…')
    setSwitchPct(0)

    const result = await window.qvacAPI.switchLlmModel(key)
    setSwitching(false)
    setSwitchTarget(null)

    if (result.success) {
      setCurrentModel(key)
    } else {
      setSwitchError(result.error ?? 'Switch failed')
    }
  }

  const urlDirty = serverUrl.trim().replace(/\/$/, '') !== savedUrl

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--canvas)',
        padding: '40px 32px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* Header */}
        <div>
          <h2
            className="font-serif"
            style={{ fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 6 }}
          >
            Settings
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>
            Configure pack server and language model.
          </p>
        </div>

        {/* Pack Server */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
              Pack Server
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              URL of the server that hosts interview question packs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://13.221.44.63:4021"
              style={{
                flex: 1,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--ink)',
                fontFamily: 'Geist Mono, monospace',
                outline: 'none',
                transition: 'border-color 200ms ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#B0ADA8')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={handleSaveUrl}
              disabled={!urlDirty && !urlSaved}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: 13, minWidth: 80, flexShrink: 0 }}
            >
              {urlSaved ? 'Saved' : 'Save'}
            </button>
          </div>

          {!urlDirty && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pale-green-fg)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{savedUrl}</span>
            </div>
          )}
        </section>

        {/* LLM Model */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
              Language Model
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              Switching downloads the new model then unloads the old one. The interview session will be unavailable during this time.
            </p>
          </div>

          {/* Switch progress */}
          {switching && (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{switchMsg}</span>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  {switchPct.toFixed(0)}%
                </span>
              </div>
              <div style={{ height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${switchPct}%`,
                    background: 'var(--ink)',
                    borderRadius: 1,
                    transition: 'width 300ms ease',
                  }}
                />
              </div>
            </div>
          )}

          {switchError && (
            <p style={{ fontSize: 12, color: 'var(--pale-red-fg)' }}>{switchError}</p>
          )}

          {/* Model list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {LLM_OPTIONS.map((opt) => {
              const isCurrent = opt.key === currentModel
              const isTarget = opt.key === switchTarget
              const isDisabled = switching

              return (
                <div
                  key={opt.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    background: isCurrent ? 'var(--surface)' : 'transparent',
                    border: `1px solid ${isCurrent ? 'var(--ink)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    opacity: isDisabled && !isTarget ? 0.5 : 1,
                    transition: 'border-color 150ms ease, opacity 150ms ease',
                  }}
                >
                  {/* Active dot */}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isCurrent ? 'var(--pale-green-fg)' : 'var(--border)',
                      flexShrink: 0,
                    }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: isCurrent ? 500 : 400, color: 'var(--ink)' }}>
                        {opt.label}
                      </span>
                      <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                        {opt.size}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{opt.note}</p>
                  </div>

                  {/* RAM badge */}
                  <span
                    className="tag"
                    style={{
                      background: 'var(--canvas)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink-muted)',
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    {opt.ramGb} GB RAM
                  </span>

                  {/* Action */}
                  {isCurrent ? (
                    <span
                      className="tag"
                      style={{
                        background: 'var(--pale-green-bg)',
                        color: 'var(--pale-green-fg)',
                        border: 'none',
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitchModel(opt.key)}
                      disabled={isDisabled}
                      className="btn-ghost"
                      style={{ padding: '6px 14px', fontSize: 12, flexShrink: 0 }}
                    >
                      {isTarget ? 'Loading…' : 'Use this'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
            Models are cached after first download. Switching back to a previously used model is instant.
          </p>
        </section>
      </div>
    </div>
  )
}
