import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const PLASMA_RPC = process.env.PLASMA_RPC ?? 'https://rpc.plasma.to'
const PLASMA_NETWORK = 'eip155:9745'
const PLASMA_CHAIN = 'plasma'
const PLASMA_USDT0 = '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb'
const PACK_SERVER_URL = process.env.PACK_SERVER_URL ?? 'http://13.221.44.63:4021'

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

async function getUsdt0BalanceDirect(address: string): Promise<bigint> {
  const { createPublicClient, http } = await import('viem')
  const client = createPublicClient({ transport: http(PLASMA_RPC) })
  return client.readContract({
    address: PLASMA_USDT0 as `0x${string}`,
    abi: ERC20_BALANCE_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  }) as Promise<bigint>
}

let seedFile: string | null = null

function getSeedFile(): string {
  if (!seedFile) seedFile = join(app.getPath('userData'), 'wallet-seed.txt')
  return seedFile
}

type WalletInstance = import('@t402/wdk').T402WDK

let wallet: WalletInstance | null = null

async function getWDKModules() {
  const [{ T402WDK }, WDK, WalletManagerEvm] = await Promise.all([
    import('@t402/wdk') as Promise<typeof import('@t402/wdk')>,
    import('@tetherto/wdk').then((m) => m.default ?? m),
    import('@tetherto/wdk-wallet-evm').then((m) => m.default ?? m),
  ])
  return { T402WDK, WDK, WalletManagerEvm }
}

async function getPaymentModules() {
  const [{ ExactEvmScheme }, { t402Client, t402HTTPClient }, { decodePaymentRequiredHeader }] = await Promise.all([
    import('@t402/evm') as Promise<typeof import('@t402/evm')>,
    import('@t402/core/client') as Promise<typeof import('@t402/core/client')>,
    import('@t402/core/http') as Promise<typeof import('@t402/core/http')>,
  ])
  return { ExactEvmScheme, t402Client, t402HTTPClient, decodePaymentRequiredHeader }
}

function loadOrCreateSeed(T402WDK: import('@t402/wdk').T402WDK & { generateSeedPhrase?: () => string } | (new (...args: unknown[]) => unknown) & { generateSeedPhrase: () => string }): string {
  const path = getSeedFile()
  if (existsSync(path)) return readFileSync(path, 'utf8').trim()
  const seed = (T402WDK as unknown as { generateSeedPhrase(): string }).generateSeedPhrase()
  writeFileSync(path, seed, { mode: 0o600 })
  return seed
}

export async function initWallet(): Promise<{ address: string }> {
  const { T402WDK, WDK, WalletManagerEvm } = await getWDKModules()

  T402WDK.registerWDK(WDK as never, WalletManagerEvm as never)

  const seed = loadOrCreateSeed(T402WDK as never)
  wallet = new T402WDK(seed, { [PLASMA_CHAIN]: PLASMA_RPC })

  const address = await wallet.getAddress(PLASMA_CHAIN)
  return { address }
}

export async function getWalletInfo(): Promise<{
  address: string
  balanceUsdt0: string
  ready: boolean
}> {
  if (!wallet) return { address: '', balanceUsdt0: '0', ready: false }
  const address = await wallet.getAddress(PLASMA_CHAIN)
  const rawBalance = await getUsdt0BalanceDirect(address)
  return {
    address,
    balanceUsdt0: String(rawBalance),
    ready: true,
  }
}

export async function getBalance(): Promise<{ usdt0: string }> {
  if (!wallet) return { usdt0: '0' }
  const address = await wallet.getAddress(PLASMA_CHAIN)
  const raw = await getUsdt0BalanceDirect(address)
  return { usdt0: (Number(raw) / 1_000_000).toFixed(6) }
}

export async function purchasePack(packId: string, serverUrl?: string): Promise<{
  success: boolean
  questions?: Array<{
    category: string
    question: string
    ideal_answer: string
    evaluation_criteria: string
  }>
  txHash?: string
  error?: string
}> {
  if (!wallet) return { success: false, error: 'Wallet not initialized' }

  try {
    const { ExactEvmScheme, t402Client, t402HTTPClient, decodePaymentRequiredHeader } = await getPaymentModules()

    const signer = await wallet.getSigner(PLASMA_CHAIN)
    const evmScheme = new ExactEvmScheme(signer as never)

    const client = t402Client.fromConfig({
      schemes: [{ network: PLASMA_NETWORK as never, client: evmScheme }],
    })
    const httpClient = new t402HTTPClient(client)

    const url = `${serverUrl ?? PACK_SERVER_URL}/packs/${packId}`

    // First request — expect 402
    const firstRes = await fetch(url)

    if (firstRes.status === 200) {
      const data = await firstRes.json()
      return { success: true, questions: data.questions }
    }

    if (firstRes.status !== 402) {
      return { success: false, error: `Server returned ${firstRes.status}` }
    }

    // Decode payment requirements from 402 header
    const prHeader =
      firstRes.headers.get('payment-required') ??
      firstRes.headers.get('t402-payment-required') ??
      firstRes.headers.get('x-payment-required')
    if (!prHeader) {
      return { success: false, error: 'Missing payment-required header' }
    }

    const paymentRequired = decodePaymentRequiredHeader(prHeader)
    const paymentPayload = await httpClient.createPaymentPayload(paymentRequired)
    console.log('[payment:payload]', JSON.stringify(paymentPayload, null, 2))
    const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload)
    console.log('[payment:headers]', JSON.stringify(paymentHeaders, null, 2))

    // Second request — with payment headers
    const paidRes = await fetch(url, {
      headers: { ...paymentHeaders, Accept: 'application/json' },
    })

    const rawText = await paidRes.text()
    console.log('[payment:response]', paidRes.status, rawText)

    if (!paidRes.ok) {
      return { success: false, error: `Payment failed: ${paidRes.status} ${rawText}` }
    }

    const data = JSON.parse(rawText)
    return { success: true, questions: data.questions, txHash: data.txHash ?? undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
