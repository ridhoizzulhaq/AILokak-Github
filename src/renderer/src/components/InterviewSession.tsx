import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'

type InterviewCategory = 'behavioral' | 'leadership' | 'situational' | 'technical'

interface QuestionRound {
  question: string
  answer: string
  evaluation: string
  score: number
  category: InterviewCategory
}

type InputMode = 'text' | 'audio' | 'both'

interface InterviewSessionProps {
  jobDescription?: string
  resumeContext?: string
  selectedPackIds?: string[]
  inputMode?: InputMode
  onFinish: (rounds: QuestionRound[]) => void
  onBack?: () => void
}

type SessionPhase =
  | 'generating-question'
  | 'speaking-question'
  | 'waiting-answer'
  | 'listening'
  | 'evaluating'
  | 'showing-feedback'
  | 'done'

const PACK_TO_CATEGORY: Record<string, InterviewCategory> = {
  'behavioral-core': 'behavioral',
  'leadership-fundamentals': 'leadership',
  'situational-judgment': 'situational',
  'software-engineering': 'technical',
}
const DEFAULT_CATEGORIES: InterviewCategory[] = ['behavioral', 'leadership', 'situational', 'technical']
const TOTAL_QUESTIONS = 5

function parseEvaluation(text: string): { score: number; strengths: string; improvements: string; grammar: string; example: string } {
  const scoreMatch = text.match(/\*{0,2}SCORE\*{0,2}:\s*(\d+)/i)
  const strengthsMatch = text.match(/\*{0,2}STRENGTHS\*{0,2}:\s*(.+?)(?=\*{0,2}IMPROVEMENTS\*{0,2}:|$)/is)
  const improvementsMatch = text.match(/\*{0,2}IMPROVEMENTS\*{0,2}:\s*(.+?)(?=\*{0,2}gramm\w*[^:\n]*\*{0,2}:|\*{0,2}EXAMPLE\*{0,2}:|\*{0,2}Overall\*{0,2}:|$)/is)
  const grammarMatch = text.match(/\*{0,2}gramm(?:ar|atical)\w*[^:\n]*\*{0,2}:\s*(.+?)(?=\*{0,2}example\*{0,2}:|\*{0,2}overall\*{0,2}:|$)/is)
  const exampleMatch = text.match(/\*{0,2}EXAMPLE\*{0,2}:\s*(.+?)(?=\*{0,2}Overall\*{0,2}:|$)/is)

  return {
    score: scoreMatch ? parseInt(scoreMatch[1]) : 5,
    strengths: strengthsMatch ? strengthsMatch[1].trim() : '',
    improvements: improvementsMatch ? improvementsMatch[1].trim() : '',
    grammar: grammarMatch ? grammarMatch[1].trim() : '',
    example: exampleMatch ? exampleMatch[1].trim() : ''
  }
}

function ScoreBar({ score }: { score: number }) {
  const bg = score >= 8 ? 'var(--pale-green-fg)' : score >= 6 ? '#C8A95A' : 'var(--pale-red-fg)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            width: `${(score / 10) * 100}%`,
            background: bg,
            borderRadius: 1,
            transition: 'width 700ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
      <span
        className="font-mono score-num"
        style={{ fontSize: 14, fontWeight: 500, color: bg, width: 28, textAlign: 'right' }}
      >
        {score}
      </span>
    </div>
  )
}

function splitSentences(text: string): string[] {
  const clean = text.replace(/\*{1,2}none\*{1,2}/gi, '').replace(/^none\.?$/im, '').trim()
  if (!clean) return []
  return clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
}

interface GrammarPair { wrong: string; correct: string }

function parseGrammarPairs(text: string): GrammarPair[] {
  if (!text) return []
  // Strip markdown bold, then strip leading list prefixes (-, •, *, 1.) from each line
  const cleaned = text
    .replace(/\*\*/g, '')
    .replace(/^\s*(?:\*+|-+|•|\d+\.)\s*/gm, '')
    .trim()
  const firstLine = cleaned.split('\n')[0].trim()
  if (/^(clean|no (major )?issues?|none|no errors?)\.?$/i.test(firstLine)) return []

  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean)
  const pairs: GrammarPair[] = []
  const QUOTE = /^["""'`‘’“”]|["""'`‘’“”]$/g

  for (const line of lines) {
    const m = line.match(/^["""'`“”]?(.+?)["""'`“”]?\s*(?:->|=>|→|—>|–>)\s*["""'`“”]?(.+?)["""'`“”]?\s*$/)
    if (m) {
      pairs.push({
        wrong: m[1].trim().replace(QUOTE, '').trim(),
        correct: m[2].trim().replace(QUOTE, '').trim()
      })
    }
  }

  return pairs
}

