interface QvacAPI {
  getModelsStatus: () => Promise<{ llm: boolean; whisper: boolean; tts: boolean; rag: boolean }>
  loadAllModels: () => Promise<{ success: boolean; error?: string }>
  unloadAllModels: () => Promise<{ success: boolean }>
  generateQuestion: (args: {
    category: string
    jobDescription?: string
    questionNumber: number
    history: Array<{ role: string; content: string }>
    selectedPackIds?: string[]
  }) => Promise<{ question?: string; error?: string }>
  evaluateAnswer: (args: {
    question: string
    answer: string
    category: string
    history: Array<{ role: string; content: string }>
  }) => Promise<{ evaluation?: string; error?: string }>
  generateSummary: (args: {
    sessionData: Array<{ question: string; answer: string; score: number; evaluation: string }>
  }) => Promise<{ summary?: string; error?: string }>
  speakText: (text: string) => Promise<{ success?: boolean; error?: string }>
  startListening: () => Promise<{ success?: boolean; error?: string }>
  stopListening: () => Promise<{ success?: boolean }>
  ingestPack: (
    packId: string,
    questions: Array<{
      category: string
      question: string
      ideal_answer: string
      evaluation_criteria: string
    }>
  ) => Promise<{ success: boolean; count?: number; error?: string }>
  searchPacksAI: (
    userInput: string,
    availablePacks: Array<{
      id: string
      name: string
      category: string
      industries: string[]
      roles: string[]
      description: string
    }>
  ) => Promise<string[]>
  searchPacksRanked: (
    userInput: string,
    allPacks: Array<{
      id: string
      name: string
      category: string
      industries: string[]
      roles: string[]
      description: string
    }>
  ) => Promise<Array<{ id: string; score: number; reason: string }>>
  initWallet: () => Promise<{ address: string; error?: string }>
  getWalletInfo: () => Promise<{ address: string; balanceUsdt0: string; ready: boolean; error?: string }>
  getBalance: () => Promise<{ usdt0: string; error?: string }>
  purchasePack: (packId: string) => Promise<{
    success: boolean
    questions?: Array<{
      category: string
      question: string
      ideal_answer: string
      evaluation_criteria: string
    }>
    txHash?: string
    error?: string
  }>
  copyToClipboard: (text: string) => Promise<void>
  fetchPackCatalog: () => Promise<{
    ok: boolean
    data?: {
      packs: Array<{
        id: string
        name: string
        description?: string
        category?: string
        questions_count?: number
        inputMode?: string
        price_usdt?: number
        author?: string
        mentor?: { name: string; role: string; avatar: string }
        industries?: string[]
        roles?: string[]
      }>
      updatedAt: string
    }
    error?: string
  }>
  onModelProgress: (cb: (data: { message: string; percentage: number }) => void) => () => void
  onCompletionToken: (cb: (data: { token: string }) => void) => () => void
  onTranscriptionResult: (cb: (data: { text: string }) => void) => () => void
}

interface Window {
  qvacAPI: QvacAPI
}
