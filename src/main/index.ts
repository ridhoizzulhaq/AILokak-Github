import { app, shell, BrowserWindow, ipcMain, session, clipboard } from 'electron'
import { join } from 'path'
import { spawn, spawnSync, ChildProcess } from 'child_process'
import { writeFileSync, unlinkSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs'
import { tmpdir } from 'os'

// Suppress EPIPE errors from SDK logger writing to closed stdout/stderr
process.stdout.on('error', (err: NodeJS.ErrnoException) => { if (err.code !== 'EPIPE') throw err })
process.stderr.on('error', (err: NodeJS.ErrnoException) => { if (err.code !== 'EPIPE') throw err })

const is = { dev: process.env.NODE_ENV === 'development' }
const electronApp = {
  setAppUserModelId: (id: string) => {
    if (process.platform === 'win32') app.setAppUserModelId(id)
  }
}
const optimizer = {
  watchWindowShortcuts: (win: BrowserWindow) => {
    win.webContents.on('before-input-event', (_, input) => {
      if (input.key === 'F12') win.webContents.toggleDevTools()
      if (input.key === 'r' && input.control) win.webContents.reload()
    })
  }
}

import { ragDocuments } from './interview-data'
import { initWallet, getWalletInfo, getBalance, purchasePack } from './wallet'

// ── App config ───────────────────────────────────────────────────────────────
interface AppConfig {
  packServerUrl: string
  llmModelKey: string
}

const DEFAULT_CONFIG: AppConfig = {
  packServerUrl: 'http://13.221.44.63:4021',
  llmModelKey: 'QWEN3_1_7B_INST_Q4',
}

let appConfig: AppConfig = { ...DEFAULT_CONFIG }

function getConfigPath(): string {
  return join(app.getPath('userData'), 'ailokak-config.json')
}

function loadConfig(): void {
  try {
    const raw = readFileSync(getConfigPath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    appConfig = { ...DEFAULT_CONFIG, ...parsed }
  } catch {
    appConfig = { ...DEFAULT_CONFIG }
  }
}

function saveConfig(): void {
  writeFileSync(getConfigPath(), JSON.stringify(appConfig, null, 2), 'utf-8')
}
// ─────────────────────────────────────────────────────────────────────────────

function getPacksDir(): string {
  return join(app.getPath('userData'), 'packs')
}

function savePackToDisk(packId: string, questions: unknown[]): void {
  const dir = getPacksDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${packId}.json`), JSON.stringify(questions), 'utf-8')
}

let sdk: typeof import('@qvac/sdk') | null = null

async function getSDK(): Promise<typeof import('@qvac/sdk')> {
  if (!sdk) sdk = await import('@qvac/sdk')
  return sdk
}


interface ModelState {
  llmId: string | null
  whisperId: string | null
  ttsId: string | null
  embeddingsId: string | null
  ocrId: string | null
  ragReady: boolean
}

const state: ModelState = {
  llmId: null,
  whisperId: null,
  ttsId: null,
  embeddingsId: null,
  ocrId: null,
  ragReady: false
}

interface RagEntry {
  id: number
  text: string
  packId: string
  embedding: number[]
}
const ragStore: RagEntry[] = []

// Active transcription session and FFmpeg process
let ffmpegProc: ChildProcess | null = null
let activeSession: { end(): void; destroy(): void } | null = null
let transcribeSessionActive = false

// Persistent piper TTS process
let piperProc: ChildProcess | null = null
let piperReady = false

const PYTHON_BIN = ['/opt/homebrew/bin/python3', '/usr/local/bin/python3', 'python3'].find(
  (p) => { try { return spawnSync(p, ['--version'], { stdio: 'ignore' }).status === 0 } catch { return false } }
) ?? 'python3'

function getPiperModelPath(): string {
  if (is.dev) return join(__dirname, '../../resources/en_US-ryan-high.onnx')
  return join(process.resourcesPath, 'en_US-ryan-high.onnx')
}

function getPiperServerPath(): string {
  if (is.dev) return join(__dirname, '../../resources/piper_server.py')
  return join(process.resourcesPath, 'piper_server.py')
}

function startPiper(): void {
  if (piperProc) return
  piperReady = false
  const proc = spawn(PYTHON_BIN, [getPiperServerPath()], {
    env: { ...process.env, PIPER_MODEL: getPiperModelPath() },
    stdio: ['pipe', 'pipe', 'pipe']
  })
  piperProc = proc
  proc.stderr!.on('data', (d: Buffer) => {
    const msg = d.toString().trim()
    console.log('[Piper stderr]', msg)
    if (msg.includes('READY')) { piperReady = true; console.log('[Piper] ready') }
  })
  proc.on('exit', (code) => {
    console.log('[Piper] exit code:', code)
    piperProc = null
    piperReady = false
    setTimeout(() => { if (!piperProc) startPiper() }, 500)
  })
}

function stopPiper(): void {
  if (piperProc) { piperProc.kill('SIGTERM'); piperProc = null; piperReady = false }
}



async function speakViaPiper(text: string): Promise<void> {
  if (!piperProc || !piperReady) {
    console.log('[Piper] fallback to say')
    spawnSync('say', ['-r', '180', text], { stdio: 'ignore' })
    return
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let bytesNeeded = 0
    let headerRead = false
    let done = false
    const proc = piperProc!
    const onData = (chunk: Buffer): void => {
      if (done) return
      chunks.push(chunk)
      const total = Buffer.concat(chunks)
      if (!headerRead && total.length >= 4) { bytesNeeded = total.readUInt32LE(0); headerRead = true }
      if (headerRead && total.length >= 4 + bytesNeeded) {
        done = true
        proc.stdout!.removeListener('data', onData)
        const wavData = total.slice(4, 4 + bytesNeeded)
        const tmpFile = join(tmpdir(), `piper_${Date.now()}.wav`)
        try { writeFileSync(tmpFile, wavData); spawnSync('afplay', [tmpFile], { stdio: 'ignore' }); unlinkSync(tmpFile); resolve() }
        catch (e) { reject(e) }
      }
    }
    proc.stdout!.on('data', onData)
    proc.stdin!.write(text.replace(/[\r\n]+/g, ' ') + '\n')
  })
}


function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}


function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s+/, '').trim()
}

function isMeaningfulTranscript(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length === 0) return false
  if (trimmed.includes('[No speech detected]')) return false
  if (/^\[[^\]]+\]$/.test(trimmed)) return false
  const letters = trimmed.replace(/[^\p{L}\p{N}]/gu, '')
  if (letters.length < 3) return false
  return true
}

function stopMic(): void {
  transcribeSessionActive = false
  // end session first so VAD can flush final segment
  if (activeSession) {
    try { activeSession.end() } catch { /* ignore */ }
    activeSession = null
  }
  if (ffmpegProc) {
    ffmpegProc.kill('SIGTERM')
    ffmpegProc = null
  }
}

async function startListeningSession(win: BrowserWindow): Promise<void> {
  if (transcribeSessionActive) return
  if (!state.whisperId) return

  transcribeSessionActive = true
  const { transcribeStream } = await getSDK()

  const session = await transcribeStream({ modelId: state.whisperId })
  activeSession = session
  console.log('[MIC] transcribeStream session opened')

  // Start FFmpeg mic capture: avfoundation on macOS, f32le float PCM to stdout
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'avfoundation',
    '-i', ':0',
    '-ar', '16000',
    '-ac', '1',
    '-sample_fmt', 'flt',
    '-f', 'f32le',
    'pipe:1'
  ], { stdio: ['ignore', 'pipe', 'pipe'] })  // pipe stderr to read errors

  ffmpegProc = ffmpeg

  let bytesWritten = 0
  ffmpeg.stdout!.on('data', (chunk: Buffer) => {
    if (!transcribeSessionActive) return
    bytesWritten += chunk.length
    session.write(chunk)
  })

  ffmpeg.stderr!.on('data', (d: Buffer) => {
    const line = d.toString()
    // Only log first few lines (FFmpeg startup info) and errors
    if (line.includes('Error') || line.includes('error') || bytesWritten === 0) {
      console.log('[FFmpeg]', line.slice(0, 200))
    }
  })

  ffmpeg.on('exit', (code) => {
    console.log(`[FFmpeg] exit code=${code} bytesWritten=${bytesWritten}`)
    // session.end() called by stopMic(); if FFmpeg dies on its own, end session too
    if (transcribeSessionActive) {
      try { session.end() } catch { /* ignore */ }
    }
  })

  // Drain transcription results and push to renderer
  ;(async () => {
    try {
      for await (const text of session) {
        console.log('[Whisper] raw transcript:', JSON.stringify(text))
        if (!transcribeSessionActive) break
        if (isMeaningfulTranscript(text)) {
          win.webContents.send('transcription-result', { text: text.trim() })
        }
      }
      console.log('[Whisper] session iterator done')
    } catch (e) {
      console.log('[Whisper] session error:', e)
    }
  })()
}


function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  win.on('ready-to-show', () => win.show())
  win.on('closed', () => { stopMic() })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  loadConfig()
  electronApp.setAppUserModelId('com.interviewai')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  startPiper()

  session.defaultSession.setPermissionRequestHandler((_, permission, callback) => {
    if (permission === 'media') callback(true)
    else callback(false)
  })

  setupIpcHandlers()
  initWallet()
    .then(({ address }) => console.log('[wallet] ready:', address))
    .catch((err) => console.error('[wallet] init failed:', err))
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  stopMic()
  stopPiper()
  await unloadAll()
  if (process.platform !== 'darwin') app.quit()
})

async function unloadAll(): Promise<void> {
  if (!sdk) return
  const { unloadModel } = sdk
  if (state.llmId) { await unloadModel({ modelId: state.llmId, clearStorage: false }); state.llmId = null }
  if (state.whisperId) { await unloadModel({ modelId: state.whisperId, clearStorage: false }); state.whisperId = null }
  if (state.ttsId) { await unloadModel({ modelId: state.ttsId, clearStorage: false }); state.ttsId = null }
  if (state.embeddingsId) { await unloadModel({ modelId: state.embeddingsId, clearStorage: false }); state.embeddingsId = null }
  if (state.ocrId) { await unloadModel({ modelId: state.ocrId, clearStorage: false }); state.ocrId = null }
}

async function setupRag(): Promise<void> {
  if (!state.embeddingsId) return
  const { embed } = await getSDK()
  ragStore.length = 0
  for (const doc of ragDocuments) {
    const { embedding } = await embed({ modelId: state.embeddingsId, text: doc.text })
    ragStore.push({ id: doc.id, text: doc.text, packId: doc.metadata.packId, embedding: embedding as number[] })
  }
  state.ragReady = true
}

async function reingestPurchasedPacks(): Promise<void> {
  if (!state.embeddingsId) return
  const dir = getPacksDir()
  if (!existsSync(dir)) return
  const { embed } = await getSDK()
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  for (const file of files) {
    const packId = file.replace('.json', '')
    try {
      const questions = JSON.parse(readFileSync(join(dir, file), 'utf-8')) as Array<{
        category: string; question: string; ideal_answer: string; evaluation_criteria: string
      }>
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const text = `Category: ${q.category}\nQuestion: ${q.question}\nIdeal Answer: ${q.ideal_answer}\nEvaluation Criteria: ${q.evaluation_criteria}`
        const { embedding } = await embed({ modelId: state.embeddingsId, text })
        ragStore.push({ id: Date.now() + i, text, packId, embedding: embedding as number[] })
      }
      console.log(`[RAG] Re-ingested pack: ${packId} (${questions.length} questions)`)
    } catch (err) {
      console.error(`[RAG] Failed to re-ingest pack ${packId}:`, err)
    }
  }
}

async function searchRagInternal(query: string, topK: number, packIds?: string[]): Promise<string> {
  if (!state.ragReady || ragStore.length === 0 || !state.embeddingsId) return ''
  try {
    const { embed } = await getSDK()
    const { embedding } = await embed({ modelId: state.embeddingsId, text: query })
    const pool = packIds && packIds.length > 0
      ? ragStore.filter((doc) => packIds.includes(doc.packId))
      : ragStore
    if (pool.length === 0) return ''
    const scored = pool.map((doc) => ({
      text: doc.text,
      score: cosineSimilarity(embedding as number[], doc.embedding)
    }))
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, topK).map((r) => r.text).join('\n\n---\n\n')
  } catch {
    return ''
  }
}

function setupIpcHandlers(): void {
  ipcMain.handle('get-models-status', () => ({
    llm: !!state.llmId,
    whisper: !!state.whisperId,
    tts: !!state.ttsId,
    rag: state.ragReady,
    ocr: !!state.ocrId
  }))

  ipcMain.handle('load-all-models', async (event) => {
    const send = (msg: string, pct: number): void =>
      event.sender.send('model-progress', { message: msg, percentage: pct })

    try {
      const {
        loadModel,
        GTE_LARGE_FP16,
        QWEN3_1_7B_INST_Q4,
        WHISPER_TINY,
        VAD_SILERO_5_1_2,
        OCR_LATIN_RECOGNIZER_1,
      } = await getSDK()

      send('Downloading embeddings model...', 0)
      state.embeddingsId = await loadModel({
        modelSrc: GTE_LARGE_FP16,
        modelType: 'embeddings',
        onProgress: (p) => send(`Embeddings: ${p.percentage.toFixed(0)}%`, p.percentage * 0.2)
      })
      send('Building interview knowledge base...', 20)
      await setupRag()
      await reingestPurchasedPacks()
      send('Knowledge base ready.', 25)

      send('Downloading LLM model...', 25)
      const sdkAll = await getSDK()
      const llmSrc = (sdkAll as Record<string, unknown>)[appConfig.llmModelKey] ?? QWEN3_1_7B_INST_Q4
      state.llmId = await loadModel({
        modelSrc: llmSrc as any,
        modelType: 'llm',
        modelConfig: { ctx_size: 4096, device: 'gpu' },
        onProgress: (p) => send(`LLM: ${p.percentage.toFixed(0)}%`, 25 + p.percentage * 0.35)
      })
      send('Interviewer AI ready.', 60)

      send('Downloading Whisper model...', 60)
      state.whisperId = await loadModel({
        modelSrc: WHISPER_TINY,
        modelType: 'whisper',
        modelConfig: {
          vadModelSrc: VAD_SILERO_5_1_2,
          audio_format: 'f32le',
          strategy: 'greedy',
          n_threads: 4,
          language: 'en',
          no_timestamps: true,
          suppress_blank: true,
          suppress_nst: true,
          temperature: 0.0,
          vad_params: {
            threshold: 0.7,
            min_speech_duration_ms: 300,
            min_silence_duration_ms: 700,
            max_speech_duration_s: 15.0,
            speech_pad_ms: 200
          }
        },
        onProgress: (p) => send(`Whisper: ${p.percentage.toFixed(0)}%`, 60 + p.percentage * 0.2)
      })
      send('Speech recognition ready.', 80)

      // TTS handled by Piper (no SDK TTS model needed)

      // OCR model — optional, failure does not abort app
      send('Downloading OCR model...', 82)
      try {
        state.ocrId = await loadModel({
          modelSrc: OCR_LATIN_RECOGNIZER_1,
          modelType: 'ocr',
          modelConfig: {
            langList: ['en'],
            useGPU: true,
            timeout: 30000,
            lowConfidenceThreshold: 0.5,
            recognizerBatchSize: 1,
          },
          onProgress: (p) => send(`OCR: ${p.percentage.toFixed(0)}%`, 82 + p.percentage * 0.16)
        })
        send('OCR ready.', 98)
      } catch (ocrErr) {
        console.warn('[OCR] model load failed (optional):', ocrErr)
      }

      send('All models ready!', 100)
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('unload-all-models', async () => {
    stopMic()
    await unloadAll()
    state.ragReady = false
    ragStore.length = 0
    return { success: true }
  })

  // Start continuous mic listening with transcribeStream
  ipcMain.handle('start-listening', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { error: 'No window' }
    if (!state.whisperId) return { error: 'Whisper not loaded' }
    try {
      await startListeningSession(win)
      return { success: true }
    } catch (err) {
      return { error: String(err) }
    }
  })

  // Stop mic and transcription session
  ipcMain.handle('stop-listening', () => {
    stopMic()
    return { success: true }
  })

  ipcMain.handle(
    'generate-question',
    async (
      event,
      { category, jobDescription, questionNumber, history, selectedPackIds, resumeContext }: {
        category: string
        jobDescription?: string
        questionNumber: number
        history: Array<{ role: string; content: string }>
        selectedPackIds?: string[]
        resumeContext?: string
      }
    ) => {
      if (!state.llmId) return { error: 'LLM not loaded' }
      const { completion } = await getSDK()
      const ragContext = await searchRagInternal(`${category} interview question`, 2, selectedPackIds)

      const systemPrompt = `/no_think
You are a professional job interviewer conducting a practice interview session.
Generate interview question number ${questionNumber}.
Category: ${category}.
${jobDescription ? `Job Description context: ${jobDescription}` : ''}
${resumeContext ? `Candidate resume summary: ${resumeContext}\nTailor the question to probe the candidate's specific experience and skills mentioned in their resume.` : ''}
${ragContext ? `Reference interview questions for inspiration (do not repeat these exactly):\n${ragContext}` : ''}
Be professional but conversational. Ask a specific, thoughtful question.
Output the question text ONLY. Do NOT write "Here's", "Question:", numbers, or any prefix. Start directly with the question word (What, Tell, Describe, How, Can, etc.).`

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: 'What is your next interview question?' }
      ]

      let fullText = ''
      try {
        const result = completion({ modelId: state.llmId, history: messages, stream: true, kvCache: true })
        for await (const token of result.tokenStream) {
          fullText += token
          event.sender.send('completion-token', { token })
        }
        console.log('[LLM] raw question:', JSON.stringify(fullText.trim()))
        const cleaned = stripThinkTags(fullText)
          .replace(/^(here'?s?\s+(is\s+)?(\w+\s+)?question\s*\d*\s*[:.]?\s*)/i, '')
          .replace(/^(question\s*\d*\s*[:.]?\s*)/i, '')
          .replace(/^(next question\s*[:.]?\s*)/i, '')
          .trim()
        console.log('[LLM] cleaned question:', JSON.stringify(cleaned))
        return { question: cleaned }
      } catch (err) {
        return { error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'evaluate-answer',
    async (
      event,
      { question, answer, category, history }: {
        question: string
        answer: string
        category: string
        history: Array<{ role: string; content: string }>
      }
    ) => {
      if (!state.llmId) return { error: 'LLM not loaded' }
      const { completion } = await getSDK()
      const ragContext = await searchRagInternal(`${category} ${question}`, 2)

      const systemPrompt = `/no_think
You are an expert interview coach evaluating a candidate's answer.
${ragContext ? `Reference materials for evaluation:\n${ragContext}\n` : ''}
You must respond in this EXACT format with these section headers:

SCORE: [number 1-10]
STRENGTHS: [what they did well, 1-2 sentences. If none, write "None"]
IMPROVEMENTS: [specific suggestions, 1-2 sentences. If none, write "None"]
GRAMMAR: [Find grammar errors: wrong verb form, wrong tense, missing/wrong article, wrong preposition, subject-verb disagreement. Write each error as one line in this EXACT format with no extra text, no bullets, no numbers, no intro sentence:
wrong phrase -> correct phrase
wrong phrase -> correct phrase
Examples:
I has five years -> I have five years
She work at Google -> She works at Google
I am work here since 2020 -> I have been working here since 2020
If no grammar errors found, write only the single word: Clean]
EXAMPLE: [a stronger version of their answer, 2-3 sentences]

Evaluate based on:
- Content quality: relevance, specificity, use of concrete examples
- Structure: STAR method usage (Situation, Task, Action, Result), logical flow
- Communication: clarity, conciseness, confidence
- Grammar: correct grammar, word choice, and sentence structure

Question: "${question}"
Category: ${category}
Answer: "${answer}"`

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: 'Please evaluate my answer.' }
      ]

      let fullText = ''
      try {
        const result = completion({ modelId: state.llmId, history: messages, stream: true, kvCache: true })
        for await (const token of result.tokenStream) {
          fullText += token
          event.sender.send('completion-token', { token })
        }
        const evalText = stripThinkTags(fullText)
        console.log('[Eval] full evaluation:', JSON.stringify(evalText))
        return { evaluation: evalText }
      } catch (err) {
        return { error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'generate-summary',
    async (
      event,
      { sessionData }: {
        sessionData: Array<{ question: string; answer: string; score: number; evaluation: string }>
      }
    ) => {
      if (!state.llmId) return { error: 'LLM not loaded' }
      const { completion } = await getSDK()

      const avgScore = sessionData.reduce((s, d) => s + d.score, 0) / sessionData.length
      const sessionText = sessionData
        .map((d, i) => `Q${i + 1}: ${d.question}\nAnswer: ${d.answer}\nScore: ${d.score}/10`)
        .join('\n\n')

      const messages = [
        {
          role: 'system',
          content: `You are an expert interview coach. Summarize this practice interview session.
Average score: ${avgScore.toFixed(1)}/10

${sessionText}

Respond in this EXACT format:
OVERALL: [2 sentence overall assessment]
STRENGTHS: [top 2-3 consistent strengths, bullet points]
FOCUS: [top 2-3 areas to improve, bullet points]
TIPS: [3 actionable tips for next session, bullet points]`
        },
        { role: 'user', content: 'Give me my interview session summary.' }
      ]

      let fullText = ''
      try {
        const result = completion({ modelId: state.llmId, history: messages, stream: true, kvCache: true })
        for await (const token of result.tokenStream) {
          fullText += token
          event.sender.send('completion-token', { token })
        }
        return { summary: stripThinkTags(fullText) }
      } catch (err) {
        return { error: String(err) }
      }
    }
  )

  ipcMain.handle('speak-text', async (_, { text }: { text: string }) => {
    try {
      stopMic()
      await speakViaPiper(text)
      return { success: true }
    } catch (err) {
      return { error: String(err) }
    }
  })

  // Ingest purchased pack questions into the RAG vector store
  ipcMain.handle('ingest-pack', async (_event, packId: string, questions: Array<{
    category: string
    question: string
    ideal_answer: string
    evaluation_criteria: string
  }>) => {
    if (!state.embeddingsId) return { success: false, error: 'Embeddings model not loaded' }
    try {
      const { embed } = await getSDK()
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const text = `Category: ${q.category}\nQuestion: ${q.question}\nIdeal Answer: ${q.ideal_answer}\nEvaluation Criteria: ${q.evaluation_criteria}`
        const { embedding } = await embed({ modelId: state.embeddingsId, text })
        ragStore.push({
          id: Date.now() + i,
          text,
          packId,
          embedding: embedding as number[]
        })
      }
      return { success: true, count: questions.length }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // AI-powered pack ranking — returns [{id, score, reason}] for ALL packs
  ipcMain.handle('search-packs-ranked', async (_event, userInput: string, allPacks: Array<{
    id: string
    name: string
    category: string
    industries: string[]
    roles: string[]
    description: string
  }>) => {
    if (!state.llmId) return []
    try {
      const { completion } = await getSDK()
      const packList = allPacks
        .map((p) => `- ID: ${p.id} | Title: ${p.name} | Category: ${p.category} | Industries: ${p.industries?.join(', ')} | Roles: ${p.roles?.join(', ')} | Description: ${p.description}`)
        .join('\n')

      const messages = [
        {
          role: 'system',
          content: `You are an interview pack recommendation engine. Match packs to the user's target role.

INDUSTRY & ROLE KEYWORD MAPPING (use this to identify the best pack):
- "product manager", "pm", "product" → product-management
- "data scientist", "data science", "ml", "machine learning", "analyst" → data-science
- "executive", "vp", "director", "c-suite", "cto", "ceo", "leadership" → executive-presence
- "faang", "google", "meta", "amazon", "apple", "microsoft", "big tech", "software engineer", "swe", "engineer" → faang-swe
- "consulting", "mckinsey", "bcg", "bain", "mbb", "case interview", "strategy" → consulting-mbb
- "startup", "founder", "early stage", "seed", "series a" → startup-general
- "hospital", "medical", "healthcare", "clinical", "doctor", "nurse", "patient", "health" → healthcare-admin
- "banking", "finance", "investment", "wall street", "private equity", "hedge fund", "credit", "valuation" → banking-finance

CRITICAL RULES:
- Use the keyword mapping above to identify the best matching pack — give it score 85-100.
- Give closely related packs scores 50-80.
- Give unrelated packs scores 10-40.
- Never give the best-matched pack a low score or call it "not relevant".

Return ONLY a valid JSON array. No explanation, no markdown, no code fences. Each element:
- "id": pack ID string
- "score": integer 0-100
- "reason": one sentence

Example — user says "i want to work in medical industry":
[{"id":"healthcare-admin","score":95,"reason":"Directly covers hospital operations, patient flow, and healthcare leadership interviews."},{"id":"executive-presence","score":55,"reason":"Senior leadership skills transfer well to healthcare director roles."}]`
        },
        {
          role: 'user',
          content: `Available packs:\n${packList}\n\nUser's target role: "${userInput}"\n\nRank ALL ${allPacks.length} packs by relevance. JSON array only:`
        }
      ]

      const result = completion({ modelId: state.llmId, history: messages, stream: true, kvCache: true })
      let responseText = ''
      for await (const token of result.tokenStream) {
        responseText += token
      }

      console.log('[search-packs-ranked] raw:', JSON.stringify(responseText))
      const cleaned = stripThinkTags(responseText).replace(/```json\n?|```/g, '').trim()

      // Try JSON array first
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]) as Array<{ id: string; score: number; reason: string }>
        } catch { /* fall through */ }
      }

      // Try JSON object {"id": {score, reason}, ...}
      const objMatch = cleaned.match(/\{[\s\S]*\}/)
      if (objMatch) {
        try {
          const obj = JSON.parse(objMatch[0]) as Record<string, { score: number; reason: string } | number>
          // Handle both {"id": {score, reason}} and newline-separated objects
          const result: Array<{ id: string; score: number; reason: string }> = []
          for (const [id, val] of Object.entries(obj)) {
            if (typeof val === 'object' && val !== null && 'score' in val) {
              result.push({ id, score: (val as { score: number; reason: string }).score, reason: (val as { score: number; reason: string }).reason ?? '' })
            }
          }
          if (result.length > 0) return result
        } catch { /* fall through */ }
      }

      // Try newline-separated JSON objects {"id":"x","score":n,"reason":"..."}
      const lines = cleaned.split('\n').filter((l) => l.trim().startsWith('{'))
      if (lines.length > 0) {
        try {
          return lines.map((l) => JSON.parse(l.trim())) as Array<{ id: string; score: number; reason: string }>
        } catch { /* fall through */ }
      }

      console.error('[search-packs-ranked] no JSON found')
      return []
    } catch (err) {
      console.error('[search-packs-ranked] failed:', err)
      return []
    }
  })

  // OCR: extract text from resume image
  ipcMain.handle('ocr-extract', async (_event, imageBuffer: Buffer) => {
    if (!state.ocrId) return { success: false, error: 'OCR model not loaded' }
    try {
      const { ocr } = await getSDK()
      const buf = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer)
      const { blocks } = ocr({ modelId: state.ocrId, image: buf })
      const result = await blocks
      const text = result.map((b) => b.text).join('\n').trim()
      return { success: true, text }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // LLM: analyze extracted resume text into structured profile
  ipcMain.handle('analyze-resume', async (_event, resumeText: string) => {
    if (!state.llmId) return { success: false, error: 'LLM not loaded' }
    try {
      const { completion } = await getSDK()
      const messages = [
        {
          role: 'system',
          content: `/no_think
Analyze the resume text and extract key information. Return ONLY valid JSON in this exact shape, no markdown, no explanation:
{"title":"","experience_years":0,"skills":[],"industries":[],"achievements":[],"summary":""}`
        },
        { role: 'user', content: resumeText }
      ]
      const result = completion({ modelId: state.llmId, history: messages, stream: true, kvCache: true })
      let responseText = ''
      for await (const token of result.tokenStream) {
        responseText += token
      }
      const cleaned = stripThinkTags(responseText).replace(/```json|```/g, '').trim()
      const arrayMatch = cleaned.match(/\{[\s\S]*\}/)
      if (arrayMatch) {
        try {
          return { success: true, profile: JSON.parse(arrayMatch[0]) }
        } catch { /* fall through */ }
      }
      return { success: true, profile: { summary: cleaned } }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // ── Wallet & x402 payment ────────────────────────────────────────────────

  ipcMain.handle('init-wallet', async () => {
    try {
      return await initWallet()
    } catch (err) {
      return { address: '', error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('get-wallet-info', async () => {
    try {
      return await getWalletInfo()
    } catch (err) {
      return { address: '', balanceUsdt0: '0', ready: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('get-balance', async () => {
    try {
      return await getBalance()
    } catch (err) {
      return { usdt0: '0', error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('purchase-pack', async (_event, packId: string) => {
    try {
      const result = await purchasePack(packId, appConfig.packServerUrl)
      if (result.success && result.questions && result.questions.length > 0) {
        savePackToDisk(packId, result.questions)
      }
      return result
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('copy-to-clipboard', (_event, text: string) => {
    clipboard.writeText(text)
  })

  ipcMain.handle('fetch-pack-catalog', async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetch(`${appConfig.packServerUrl}/catalog`, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      return { ok: true, data: await res.json() }
    } catch (err: unknown) {
      clearTimeout(timer)
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // ── Configuration ────────────────────────────────────────────────────────────
  ipcMain.handle('get-config', () => ({ ...appConfig }))

  ipcMain.handle('set-config', (_event, patch: Partial<AppConfig>) => {
    appConfig = { ...appConfig, ...patch }
    saveConfig()
    return { success: true }
  })

  ipcMain.handle('switch-llm-model', async (event, modelKey: string) => {
    const send = (msg: string, pct: number): void =>
      event.sender.send('model-progress', { message: msg, percentage: pct })
    try {
      const sdkMod = await getSDK()
      const modelSrc = (sdkMod as Record<string, unknown>)[modelKey]
      if (!modelSrc) return { success: false, error: `Unknown model: ${modelKey}` }

      if (state.llmId) {
        send('Unloading current model…', 0)
        await sdkMod.unloadModel({ modelId: state.llmId, clearStorage: false })
        state.llmId = null
      }

      send('Downloading model…', 5)
      state.llmId = await sdkMod.loadModel({
        modelSrc: modelSrc as any,
        modelType: 'llm',
        modelConfig: { ctx_size: 4096, device: 'gpu' },
        onProgress: (p) => send(`Downloading: ${p.percentage.toFixed(0)}%`, 5 + p.percentage * 0.93)
      })

      appConfig.llmModelKey = modelKey
      saveConfig()
      send('Model ready!', 100)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // AI-powered pack search — returns ranked array of pack IDs
  ipcMain.handle('search-packs-ai', async (_event, userInput: string, availablePacks: Array<{
    id: string
    name: string
    category: string
    industries: string[]
    roles: string[]
    description: string
  }>) => {
    if (!state.llmId) return []
    try {
      const { completion } = await getSDK()
      const packList = availablePacks
        .map(
          (p) =>
            `- ID: ${p.id} | Title: ${p.name} | Category: ${p.category} | Industries: ${p.industries?.join(', ')} | Roles: ${p.roles?.join(', ')} | Description: ${p.description}`
        )
        .join('\n')

      const messages = [
        {
          role: 'system',
          content:
            'You are a pack recommendation engine. Given a user\'s target job or company, return the most relevant pack IDs. Return ONLY a JSON array of pack ID strings. No explanation, no markdown, no code fences. Example: ["faang-swe","startup-general"]'
        },
        {
          role: 'user',
          content: `Available packs:\n${packList}\n\nUser is preparing for: "${userInput}"\n\nReturn top 1-4 most relevant pack IDs as a JSON array:`
        }
      ]

      const result = completion({ modelId: state.llmId, history: messages, stream: true, kvCache: true })
      let responseText = ''
      for await (const token of result.tokenStream) {
        responseText += token
      }

      console.log('[search-packs-ai] raw response:', JSON.stringify(responseText))
      const cleaned = stripThinkTags(responseText).replace(/```json\n?|```/g, '').trim()
      // extract first [...] array if model added extra text
      const match = cleaned.match(/\[[\s\S]*?\]/)
      if (!match) {
        console.error('[search-packs-ai] no JSON array found in response')
        return []
      }
      const parsed = JSON.parse(match[0]) as string[]
      console.log('[search-packs-ai] parsed ids:', parsed)
      return parsed
    } catch (err) {
      console.error('[search-packs-ai] failed:', err)
      return []
    }
  })
}
