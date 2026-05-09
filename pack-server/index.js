import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PORT = parseInt(process.env.PORT ?? '4021', 10)
const PAYEE_ADDRESS = process.env.PAYEE_ADDRESS
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? 'https://x402.semanticpay.io'
const PLASMA_NETWORK = 'eip155:9745'

if (!PAYEE_ADDRESS) {
  console.error('ERROR: PAYEE_ADDRESS env variable is required. Set it in .env')
  process.exit(1)
}

const PACK_PRICES = {
  'product-management': 0.0001,
  'data-science': 0.0001,
  'executive-presence': 0.0001,
  'faang-swe': 0.0001,
  'consulting-mbb': 0.0001,
  'startup-general': 0.0001,
  'healthcare-admin': 0.0001,
  'banking-finance': 0.0001,
}

const packIds = Object.keys(PACK_PRICES)

async function buildServer() {
  const { t402ResourceServer, HTTPFacilitatorClient, t402HTTPResourceServer } = await import('@t402/core/server')
  const { registerExactEvmScheme } = await import('@t402/evm/exact/server')

  // Workaround: library reads kind.t402Version but facilitator sends x402Version.
  // Subclass to normalize the /supported response before it reaches initialize().
  class NormalizedFacilitatorClient extends HTTPFacilitatorClient {
    async getSupported() {
      const raw = await super.getSupported()
      return {
        ...raw,
        kinds: (raw.kinds ?? []).map((kind) => ({
          ...kind,
          t402Version: kind.t402Version ?? kind.x402Version,
        })),
      }
    }
    async settle(paymentPayload, requirements, options) {
      const { t402Version, ...restPayload } = paymentPayload
      const normalizedPayload = { ...restPayload, x402Version: t402Version }
      const headers = { 'Content-Type': 'application/json' }
      if (options?.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey
      const response = await fetch(`${this.url}/settle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          x402Version: t402Version,
          paymentPayload: normalizedPayload,
          paymentRequirements: requirements,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`Facilitator settle failed (${response.status}): ${errorText}`)
      }
      const result = await response.json()
      console.log('[facilitator:settle] response:', JSON.stringify(result))
      return result
    }

    async verify(paymentPayload, requirements) {
      // Facilitator expects x402Version, library sends t402Version
      const { t402Version, ...restPayload } = paymentPayload
      const normalizedPayload = { ...restPayload, x402Version: t402Version }
      const { t402Version: rv, ...restReqs } = requirements
      const normalizedReqs = rv !== undefined ? { ...restReqs, x402Version: rv } : requirements
      const verifyBody = {
        x402Version: t402Version,
        paymentPayload: normalizedPayload,
        paymentRequirements: normalizedReqs,
      }
      console.log('[facilitator:verify] sending payer:', normalizedPayload?.payload?.authorization?.from ?? 'unknown')
      const response = await fetch(`${this.url}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyBody),
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.error('[facilitator:verify] HTTP error:', response.status, errorText)
        throw new Error(`Facilitator verify failed (${response.status}): ${errorText}`)
      }
      const result = await response.json()
      if (!result.isValid) {
        console.error('[facilitator:verify] FAILED:', JSON.stringify(result))
      } else {
        console.log('[facilitator:verify] OK, payer:', result.payer ?? 'unknown')
      }
      return result
    }
  }

  // Build route configs: one route per pack
  const routes = {}
  for (const packId of packIds) {
    const priceUsdt0 = PACK_PRICES[packId]
    routes[`GET /packs/${packId}`] = {
      accepts: {
        scheme: 'exact',
        payTo: PAYEE_ADDRESS,
        price: priceUsdt0,
        network: PLASMA_NETWORK,
        maxTimeoutSeconds: 300,
        extra: {
          name: 'USDT0',
          version: '1',
          symbol: 'USDT0',
          tokenType: 'eip3009',
        },
      },
      resource: `Pack: ${packId}`,
      description: `Interview question pack: ${packId}`,
      mimeType: 'application/json',
    }
  }

  // Build resource server
  const facilitator = new NormalizedFacilitatorClient({ url: FACILITATOR_URL })
  const resourceServer = new t402ResourceServer(facilitator)
  registerExactEvmScheme(resourceServer, {})

  const httpResourceServer = new t402HTTPResourceServer(resourceServer, routes)
  await httpResourceServer.initialize()

  // Express app
  const app = express()
  app.use(cors({ origin: '*' }))
  app.use(express.json())

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ ok: true, packs: packIds })
  })

  // Public catalog — metadata only, no payment required
  app.get('/catalog', (_req, res) => {
    const catalog = packIds.map((packId) => {
      try {
        const filePath = join(__dirname, 'packs', `${packId}.json`)
        const data = JSON.parse(readFileSync(filePath, 'utf8'))
        const { questions: _q, ...meta } = data
        return meta
      } catch {
        return { id: packId }
      }
    })
    res.json({ packs: catalog, updatedAt: new Date().toISOString() })
  })

  // Pack routes
  for (const packId of packIds) {
    app.get(`/packs/${packId}`, async (req, res) => {
      try {
        const paymentHeader =
          req.headers['t402-payment-signature'] ??
          req.headers['x-payment-signature'] ??
          undefined

        const context = {
          adapter: {
            getHeader: (name) => {
              const val = req.headers[name.toLowerCase()] ?? undefined
              // Normalize x402Version → t402Version so Zod schema passes
              if (name.toLowerCase() === 'payment-signature' && val) {
                try {
                  const decoded = JSON.parse(Buffer.from(val, 'base64').toString('utf8'))
                  if ('x402Version' in decoded && !('t402Version' in decoded)) {
                    decoded.t402Version = decoded.x402Version
                    delete decoded.x402Version
                    return Buffer.from(JSON.stringify(decoded)).toString('base64')
                  }
                } catch {}
              }
              return val
            },
            getMethod: () => req.method,
            getPath: () => req.path,
            getUrl: () => `${req.protocol}://${req.get('host')}${req.originalUrl}`,
            getAcceptHeader: () => req.headers['accept'] ?? 'application/json',
            getUserAgent: () => req.headers['user-agent'] ?? '',
          },
          path: req.path,
          method: req.method,
          paymentHeader: typeof paymentHeader === 'string' ? paymentHeader : undefined,
        }

        let result
        try {
          result = await httpResourceServer.processHTTPRequest(context)
        } catch (e) {
          console.error(`[pay-throw:${packId}]`, e)
          res.status(500).json({ error: String(e) })
          return
        }

        if (result.type === 'payment-error') {
          const { status, headers, body } = result.response
          console.error(`[pay-error:${packId}] status=${status} body=${JSON.stringify(body)} headers=${JSON.stringify(headers)}`)
          for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
          res.status(status).json(body ?? { error: 'Payment required' })
          return
        }

        if (result.type === 'no-payment-required') {
          // Shouldn't happen for these routes, but serve anyway
          const questionsPath = join(__dirname, 'packs', `${packId}.json`)
          const data = JSON.parse(readFileSync(questionsPath, 'utf8'))
          res.json(data)
          return
        }

        // result.type === 'payment-verified' — settle synchronously to get txHash
        const questionsPath = join(__dirname, 'packs', `${packId}.json`)
        const data = JSON.parse(readFileSync(questionsPath, 'utf8'))

        let txHash = null
        try {
          const settlement = await httpResourceServer.processSettlement(result.paymentPayload, result.paymentRequirements)
          if (settlement.success) {
            txHash = settlement.transaction ?? null
            console.log(`[settle:${packId}] ok txHash=${txHash}`)
          } else {
            console.error(`[settle:${packId}] failed:`, settlement.errorReason)
          }
        } catch (err) {
          console.error(`[settle:${packId}] error:`, err)
        }

        res.json({ ...data, txHash })
      } catch (err) {
        console.error(`[pack:${packId}] error:`, err)
        res.status(500).json({ error: 'Internal server error' })
      }
    })
  }

  return app
}

buildServer()
  .then((app) => {
    app.listen(PORT, () => {
      console.log(`[pack-server] running on http://localhost:${PORT}`)
      console.log(`[pack-server] payee: ${PAYEE_ADDRESS}`)
      console.log(`[pack-server] facilitator: ${FACILITATOR_URL}`)
    })
  })
  .catch((err) => {
    console.error('[pack-server] startup failed:', err)
    process.exit(1)
  })
