---
noteId: "ee7ff9f049ec11f18740d1937f94b065"
tags: []

---

# AILokak — Documentation

## Table of Contents

1. [What Is AILokak](#1-what-is-ailokak)
2. [User Guide](#2-user-guide)
3. [Architecture Overview](#3-architecture-overview)
4. [Component Reference](#4-component-reference)
5. [Interview Packs](#5-interview-packs)
6. [Payment System (x402 / T402)](#6-payment-system-x402--t402)
7. [AI Models](#7-ai-models)
8. [Data & Storage](#8-data--storage)
9. [Pack Server](#9-pack-server)
10. [Developer Setup](#10-developer-setup)
11. [Known Issues & Workarounds](#11-known-issues--workarounds)

---

## 1. What Is AILokak

AILokak is a fully offline, local-first AI interview coach built as an Electron desktop app. It uses on-device AI models (LLM, speech recognition, TTS, embeddings) to simulate realistic job interviews, evaluate answers, and provide coaching feedback — with no cloud dependency for core features.

Premium interview question packs are sold via a micropayment paywall using USDT0 on the Plasma blockchain (EIP-3009 gasless transfer). Pack purchase is the only step that requires internet.

**Key properties:**
- All AI runs locally via the QVAC SDK
- No account required
- Conversation history persists across sessions (localStorage)
- Wallet is self-custodial (seed phrase stored locally)
- Pack data lives on-device after purchase

---

## 2. User Guide

### First Launch

1. Open the app.
2. On the home screen, click **Load Models**. The app downloads and caches:
   - Embeddings model (GTE Large FP16)
   - LLM (Llama 3.2 1B Instruct Q4_0)
   - Whisper Tiny (speech recognition + VAD)
   - Supertonic2 TTS (neural text-to-speech)
3. Download progress is shown as a percentage. This only happens once — models are cached at `~/.qvac/models/`.

### Starting an Interview

1. Go to the **Home** tab.
2. Select a category (Behavioral, Technical, Leadership, Situational).
3. Optionally paste a job description for context-aware questions.
4. Click **Start Interview**.
5. The interviewer asks a question (spoken aloud via TTS).
6. Answer by:
   - Typing in the text box and pressing Enter, **or**
   - Clicking the mic button and speaking (Whisper transcribes your answer).
7. After each answer the AI evaluates it: Score, Strengths, Improvements, Grammar check, and an example answer.
8. Continue until you end the session.
9. A session summary is generated at the end with overall score, consistent strengths, and actionable tips.

### Buying a Pack

1. Go to the **Packs** tab or use **Search**.
2. Browse or search for a marketplace pack.
3. Click **Buy** on a pack (price: 0.0001 USDT0).
4. The app uses your built-in wallet to pay automatically.
5. On success, the pack is installed and its questions are ingested into the RAG knowledge base.

> **Requirement:** You need USDT0 on the Plasma chain (`eip155:9745`) in your wallet. Get the wallet address from the bottom-left wallet widget.

### Wallet

- Address and balance shown in the bottom-left sidebar widget.
- Click the address to copy it to clipboard.
- Balance refreshes every 30 seconds.
- Wallet seed is stored at: `~/Library/Application Support/interview-ai/wallet-seed.txt` (Mac).
- Keep this file safe — it is your private key backup.

### Session History

- Go to the **History** tab to review past sessions.
- Each session shows questions asked, your answers, scores, and evaluations.
- History persists across app restarts.
- To clear all history: click the clear button inside the History screen.

### AI-Powered Pack Search

- Type your target role (e.g. "senior product manager at fintech startup") in the Search tab.
- The local LLM ranks all available packs by relevance with a match score (0–100%) and one-line reasoning.
- Keyword mapping ensures direct role/industry matches always score highest (e.g. "medical" → Healthcare Administration, "product manager" → Product Management).
- No internet required — fully on-device inference.
- Search results show mentor profile cards identical to the marketplace view.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F12 | Toggle DevTools |
| Ctrl+R | Reload renderer |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                         │
│                                                         │
│  ┌──────────────┐   IPC    ┌──────────────────────────┐ │
│  │   Renderer   │ ◄──────► │      Main Process        │ │
│  │  (React/TS)  │          │  index.ts + wallet.ts    │ │
│  └──────────────┘          └──────────┬───────────────┘ │
│                                       │                 │
│                            ┌──────────▼───────────────┐ │
│                            │       QVAC SDK           │ │
│                            │  LLM / Whisper / TTS /   │ │
│                            │  Embeddings (on-device)  │ │
│                            └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │ pack purchase only
         ▼
┌─────────────────────┐
│   Pack Server       │   node index.js (localhost:4021)
│   (Express + T402)  │
└──────────┬──────────┘
           │ settle
           ▼
┌─────────────────────┐
│  Facilitator        │   https://x402.semanticpay.io
│  (x402.semanticpay) │
└──────────┬──────────┘
           │ transferWithAuthorization
           ▼
┌─────────────────────┐
│  Plasma Blockchain  │   eip155:9745
│  USDT0 Contract     │   0xB8CE59FC3717...
└─────────────────────┘
```

### Communication Flow

- **Renderer ↔ Main**: Electron IPC (`ipcRenderer.invoke` / `ipcMain.handle`)
- **Main ↔ QVAC SDK**: Direct JS import, runs in-process
- **Main ↔ Pack Server**: HTTP fetch (localhost:4021)
- **Pack Server ↔ Facilitator**: HTTP POST (x402.semanticpay.io/verify, /settle)
- **Facilitator ↔ Plasma**: RPC broadcast of `transferWithAuthorization`

---

## 4. Component Reference

### Renderer (`src/renderer/src/components/`)

| File | Role |
|------|------|
| `Layout.tsx` | Shell: sidebar nav, wallet widget, page routing |
| `HomeScreen.tsx` | Model loading, interview session launch |
| `InterviewSession.tsx` | Active interview: question/answer loop, evaluation display |
| `PackBrowser.tsx` | Marketplace grid with mentor cards, buy flow, pack state management |
| `PackSearch.tsx` | AI-powered pack search UI with mentor cards and real purchase flow |
| `HistoryScreen.tsx` | Past session browser |
| `WalletWidget.tsx` | Address display, balance, copy-to-clipboard |

### Main Process (`src/main/`)

| File | Role |
|------|------|
| `index.ts` | App entry, IPC handlers, model orchestration, RAG, TTS, mic |
| `wallet.ts` | Wallet init, balance query, pack purchase payment flow |
| `interview-data.ts` | Built-in RAG document seed data |

### Preload (`src/preload/`)

| File | Role |
|------|------|
| `index.ts` | Exposes `window.qvacAPI` to renderer via `contextBridge` |
| `index.d.ts` | TypeScript types for `window.qvacAPI` |

### Pack Server (`pack-server/`)

| File | Role |
|------|------|
| `index.js` | Express server with T402 paywall middleware |
| `packs/*.json` | Interview question JSON files (one per pack) |
| `.env` | `PAYEE_ADDRESS`, `PORT`, `FACILITATOR_URL` |

---

## 5. Interview Packs

### Built-in (Free, Always Installed)

| ID | Name | Category | Questions |
|----|------|----------|-----------|
| `behavioral-core` | Behavioral Core | Behavioral | 12 |
| `leadership-fundamentals` | Leadership Fundamentals | Leadership | 8 |
| `situational-judgment` | Situational Judgment | Situational | 10 |
| `software-engineering` | Software Engineering | Technical | 8 |

### Marketplace (0.0001 USDT0 each)

Each marketplace pack is attributed to a fictional mentor with name, role, and initials avatar displayed on the pack card.

| ID | Name | Category | Q | Mentor | Role |
|----|------|----------|---|--------|------|
| `product-management` | Product Management | Product | 10 | Priya Menon | Senior PM · Series B Fintech |
| `data-science` | Data Science | Technical | 9 | Daniel Osei | Staff Data Scientist · Top Tech Company |
| `executive-presence` | Executive Presence | Leadership | 7 | Margaret Lin | VP Engineering · SaaS Scale-up |
| `faang-swe` | FAANG Software Engineer | Technical | 15 | James Nguyen | Principal Engineer · Big Tech |
| `consulting-mbb` | Consulting — MBB | Situational | 12 | Sofia Reyes | Engagement Manager · Top-3 Consulting Firm |
| `startup-general` | Startup All-Rounder | Behavioral | 10 | Tariq Hassan | Co-founder · 2× Backed Startup |
| `healthcare-admin` | Healthcare Administration | Leadership | 8 | Dr. Aisha Kamara | Director of Operations · Major Teaching Hospital |
| `banking-finance` | Banking & Finance | Technical | 12 | Connor Walsh | Associate · Bulge Bracket Bank |

> **Note:** All mentor names and roles are fictional. No affiliation with any real company or person.

### How Packs Work

1. **Before purchase**: Pack metadata (name, description, price) is hardcoded in the renderer. No server call needed to browse.
2. **On purchase**: App hits pack server → 402 response → app signs EIP-3009 authorization → resends with payment header → server verifies with facilitator → returns questions JSON → saves to disk → ingests into RAG.
3. **After purchase**: Questions saved to `~/Library/Application Support/interview-ai/packs/{packId}.json`. Pack ID written to `localStorage['purchasedPacks']`. Questions embedded in `ragStore`.
4. **On next launch**: `reingestPurchasedPacks()` reads all saved JSON files and re-embeds into RAG automatically after models load.

### Removing a Purchased Pack

Two steps required — disk file and localStorage must both be cleared.

**Step 1 — Delete questions file from disk:**

```bash
# Replace {packId} with the pack ID (e.g. faang-swe)
rm ~/Library/Application\ Support/interview-ai/packs/{packId}.json
```

To remove all purchased packs:
```bash
rm -rf ~/Library/Application\ Support/interview-ai/packs/
```

**Step 2 — Clear UI state (DevTools Console, press F12):**

```js
// Remove one pack
const packs = JSON.parse(localStorage.getItem('purchasedPacks') || '[]')
localStorage.setItem('purchasedPacks', JSON.stringify(packs.filter(id => id !== 'faang-swe')))
location.reload()

// Remove all purchased packs
localStorage.removeItem('purchasedPacks'); location.reload()
```

> **Note:** Removing a pack does not refund the USDT0 payment. On-chain transfers are irreversible.

---

## 6. Payment System (x402 / T402)

### Protocol

AILokak uses **T402** — Tether's fork of the [x402 HTTP payment protocol](https://x402.org). Pack content is gated behind HTTP 402 paywalls. Payment is made with **USDT0** on the **Plasma** chain using **EIP-3009 gasless transfers** (`transferWithAuthorization`).

### Payment Flow (Step by Step)

```
1. App → GET /packs/{id}
   ← 402 + PAYMENT-REQUIRED header (base64 JSON with payment requirements)

2. App decodes requirements:
   { scheme: "exact", network: "eip155:9745", amount: "100",
     asset: "0xB8CE59FC3717...", payTo: "0xA6438651...",
     extra: { name: "USDT0", version: "1", tokenType: "eip3009" } }

3. App signs EIP-3009 authorization via EIP-712:
   domain: { name: "USDT0", version: "1", chainId: 9745,
             verifyingContract: "0xB8CE59FC3717..." }
   message: { from, to: payTo, value: 100, validAfter, validBefore, nonce }

4. App → GET /packs/{id} + PAYMENT-SIGNATURE header

5. Server calls facilitator /verify → OK

6. Server calls facilitator /settle (synchronous — waits for txHash)
   Facilitator broadcasts transferWithAuthorization on Plasma
   USDT0 transferred from payer to payee
   Returns: { success: true, transaction: "0x...", network: "eip155:9745" }

7. Server returns pack JSON + txHash to client:
   { questions: [...], txHash: "0x..." }

8. Client shows toast notification:
   "Payment confirmed" + pack name + clickable txHash → https://plasmascan.to/tx/{hash}
```

### Transaction Explorer

Every successful purchase shows a toast (bottom-right, 8 seconds) with:
- Pack name confirmed
- Truncated txHash linking to `https://plasmascan.to/tx/{txHash}`

### Key Addresses

| Role | Address |
|------|---------|
| Payer (app wallet) | Generated from seed, shown in wallet widget |
| Payee (merchant) | `0xA6438651A44842812082d3bE7E4BB9C67eCF3d6C` |
| Facilitator signer | `0x747d1239d6d65c3a1DbABc63897D7e0f8692Ba89` |
| USDT0 contract | `0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb` |
| Plasma RPC | `https://rpc.plasma.to` |
| Facilitator API | `https://x402.semanticpay.io` |

### EIP-712 Domain (Critical)

The USDT0 contract on Plasma uses `name: "USDT0"` (not `"TetherToken"` as in the library default). The library's `TOKEN_REGISTRY` has the wrong name for `eip155:9745`. A manual patch is required:

```
pack-server/node_modules/@t402/evm/dist/esm/chunk-FJPMVWD7.mjs
pack-server/node_modules/@t402/evm/dist/cjs/exact/server/index.js

Change: name: "TetherToken"  →  name: "USDT0"   (Plasma Mainnet entry only)
```

This patch must be re-applied after `npm install` in pack-server. See [Known Issues](#11-known-issues--workarounds).

---

## 7. AI Models

All models run locally via the **QVAC SDK** (`@qvac/sdk`). Models are downloaded once and cached at `~/.qvac/models/`.

| Model | Purpose | Size (approx) |
|-------|---------|---------------|
| GTE Large FP16 | Embeddings for RAG | ~670 MB |
| Llama 3.2 1B Instruct Q4_0 | Question generation, evaluation, summarization, pack ranking | ~800 MB |
| Whisper Tiny + Silero VAD | Speech-to-text + voice activity detection | ~150 MB |
| Supertonic2 TTS (7 files) | Neural text-to-speech (interviewer voice) | ~600 MB |

### RAG (Retrieval-Augmented Generation)

The app maintains an in-memory vector store (`ragStore`) of interview question documents. At startup, built-in questions from `interview-data.ts` are embedded. On pack purchase, pack questions are additionally embedded.

When generating a question or evaluating an answer, the top-2 most similar RAG documents are retrieved via cosine similarity and injected into the LLM prompt as reference material.

**RAG persistence:** Built-in documents are re-ingested automatically on every startup. Purchased pack questions are saved to disk at purchase time and re-ingested via `reingestPurchasedPacks()` after models load. Console log: `[RAG] Re-ingested pack: {packId} ({n} questions)`.

---

## 8. Data & Storage

| Data | Location | Persists? |
|------|----------|-----------|
| AI models | `~/.qvac/models/` | Yes (disk) |
| Wallet seed | `~/Library/Application Support/interview-ai/wallet-seed.txt` | Yes (disk) |
| Purchased pack IDs | `localStorage['purchasedPacks']` | Yes (Electron localStorage) |
| Session history | `localStorage['ailokak_session_history']` | Yes (Electron localStorage) |
| Purchased pack questions | `~/Library/Application Support/interview-ai/packs/{packId}.json` | Yes (disk) |
| RAG vector store | In-memory (`ragStore` array) | No (rebuilt from disk on model load) |
| Interview state | React component state | No (cleared on restart) |

### Reset Purchased Packs (DevTools)

Press **F12** in the app → Console tab:
```js
localStorage.removeItem('purchasedPacks'); location.reload()
```

### Reset All Local Data

```js
localStorage.clear(); location.reload()
```

---

## 9. Pack Server

Standalone Express server that serves interview question packs behind a T402 HTTP paywall.

### Running

```bash
cd pack-server
cp .env.example .env   # set PAYEE_ADDRESS
npm install
node index.js
```

Default port: `4021`. Configure via `PORT` env var.

### Environment Variables

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `PAYEE_ADDRESS` | Yes | — | EVM address to receive USDT0 payments |
| `PORT` | No | `4021` | HTTP port |
| `FACILITATOR_URL` | No | `https://x402.semanticpay.io` | T402 facilitator endpoint |

### Routes

| Route | Auth | Description |
|-------|------|-------------|
| `GET /health` | None | Returns `{ ok: true, packs: [...] }` |
| `GET /packs/:id` | 0.0001 USDT0 | Verifies payment, settles on-chain, returns `{ questions: [...], txHash: "0x..." }` |

### Pack JSON Format

```json
{
  "questions": [
    {
      "category": "Technical",
      "question": "...",
      "ideal_answer": "...",
      "evaluation_criteria": "..."
    }
  ]
}
```

---

## 10. Developer Setup

### Prerequisites

- Node.js 18+
- Python 3 at `/opt/homebrew/bin/python3` (for Piper TTS server)
- Piper TTS binary + voice model at `resources/en_US-ryan-high.onnx`

### Install & Run

```bash
# Main app
npm install
npm run dev

# Pack server (separate terminal)
cd pack-server
npm install
node index.js
```

### Build

```bash
npm run build:mac   # macOS
npm run build:win   # Windows
```

### Key Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev mode with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run lint` | ESLint |

### IPC API (`window.qvacAPI`)

All renderer ↔ main communication goes through this API, exposed via `contextBridge` in `src/preload/index.ts`.

| Method | Description |
|--------|-------------|
| `loadAllModels()` | Download and load all AI models |
| `unloadAllModels()` | Unload models from memory |
| `getModelsStatus()` | Returns `{ llm, whisper, tts, embeddings }` ready states |
| `startListening()` | Start mic + Whisper transcription stream |
| `stopListening()` | Stop mic |
| `generateQuestion(params)` | LLM: generate interview question |
| `evaluateAnswer(params)` | LLM: evaluate candidate answer |
| `generateSummary(params)` | LLM: generate session summary |
| `speakText({ text })` | TTS: speak text via Piper |
| `ingestPack(packId, questions)` | Embed pack questions into RAG |
| `searchPacksRanked(input, packs)` | LLM: rank packs by relevance |
| `initWallet()` | Initialize T402 wallet |
| `getWalletInfo()` | Returns `{ address, balanceUsdt0, ready }` |
| `getBalance()` | Returns `{ usdt0: string }` |
| `purchasePack(packId)` | Execute full x402 payment flow |
| `copyToClipboard(text)` | Copy text via Electron clipboard API |

---

## 11. Known Issues & Workarounds

### W1 — TOKEN_REGISTRY wrong name for Plasma ✅ SOLVED

**Problem:** `@t402/evm` hardcodes `name: "TetherToken"` for the Plasma USDT0 entry. The actual on-chain EIP-712 domain uses `name: "USDT0"`. This causes `transferWithAuthorization` to silently fail with `transaction_failed` because the signature is built against the wrong domain separator.

**Fix:** Manual patch after every `npm install` in `pack-server/`:

```bash
# File: pack-server/node_modules/@t402/evm/dist/esm/chunk-FJPMVWD7.mjs
# File: pack-server/node_modules/@t402/evm/dist/cjs/exact/server/index.js
# In the "Plasma Mainnet" / "eip155:9745" TOKEN_REGISTRY entry:
# Change: name: "TetherToken"
# To:     name: "USDT0"
```

To automate, add to `pack-server/package.json`:

```json
{
  "scripts": {
    "postinstall": "node -e \"const fs=require('fs'); ['node_modules/@t402/evm/dist/esm/chunk-FJPMVWD7.mjs','node_modules/@t402/evm/dist/cjs/exact/server/index.js'].forEach(f=>{ if(fs.existsSync(f)){ let c=fs.readFileSync(f,'utf8'); const patched=c.replace(/(\\/\\/ Plasma Mainnet[\\s\\S]*?\\\"eip155:9745\\\"[\\s\\S]*?name: )\\\"TetherToken\\\"/,'$1\\\"USDT0\\\"'); fs.writeFileSync(f,patched); } })\""
  }
}
```

### W2 — t402Version / x402Version field mismatch ✅ SOLVED

**Problem:** The T402 library uses `t402Version` internally, but the facilitator wire format uses `x402Version`. This affects `getSupported()`, `verify()`, and `settle()` calls.

**Fix:** `NormalizedFacilitatorClient` in `pack-server/index.js` overrides all three methods to normalize the field name before sending to the facilitator.

### W3 — WDK `getUsdt0Balance` returns 0 for Plasma ✅ SOLVED

**Problem:** Tether WDK's built-in balance method does not include Plasma in its address registry.

**Fix:** `wallet.ts` uses a direct `viem` `readContract` call against the USDT0 contract on `rpc.plasma.to`.

### W4 — `t402Client` constructor ignores schemes ✅ SOLVED

**Problem:** `new t402Client({ schemes: [...] })` does not register schemes.

**Fix:** Use `t402Client.fromConfig({ schemes: [...] })` instead.

### W5 — RAG not re-ingested after restart ✅ SOLVED

**Fixed.** On purchase, questions JSON is saved to `~/Library/Application Support/interview-ai/packs/{packId}.json`. On next startup, after `setupRag()` completes, `reingestPurchasedPacks()` reads all saved pack files and re-embeds them into the vector store. Console log: `[RAG] Re-ingested pack: {packId} ({n} questions)`.