// Raw prose fallback — used when AI ignores arrow format
function extractGrammarProse(text: string): string {
  if (!text) return ''
  const cleaned = text.replace(/\*\*/g, '').replace(/^\*+\s*/gm, '• ').trim()
  const firstLine = cleaned.split('\n')[0].trim()
  if (/^(clean|no (major )?issues?|none)\.?$/i.test(firstLine)) return ''
  // Strip embedded EXAMPLE section if parser missed it
  return cleaned.replace(/\*{0,2}EXAMPLE\*{0,2}:[\s\S]*/i, '').trim()
}

function scoreLabel(score: number): string {
  if (score >= 9) return 'Excellent'
  if (score >= 7) return 'Strong'
  if (score >= 5) return 'Good'
  if (score >= 3) return 'Developing'
  return 'Needs work'
}

function ProseFeedback({
  label,
  text,
  accentColor,
  bg,
  icon,
}: {
  label: string
  text: string
  accentColor: string
  bg: string
  icon: ReactNode
}) {
  return (
    <div style={{ background: bg, borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: accentColor }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 13, color: accentColor, lineHeight: 1.65 }}>{text}</p>
    </div>
  )
}

function GrammarFeedback({ pairs, prose }: { pairs: GrammarPair[]; prose: string }) {
  const isClean = pairs.length === 0 && !prose

  return (
    <div
      style={{
        background: isClean ? 'var(--pale-green-bg)' : 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: isClean ? 0 : 12 }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          {isClean ? (
            <path d="M3 8l3.5 3.5L13 5" stroke="var(--pale-green-fg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M8 3v6M8 11.5v.5" stroke="var(--pale-amber-fg)" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
          color: isClean ? 'var(--pale-green-fg)' : 'var(--ink-secondary)',
        }}>
          Grammar {isClean ? '— Clean' : pairs.length > 0 ? `— ${pairs.length} correction${pairs.length > 1 ? 's' : ''}` : '— Notes'}
        </span>
      </div>

      {/* Visual pairs (arrow format) */}
      {pairs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pairs.map((pair, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: 'var(--canvas)',
                borderRadius: 'var(--radius-sm)',
                flexWrap: 'wrap',
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 13,
                  color: 'var(--pale-red-fg)',
                  background: 'var(--pale-red-bg)',
                  padding: '1px 7px',
                  borderRadius: 4,
                  textDecoration: 'line-through',
                  textDecorationColor: 'var(--pale-red-fg)',
                }}
              >
                {pair.wrong}
              </span>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ flexShrink: 0 }}>
                <path d="M1 5h11M9 1l3 4-3 4" stroke="var(--ink-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span
                className="font-mono"
                style={{
                  fontSize: 13,
                  color: 'var(--pale-green-fg)',
                  background: 'var(--pale-green-bg)',
                  padding: '1px 7px',
                  borderRadius: 4,
                  fontWeight: 500,
                }}
              >
                {pair.correct}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Prose fallback — AI didn't follow arrow format */}
      {pairs.length === 0 && prose && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {prose.split('\n').filter(Boolean).map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 2, borderRadius: 1, background: 'var(--pale-amber-fg)', flexShrink: 0, marginTop: 4, alignSelf: 'stretch', minHeight: 14 }} />
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
                {line.replace(/^•\s*/, '')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExampleAnswer({ text }: { text: string }) {
  return (
    <div
      style={{
        borderLeft: '3px solid var(--ink)',
        paddingLeft: 18,
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'block', marginBottom: 10 }}>
        Stronger answer
      </span>
      <p
        className="font-serif"
        style={{
          fontSize: 16,
          color: 'var(--ink)',
          lineHeight: 1.6,
          letterSpacing: '-0.01em',
          fontStyle: 'italic',
        }}
      >
        {text}
      </p>
    </div>
  )
}

export function InterviewSession({ jobDescription, resumeContext, selectedPackIds, inputMode = 'both', onFinish, onBack }: InterviewSessionProps) {
  const [phase, setPhase] = useState<SessionPhase>('generating-question')
  const [currentQ, setCurrentQ] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentEvaluation, setCurrentEvaluation] = useState('')
  const [parsedEval, setParsedEval] = useState<ReturnType<typeof parseEvaluation> | null>(null)
  const [rounds, setRounds] = useState<QuestionRound[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [textAnswer, setTextAnswer] = useState('')
  const [useTextInput, setUseTextInput] = useState(inputMode === 'text')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [confirmExit, setConfirmExit] = useState(false)

  const cleanupTokens = useRef<(() => void) | null>(null)
  const cleanupTranscription = useRef<(() => void) | null>(null)
  const historyRef = useRef<Array<{ role: string; content: string }>>([])
  const phaseRef = useRef<SessionPhase>('generating-question')
  const liveTranscriptRef = useRef('')

  useEffect(() => { phaseRef.current = phase }, [phase])

  const activeCategories: InterviewCategory[] = (selectedPackIds && selectedPackIds.length > 0)
    ? selectedPackIds.map((id) => PACK_TO_CATEGORY[id]).filter(Boolean) as InterviewCategory[]
    : DEFAULT_CATEGORIES
  const category = activeCategories[currentQ % activeCategories.length]
  const progressPct = (currentQ / TOTAL_QUESTIONS) * 100

  const evaluateAnswer = useCallback(async (answer: string): Promise<void> => {
    setPhase('evaluating')
    setStreamingText('')
    setStatusMsg('Evaluating your answer…')

    cleanupTokens.current?.()
    cleanupTokens.current = window.qvacAPI.onCompletionToken(({ token }) => {
      setStreamingText((prev) => prev + token)
    })

    historyRef.current.push({ role: 'user', content: answer })

    const result = await window.qvacAPI.evaluateAnswer({
      question: currentQuestion,
      answer,
      category,
      history: historyRef.current
    })

    cleanupTokens.current?.()
    cleanupTokens.current = null

    if (result.error || !result.evaluation) {
      setStatusMsg(`Evaluation failed: ${result.error}`)
      setPhase('waiting-answer')
      return
    }

    const evaluation = result.evaluation
    setCurrentEvaluation(evaluation)
    const parsed = parseEvaluation(evaluation)
    console.log('[Parse] grammar field:', JSON.stringify(parsed.grammar))
    setParsedEval(parsed)
    setStreamingText('')

    historyRef.current.push({ role: 'assistant', content: evaluation })

    setPhase('showing-feedback')
    setStatusMsg('')
  }, [currentQuestion, category])

  const generateQuestion = useCallback(async () => {
    setPhase('generating-question')
    setStreamingText('')
    setStatusMsg('Generating question…')

    cleanupTokens.current?.()
    cleanupTokens.current = window.qvacAPI.onCompletionToken(({ token }) => {
      setStreamingText((prev) => prev + token)
    })

    const result = await window.qvacAPI.generateQuestion({
      category,
      jobDescription,
      questionNumber: currentQ + 1,
      history: historyRef.current,
      selectedPackIds,
      resumeContext,
    })

    cleanupTokens.current?.()
    cleanupTokens.current = null

    if (result.error || !result.question) {
      setStatusMsg(`Error: ${result.error}`)
      return
    }

    const question = result.question
    setCurrentQuestion(question)
    setStreamingText('')
    historyRef.current.push(
      { role: 'assistant', content: question },
      { role: 'user', content: 'I understand. Please give me a moment to answer.' }
    )

    setPhase('speaking-question')
    setStatusMsg('Speaking…')
    try {
      await window.qvacAPI.speakText(question)
    } catch {
      // TTS failure non-fatal
    }

    setPhase('waiting-answer')
    setStatusMsg(
      inputMode === 'audio' ? 'Press the microphone to record your answer'
      : inputMode === 'text' ? 'Type your answer below'
      : 'Press the microphone to record, or type below'
    )
  }, [currentQ, category, jobDescription, resumeContext, inputMode])

  useEffect(() => {
    generateQuestion()
    return () => { cleanupTokens.current?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ])

  useEffect(() => {
    return () => {
      cleanupTranscription.current?.()
      window.qvacAPI.stopListening()
    }
  }, [])

  const handleStartListening = async (): Promise<void> => {
    liveTranscriptRef.current = ''
    setLiveTranscript('')
    setPhase('listening')
    setStatusMsg('Listening — press again to stop')

    cleanupTranscription.current?.()
    cleanupTranscription.current = window.qvacAPI.onTranscriptionResult(({ text }) => {
      if (phaseRef.current !== 'listening') return
      liveTranscriptRef.current = liveTranscriptRef.current
        ? liveTranscriptRef.current + ' ' + text
        : text
      setLiveTranscript(liveTranscriptRef.current)
    })

    await window.qvacAPI.startListening()
  }

  const handleStopListening = async (): Promise<void> => {
    await window.qvacAPI.stopListening()
    await new Promise((r) => setTimeout(r, 800))

    cleanupTranscription.current?.()
    cleanupTranscription.current = null

    const answer = liveTranscriptRef.current.trim()
    liveTranscriptRef.current = ''
    setLiveTranscript('')

    if (!answer) {
      setPhase('waiting-answer')
      setStatusMsg('No speech detected. Try again or type your answer.')
      return
    }

    setCurrentAnswer(answer)
    await evaluateAnswer(answer)
  }

  const handleTextSubmit = async (): Promise<void> => {
    if (!textAnswer.trim()) return
    setCurrentAnswer(textAnswer.trim())
    await evaluateAnswer(textAnswer.trim())
  }

  const handleNext = (): void => {
    if (!parsedEval) return
    const newRound: QuestionRound = {
      question: currentQuestion,
      answer: currentAnswer,
      evaluation: currentEvaluation,
      score: parsedEval.score,
      category
    }
    const newRounds = [...rounds, newRound]
    setRounds(newRounds)
    setTextAnswer('')
    setUseTextInput(false)
    setParsedEval(null)
    setCurrentAnswer('')
    setCurrentEvaluation('')

    if (currentQ + 1 >= TOTAL_QUESTIONS) {
      onFinish(newRounds)
    } else {
      setCurrentQ((q) => q + 1)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column' }}>

      {/* Confirm exit overlay */}
      {confirmExit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 28px 24px',
              width: 340,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>
                End this session?
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
                Progress will be lost. Completed rounds ({rounds.length}) won't be saved.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="btn-ghost"
                style={{ padding: '8px 16px', fontSize: 13 }}
                onClick={() => setConfirmExit(false)}
              >
                Keep going
              </button>
              <button
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 13, background: 'var(--pale-red-fg)' }}
                onClick={() => {
                  setConfirmExit(false)
                  onBack?.()
                }}
              >
                End session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {onBack && (
          <button
            onClick={() => setConfirmExit(true)}
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
          style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)', marginRight: 4 }}
        >
          AILokak
        </span>

        <div style={{ flex: 1, maxWidth: 240 }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <span
          className="font-mono"
          style={{ fontSize: 12, color: 'var(--ink-muted)' }}
        >
          {currentQ + 1} / {TOTAL_QUESTIONS}
        </span>

        <span
          className="tag"
          style={{ background: 'var(--canvas)', border: '1px solid var(--border)', color: 'var(--ink-secondary)' }}
        >
          {category}
        </span>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          padding: '32px 24px 48px',
          maxWidth: 680,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Question card */}
        <div
          className="animate-entry card"
          style={{ padding: '20px 22px' }}
        >
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ paddingTop: 2 }}>
              {/* Interviewer dot */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'var(--canvas)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="3" stroke="var(--ink-secondary)" strokeWidth="1.5" />
                  <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="var(--ink-secondary)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>
                Interviewer
              </p>
              {phase === 'generating-question' ? (
                <p style={{ color: 'var(--ink-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                  {streamingText || (
                    <span style={{ color: 'var(--ink-muted)', fontStyle: 'italic' }}>Generating question…</span>
                  )}
                </p>
              ) : (
                <p
                  className="font-serif"
                  style={{ color: 'var(--ink)', fontSize: 18, lineHeight: 1.45, letterSpacing: '-0.01em' }}
                >
                  {currentQuestion}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        {statusMsg && phase !== 'showing-feedback' && (
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center' }}>{statusMsg}</p>
        )}

        {/* Waiting — answer input */}
        {phase === 'waiting-answer' && (
          <div className="animate-entry" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Audio-only mode: mic only, no text toggle */}
            {inputMode === 'audio' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <button onClick={handleStartListening} className="mic-btn" aria-label="Start recording">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Press to speak</p>
              </div>
            )}

            {/* Text-only mode: textarea only, no mic toggle */}
            {inputMode === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here…"
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    fontSize: 14,
                    color: 'var(--ink)',
                    resize: 'none',
                    height: 128,
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                    transition: 'border-color 200ms ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#B0ADA8')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textAnswer.trim()}
                  className="btn-primary"
                >
                  Submit answer
                </button>
              </div>
            )}

            {/* Both mode: mic default, can switch to text */}
            {inputMode === 'both' && !useTextInput && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <button onClick={handleStartListening} className="mic-btn" aria-label="Start recording">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Press to speak</p>
                <button
                  onClick={() => setUseTextInput(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 12,
                    color: 'var(--ink-muted)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--border)',
                  }}
                >
                  Type instead
                </button>
              </div>
            )}

            {inputMode === 'both' && useTextInput && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here…"
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    fontSize: 14,
                    color: 'var(--ink)',
                    resize: 'none',
                    height: 128,
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                    transition: 'border-color 200ms ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#B0ADA8')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setUseTextInput(false)} className="btn-ghost" style={{ flex: 1 }}>
                    Use mic
                  </button>
                  <button
                    onClick={handleTextSubmit}
                    disabled={!textAnswer.trim()}
                    className="btn-primary"
                    style={{ flex: 2 }}
                  >
                    Submit answer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Listening */}
        {phase === 'listening' && (
          <div className="animate-entry" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <div className="ring-pulse" style={{ pointerEvents: 'none' }} />
              <button
                onClick={handleStopListening}
                className="mic-btn recording"
                aria-label="Stop recording"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <rect x="2" y="2" width="14" height="14" rx="2" />
                </svg>
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--pale-red-fg)' }}>Recording — press to stop</p>

            {liveTranscript && (
              <div className="card" style={{ width: '100%', padding: '14px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6 }}>
                  Live transcript
                </p>
                <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>{liveTranscript}</p>
              </div>
            )}
          </div>
        )}

        {/* Evaluating */}
        {phase === 'evaluating' && (
          <div className="animate-entry card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: streamingText ? 12 : 0 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'var(--ink-muted)',
                      animation: `entry 800ms ease ${i * 160}ms infinite alternate`,
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{statusMsg}</p>
            </div>
            {streamingText && (
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>{streamingText}</p>
            )}
          </div>
        )}

        {/* Your answer */}
        {currentAnswer && phase === 'showing-feedback' && (
          <div className="animate-entry card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'var(--pale-blue-bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="3" stroke="var(--pale-blue-fg)" strokeWidth="1.5" />
                  <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="var(--pale-blue-fg)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6 }}>
                  Your answer
                </p>
                <p style={{ fontSize: 14, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>{currentAnswer}</p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback */}
        {phase === 'showing-feedback' && parsedEval && (
          <div className="animate-entry" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Score — prominent display */}
            <div
              className="card"
              style={{
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              {/* Big score number */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <span
                  className="font-mono score-num"
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: parsedEval.score >= 8 ? 'var(--pale-green-fg)' : parsedEval.score >= 6 ? '#C8A95A' : 'var(--pale-red-fg)',
                    display: 'block',
                  }}
                >
                  {parsedEval.score}
                </span>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>out of 10</span>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 52, background: 'var(--border)', flexShrink: 0 }} />

              {/* Label + bar */}
              <div style={{ flex: 1 }}>
                <p
                  className="font-serif"
                  style={{
                    fontSize: 20,
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    color: parsedEval.score >= 8 ? 'var(--pale-green-fg)' : parsedEval.score >= 6 ? '#C8A95A' : 'var(--pale-red-fg)',
                    marginBottom: 10,
                  }}
                >
                  {scoreLabel(parsedEval.score)}
                </p>
                <ScoreBar score={parsedEval.score} />
              </div>
            </div>

            {/* Strengths */}
            {parsedEval.strengths && !parsedEval.strengths.match(/^none\.?$/i) && (
              <ProseFeedback
                label="Strengths"
                text={parsedEval.strengths.replace(/\*\*/g, '').trim()}
                accentColor="var(--pale-green-fg)"
                bg="var(--pale-green-bg)"
                icon={
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 5" stroke="var(--pale-green-fg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              />
            )}

            {/* Improvements */}
            {parsedEval.improvements && !parsedEval.improvements.match(/^none\.?$/i) && (
              <ProseFeedback
                label="Areas to improve"
                text={parsedEval.improvements.replace(/\*\*/g, '').trim()}
                accentColor="var(--pale-amber-fg)"
                bg="var(--pale-amber-bg)"
                icon={
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v8M8 13.5v.5" stroke="var(--pale-amber-fg)" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M5 8l3 3 3-3" stroke="var(--pale-amber-fg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              />
            )}

            {/* Grammar */}
            {(() => {
              const pairs = parseGrammarPairs(parsedEval.grammar)
              const prose = pairs.length === 0 ? extractGrammarProse(parsedEval.grammar) : ''
              return <GrammarFeedback pairs={pairs} prose={prose} />
            })()}

            {/* Example answer — blockquote */}
            {parsedEval.example && (
              <ExampleAnswer text={parsedEval.example} />
            )}

            <button
              onClick={handleNext}
              className="btn-primary"
              style={{ width: '100%', padding: '14px 24px', marginTop: 2, fontSize: 14 }}
            >
              {currentQ + 1 >= TOTAL_QUESTIONS ? 'View session summary' : 'Next question'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
