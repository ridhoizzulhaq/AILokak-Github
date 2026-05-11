import { useState, useRef } from 'react'

interface ResumeProfile {
  title?: string
  experience_years?: number
  skills?: string[]
  summary?: string
}

interface HomeScreenProps {
  onStartCustom: (jobDescription: string, resumeContext?: string) => void
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
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null)
  const [resumeText, setResumeText] = useState<string | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    setOcrError(null)
    setResumeProfile(null)
    setResumeText(null)
    try {
      const buffer = await file.arrayBuffer()
      const ocrResult = await window.qvacAPI.ocrExtract(buffer)
      if (!ocrResult.success || !ocrResult.text) {
        setOcrError(ocrResult.error ?? 'Could not read text from image')
        return
      }
      setResumeText(ocrResult.text)
      const analysis = await window.qvacAPI.analyzeResume(ocrResult.text)
      if (analysis.success && analysis.profile) {
        setResumeProfile(analysis.profile)
      }
    } catch (err) {
      setOcrError(String(err))
    } finally {
      setOcrLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function buildResumeContext(): string | undefined {
    if (!resumeText) return undefined
    if (!resumeProfile) return resumeText
    const parts: string[] = []
    if (resumeProfile.title) parts.push(`Role: ${resumeProfile.title}`)
    if (resumeProfile.experience_years) parts.push(`Experience: ${resumeProfile.experience_years} years`)
    if (resumeProfile.skills?.length) parts.push(`Skills: ${resumeProfile.skills.slice(0, 8).join(', ')}`)
    if (resumeProfile.summary) parts.push(`Summary: ${resumeProfile.summary}`)
    return parts.join('. ')
  }

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
          {/* Resume upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
              Resume (optional)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                cursor: ocrLoading ? 'not-allowed' : 'pointer',
                opacity: ocrLoading ? 0.6 : 1,
                transition: 'border-color 200ms ease',
              }}
              onClick={() => !ocrLoading && fileInputRef.current?.click()}
              onMouseEnter={(e) => { if (!ocrLoading) (e.currentTarget as HTMLDivElement).style.borderColor = '#B0ADA8' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--ink-secondary)' }}>
                <path d="M4 1h6l4 4v10H2V1h2z" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinejoin="round" />
                <path d="M10 1v4h4" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinejoin="round" />
                <path d="M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 13, color: 'var(--ink-secondary)', flex: 1 }}>
                {ocrLoading
                  ? 'Reading resume…'
                  : resumeProfile
                    ? resumeProfile.title ?? 'Resume loaded'
                    : 'Upload photo or screenshot of resume'}
              </span>
              {resumeProfile && (
                <button
                  onClick={(e) => { e.stopPropagation(); setResumeProfile(null); setResumeText(null); setOcrError(null) }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    color: 'var(--ink-muted)',
                    fontSize: 14,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleResumeUpload}
              style={{ display: 'none' }}
            />
            {ocrError && (
              <span style={{ fontSize: 12, color: 'var(--pale-red-fg)' }}>{ocrError}</span>
            )}
            {resumeProfile?.skills && resumeProfile.skills.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {resumeProfile.skills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="tag"
                    style={{ background: 'var(--pale-blue-bg)', color: 'var(--pale-blue-fg)', border: 'none', fontSize: 11 }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onStartCustom(jobDescription, buildResumeContext())}
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
