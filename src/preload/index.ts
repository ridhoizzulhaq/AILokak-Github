import { contextBridge, ipcRenderer } from 'electron'

const qvacAPI = {
  // Model management
  getModelsStatus: () => ipcRenderer.invoke('get-models-status'),
  loadAllModels: () => ipcRenderer.invoke('load-all-models'),
  unloadAllModels: () => ipcRenderer.invoke('unload-all-models'),

  // Interview
  generateQuestion: (args: {
    category: string
    jobDescription?: string
    questionNumber: number
    history: Array<{ role: string; content: string }>
    selectedPackIds?: string[]
    resumeContext?: string
  }) => ipcRenderer.invoke('generate-question', args),

  evaluateAnswer: (args: {
    question: string
    answer: string
    category: string
    history: Array<{ role: string; content: string }>
  }) => ipcRenderer.invoke('evaluate-answer', args),

  generateSummary: (args: {
    sessionData: Array<{ question: string; answer: string; score: number; evaluation: string }>
  }) => ipcRenderer.invoke('generate-summary', args),

  speakText: (text: string) => ipcRenderer.invoke('speak-text', { text }),

  ingestPack: (packId: string, questions: Array<{
    category: string
    question: string
    ideal_answer: string
    evaluation_criteria: string
  }>) => ipcRenderer.invoke('ingest-pack', packId, questions),

  searchPacksAI: (userInput: string, availablePacks: Array<{
    id: string
    name: string
    category: string
    industries: string[]
    roles: string[]
    description: string
  }>) => ipcRenderer.invoke('search-packs-ai', userInput, availablePacks),

  searchPacksRanked: (userInput: string, allPacks: Array<{
    id: string
    name: string
    category: string
    industries: string[]
    roles: string[]
    description: string
  }>) => ipcRenderer.invoke('search-packs-ranked', userInput, allPacks),

  // Wallet & x402
  initWallet: () => ipcRenderer.invoke('init-wallet'),
  getWalletInfo: () => ipcRenderer.invoke('get-wallet-info'),
  getBalance: () => ipcRenderer.invoke('get-balance'),
  purchasePack: (packId: string) => ipcRenderer.invoke('purchase-pack', packId),

  // Mic control (FFmpeg-based, main process owns mic)
  startListening: () => ipcRenderer.invoke('start-listening'),
  stopListening: () => ipcRenderer.invoke('stop-listening'),

  ocrExtract: (imageBuffer: ArrayBuffer) =>
    ipcRenderer.invoke('ocr-extract', Buffer.from(imageBuffer)),
  analyzeResume: (resumeText: string) =>
    ipcRenderer.invoke('analyze-resume', resumeText),

  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (patch: { packServerUrl?: string; llmModelKey?: string }) =>
    ipcRenderer.invoke('set-config', patch),
  switchLlmModel: (modelKey: string) => ipcRenderer.invoke('switch-llm-model', modelKey),

  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  fetchPackCatalog: () => ipcRenderer.invoke('fetch-pack-catalog'),

  // Events
  onModelProgress: (cb: (data: { message: string; percentage: number }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { message: string; percentage: number }) => cb(data)
    ipcRenderer.on('model-progress', handler)
    return () => ipcRenderer.off('model-progress', handler)
  },

  onCompletionToken: (cb: (data: { token: string }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { token: string }) => cb(data)
    ipcRenderer.on('completion-token', handler)
    return () => ipcRenderer.off('completion-token', handler)
  },

  onTranscriptionResult: (cb: (data: { text: string }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { text: string }) => cb(data)
    ipcRenderer.on('transcription-result', handler)
    return () => ipcRenderer.off('transcription-result', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('qvacAPI', qvacAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.qvacAPI = qvacAPI
}
