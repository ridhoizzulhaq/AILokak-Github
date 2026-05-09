# AILokak

**Local-first AI interview coach : private, offline, freedom.**
**Built for the Tether Frontier Hackathon Track hackathon**.

---

## What It Does

AILokak is a local AI coach interview platform powered by Tether qvac that eliminates data harvesting and recurring subscriptions. By executing entirely on local hardware, it ensures total data sovereignty and permanent free access. The platform integrates a marketplace where professionals sell specialized Knowledge Bases via USDT x402, allowing the local AI to maintain unlimited, expert-level knowledge depth without relying on cloud-based providers.

##### Flow: questions → speech-to-text (or typing) → AI evaluation → session summary.

![enter image description here](https://cdn.jsdelivr.net/gh/free-whiteboard-online/Free-Erasorio-Alternative-for-Collaborative-Design@28e88232e250f9338a0b443ff89b200b3218a9f5/uploads/2026-05-09T19-56-48-774Z-scipa80hr.png)
---

## QVAC Capabilities Used

| Capability | `@qvac/sdk` function | Purpose | Model |
|---|---|---|---|
| **LLM Completion** | `loadModel` + `completion()` | Generate questions + evaluate answers (streaming) | `QWEN3_1_7B_INST_Q4` |
| **Transcription** | `loadModel` + `transcribeStream()` | Speech-to-text for voice answers with VAD | `WHISPER_TINY` |
| **Text Embeddings** | `loadModel` + `embed()` | Embed knowledge base + queries for semantic search | `GTE_LARGE_FP16` |
| **Model Lifecycle** | `loadModel` / `unloadModel` | Download, cache, and release models on demand | — |
| **Text-to-Speech** | — | Speak questions aloud ¹ | Piper TTS (`en_US-ryan-high`) |

**SDK usage pattern:**

```ts
import('@qvac/sdk')  // lazy dynamic import — loaded once on first use

// Load model (downloads on first run, cached in ~/.qvac/models/)
const modelId = await loadModel({ model: 'QWEN3_1_7B_INST_Q4', modelType: 'llm' })

// Streaming LLM completion
const stream = completion({ modelId, history: messages, stream: true })
for await (const { token } of stream) { /* stream to renderer */ }

// Real-time transcription
const session = await transcribeStream({ modelId: whisperId })
session.on('transcript', ({ text }) => { /* interim results */ })

// Embeddings for RAG
const { embedding } = await embed({ modelId: embeddingsId, text: query })
// then cosine similarity against in-memory ragStore[]
```

> ¹ **TTS note:** QVAC SDK includes a neural TTS capability (`textToSpeech`), but during development we encountered a word-repetition artifact in its output that could not be resolved at the inference-step level. We switched to **Piper TTS**  that also runs `.onnx` models via ONNX Runtime (the same inference backend QVAC uses).All other QVAC capabilities remain via `@qvac/sdk`.

---

## Why Local AI?

| Cloud AI | AILokak |
|---|---|
| Answers sent to servers | Never leaves your machine |
| recurring subscription | Free after model download |
| Rate limits + latency | Instant, no throttling |
| Requires internet | Works fully offline |

---

## How It Works

### RAG Architecture

AILokak uses Retrieval-Augmented Generation to ground every question and evaluation in real interview knowledge (less AI hallucinations).

```
User selects job role/topic
        ↓
Query embedded → GTE_LARGE_FP16 (local)
        ↓
Cosine similarity search over interview knowledge base (interview-data.ts)
        ↓
Top-k chunks injected into LLM system prompt
        ↓
Qwen3 1.7B generates grounded question / evaluation
```

Knowledge base includes: STAR method examples, role-specific competencies, common interview patterns, evaluation rubrics.

---

### Marketplace Packs
![enter image description here](https://cdn.jsdelivr.net/gh/free-whiteboard-online/Free-Erasorio-Alternative-for-Collaborative-Design@369decb404e92b023e727d9bfc2093b97c7dfbd8/uploads/2026-05-09T20-01-09-561Z-p16t6axfa.png)
AILokak's marketplace offers question packs tailored to specific careers, each with field-specific questions and evaluation criteria. Browse by industry, let the AI recommend based on your target job, and pay once with USDT0. Behind the scenes, purchased packs are embedded into a local RAG knowledge base via `@qvac/sdk` , so your interviewer knows what a great answer looks like in your field

Each pack: role-specific questions, voice + text input, AI evaluation adapted to role context.

####  You can also get recommendation by your local AI!
![enter image description here](https://cdn.jsdelivr.net/gh/free-whiteboard-online/Free-Erasorio-Alternative-for-Collaborative-Design@c1c85313a0120847c215a06013de18f6ddf2747f/uploads/2026-05-09T19-54-10-886Z-qwamv5bi9.png)
---

### How Pack Purchase Works :  x402 + Tether WDK

Packs are gated by **x402**, a micropayment protocol built on Plasma Mainnet because of USTO transaction with near zero-fee (https://docs.wdk.tether.io/ai/x402)

 No external account needed or subscription, just a one-time on-chain payment.

**What runs locally (never leaves your device):**
**Where the seed phrase is stored:**


| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/ailokak/wallet-seed.txt` |
| Windows | `%APPDATA%\ailokak\wallet-seed.txt` |
| Linux | `~/.config/ailokak/wallet-seed.txt` |

File written with `mode: 0o600` — readable only by the OS user running the app. Not tracked by git (lives outside the project directory in Electron `userData`).

**What happens on purchase:**
![enter image description here](https://cdn.jsdelivr.net/gh/free-whiteboard-online/Free-Erasorio-Alternative-for-Collaborative-Design@da47d75ebffc0c2efd487ce9b309eb6ec0f29107/uploads/2026-05-09T19-59-33-582Z-mapmo6cho.png)


Pack server receives **only**: wallet address + payment proof. It has no access to your answers, voice data, or AI session.

---
### Catalog Sync : Metadata Only, AI Stays Private
Pack metadata (titles, descriptions, prices, categories) lives on the pack server — not hardcoded in the app binary. This lets packs be updated or added without re-shipping the app.

```
User opens Pack Browser
        ↓
[Electron main] HTTP GET /catalog → pack-server (EC2 13.221.44.63:4021)
        ↓
Server returns metadata only — questions array is never sent
        ↓
Metadata merged into local pack list
Sync status shown in UI: spinner → ✓ done / ✗ error
        ↓
Full questions only released after x402 purchase
```

**The AI never touches the network.** LLM inference, Whisper transcription, and embeddings all run entirely on-device via QVAC. The only outbound connections are:
- `/catalog` — pack metadata sync (no user data sent)
- x402 facilitator — payment settlement (wallet address + proof only)

**Pack format** (each `.json` in `pack-server/packs/`):

```json
{
  "id": "pack-pm",
  "title": "PM Interview Pro",
  "description": "Product sense, prioritization, metrics, and stakeholder questions.",
  "category": "Product Management",
  "questions_count": 20,
  "inputMode": "both",
  "price_usdt": 1.00,
  "author": "AILokak",
  "mentor": "Senior PM @ FAANG",
  "industries": ["Tech", "SaaS", "Consumer"],
  "roles": ["Product Manager", "Associate PM", "Senior PM"],
  "questions": [ ... ]
}
```

---

## Requirements

- macOS (M1/M2/M3 recommended — Metal GPU acceleration)
- Node.js >= 20
- Python 3 (for Piper TTS)
- ffmpeg (for mic capture)
- ~5 GB free disk (model downloads on first launch)

#### Note : We Only try on Macbook Air M1 

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/ridhoizzulhaq/AILokak.git
cd AILokak
npm install
```

### 2. Download Piper TTS model

Download and place in `resources/`:

```
resources/
  en_US-ryan-high.onnx
  en_US-ryan-high.onnx.json
```

Download from: https://github.com/rhasspy/piper/releases — `en_US-ryan-high`

### 3. Run

```bash
npm run dev
```

**First launch:** QVAC models download automatically (~2–3 GB). Progress shown on screen. Subsequent launches use cached models.

---

## Marketplace Pack Server (optional)

The marketplace pack server is deployed at `http://13.221.44.63:4021`.

To run locally:

```bash
cd pack-server
npm install
cp .env.example .env
# edit .env with your values
node index.js
```

**Endpoints:**

| Route | Auth | Description |
|---|---|---|
| `GET /catalog` | None | Pack metadata (no questions) |
| `GET /pack/:id` | x402 payment | Full pack JSON with questions |

---

## Project Structure

```
src/
  main/
    index.ts           # Electron main — QVAC IPC handlers
    interview-data.ts  # Built-in interview Q&A for RAG
    wallet.ts          # x402 payment wallet (auto-generated per user)
  preload/
    index.ts           # IPC bridge (contextBridge)
    index.d.ts         # Type declarations for window.qvacAPI
  renderer/src/
    App.tsx
    components/
      LoadingScreen.tsx      # Model download progress
      HomeScreen.tsx         # Mode selection
      InterviewSession.tsx   # Main interview loop + AI coaching UI
      SessionSummary.tsx     # Post-session analysis
      PackBrowser.tsx        # Marketplace pack browser
      PackSearch.tsx         # AI-powered pack search
      Layout.tsx             # Sidebar navigation
pack-server/
  index.js             # Express server — x402 payment-gated pack routes
  packs/               # Interview question packs (JSON)
  .env.example         # Environment variable template
resources/
  piper_server.py           # Piper TTS server — reads text from stdin, streams WAV to stdout
  en_US-ryan-high.onnx     # Voice model (download separately — see Setup)
  en_US-ryan-high.onnx.json # Model config
```

---

## Dev

```bash
npm run dev 
```

---

## Tech Stack

- **Electron** + **electron-vite**
- **React** + **TypeScript** + **Tailwind CSS v4**
- **@qvac/sdk** — LLM, Whisper, Embeddings, RAG
- **Piper TTS** — offline neural text-to-speech
- **x402 / t402** — micropayment-gated marketplace packs
- **Tether WDK** — non-custodial wallet (auto-generated per user)
