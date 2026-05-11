# AILokak

**Local-first AI interview coach: private, offline, freedom.**

Built for the **Tether Frontier Hackathon Track**.

**[▶ Watch Demo](https://youtube.com/watch?v=g4TzYx3tNbo)** · **[📄 Slide Deck](https://drive.google.com/file/d/1ao8VlCJgYcHs3WBUQUyyEOtmFG7x0UwV/view?usp=drive_link)**

---

## Download

[![Download DMG](https://img.shields.io/badge/Download-v1.0.0--beta%20(macOS%20arm64)-black?style=for-the-badge&logo=apple)](https://github.com/ridhoizzulhaq/AILokak-Github/releases/tag/1.0.0)

> **Note:** Only tested on **MacBook Air M1**. macOS may show "unidentified developer" — right-click → Open to bypass.
>
> **Pack server** (`http://13.221.44.63:4021`) may be offline. Run locally or change URL in app Settings. See [Marketplace Pack Server](#marketplace-pack-server-optional).

>You can also [setup from source](#option-b--run-from-source) if you prefer.
---

## What It Does

AILokak is a local AI interview coach platform powered by **Tether QVAC** that eliminates data harvesting and recurring subscriptions. By running entirely on local hardware, it ensures total data sovereignty and permanent free access.

The platform also integrates a marketplace where professionals can sell specialized Knowledge Bases via **USDT x402**, allowing the local AI to maintain expert-level knowledge depth without relying on cloud providers.

### Flow

```text
Questions
   ↓
Speech-to-text (or typing)
   ↓
AI evaluation
   ↓
Session summary
```

![Architecture](https://cdn.jsdelivr.net/gh/free-whiteboard-online/Free-Erasorio-Alternative-for-Collaborative-Design@28e88232e250f9338a0b443ff89b200b3218a9f5/uploads/2026-05-09T19-56-48-774Z-scipa80hr.png)

---
## Why AILokak?

Cloud-based interview coaching platforms like Final Round AI charge **$150/month** for a basic plan, and they claim over 10 million users. But there are real problems with that model: fresh graduates, the people who need interview prep most, can't afford it. The question banks are built solely by the platform with no verified input from experienced professionals. And even with "stealth mode," there's no guarantee your voice data isn't being harvested ([BBC has reported on this](https://www.bbc.com/news/articles/c3d9zv50955o).

AILokak takes a fundamentally different approach:

| Cloud AI Coaching               | AILokak                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| $150/month subscription         | Free forever after model download                                       |
| Answers sent to company servers | Never leaves your machine                                               |
| Closed question bank            | Marketplace where real professionals sell verified knowledge packs       |
| Locked to one model             | Switch between any QVAC-supported model, or fine-tune your own          |
| Requires internet               | Works fully offline                                                     |

---
## Links

* [Demo Video](https://youtube.com/watch?v=g4TzYx3tNbo)
* [Slide Deck](https://drive.google.com/file/d/1ao8VlCJgYcHs3WBUQUyyEOtmFG7x0UwV/view?usp=drive_link)

---

## QVAC Capabilities Used

| Capability          | `@qvac/sdk` Function               | Purpose                                                              | Model                         |
| ------------------- | ---------------------------------- | -------------------------------------------------------------------- | ----------------------------- |
| **LLM Completion**  | `loadModel` + `completion()`       | Generate questions and evaluate answers (streaming, `kvCache: true`) | `QWEN3_1_7B_INST_Q4`          |
| **Transcription**   | `loadModel` + `transcribeStream()` | Speech-to-text for voice answers with VAD                            | `WHISPER_TINY`                |
| **Text Embeddings** | `loadModel` + `embed()`            | Embed knowledge base and queries for semantic search                 | `GTE_LARGE_FP16`              |
| **OCR**             | `loadModel` + `ocr()`              | Extract text from resume images for tailored questions               | `OCR_LATIN_RECOGNIZER_1`      |
| **Model Lifecycle** | `loadModel` / `unloadModel`        | Download, cache, and release models on demand                        | —                             |
| **Text-to-Speech**  | —                                  | Speak questions aloud¹                                               | Piper TTS (`en_US-ryan-high`) |

### SDK Usage Pattern

```ts
import('@qvac/sdk') // lazy dynamic import — loaded once on first use

// ── Model Lifecycle ──────────────────────────────────────────────────────────

// Download on first run, cached in ~/.qvac/models/. Subsequent loads instant.
const llmId = await loadModel({ model: 'QWEN3_1_7B_INST_Q4', modelType: 'llm' })
const whisperId = await loadModel({ model: 'WHISPER_TINY', modelType: 'stt' })
const embedId = await loadModel({ model: 'GTE_LARGE_FP16', modelType: 'embedding' })
const ocrId = await loadModel({ model: 'OCR_LATIN_RECOGNIZER_1', modelType: 'ocr' })

// Unload + reload for in-app model switching (Config screen)
await unloadModel(llmId)
const newLlmId = await loadModel({ model: 'QWEN3_4B_INST_Q4_K_M', modelType: 'llm' })

// ── LLM Completion (streaming + KV cache) ───────────────────────────────────

// kvCache: true reuses attention states across turns — faster multi-turn inference
const stream = completion({ modelId: llmId, history: messages, stream: true, kvCache: true })
for await (const { token } of stream) {
  mainWindow.webContents.send('completion-token', { token })
}

// ── Speech-to-Text (real-time VAD) ──────────────────────────────────────────

const session = await transcribeStream({ modelId: whisperId })
session.on('transcript', ({ text }) => {
  mainWindow.webContents.send('transcription-result', { text })
})
// Feed mic audio (FFmpeg stdout → PCM chunks)
session.sendAudio(pcmChunk)
await session.stop()

// ── Text Embeddings + RAG ────────────────────────────────────────────────────

// Embed knowledge base chunks at startup
const { embedding } = await embed({ modelId: embedId, text: chunk })
ragStore.push({ text: chunk, embedding })

// Query: embed user input → cosine similarity → top-k → inject into prompt
const { embedding: queryEmbed } = await embed({ modelId: embedId, text: query })
const topK = ragStore
  .map(d => ({ ...d, score: cosineSimilarity(queryEmbed, d.embedding) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)

// ── OCR (resume image → text) ────────────────────────────────────────────────

// Buffer from renderer (ArrayBuffer → Buffer in preload)
const buf = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer)
const result = await ocr({ modelId: ocrId, image: buf })
const resumeText = result.blocks.map(b => b.text).join('\n')
// resumeText → analyzeResume → LLM extracts profile → tailors questions
```

> ¹ **TTS Note:** QVAC SDK includes a neural TTS capability (`textToSpeech`), but during development we encountered a word-repetition artifact that could not be resolved at the inference-step level. We switched to **Piper TTS**, which also runs `.onnx` models via ONNX Runtime (the same inference backend used by QVAC). All other AI capabilities remain powered by `@qvac/sdk`.

---


## How It Works

### RAG Architecture

AILokak uses Retrieval-Augmented Generation (RAG) to ground every question and evaluation in real interview knowledge, reducing hallucinations and improving relevance.

```text
User selects job role/topic
        ↓
Query embedded → GTE_LARGE_FP16 (local)
        ↓
Cosine similarity search over interview knowledge base
(interview-data.ts)
        ↓
Top-k chunks injected into LLM system prompt
        ↓
Qwen3 1.7B generates grounded question/evaluation
```

The knowledge base includes:

* STAR method examples
* Role-specific competencies
* Common interview patterns
* Evaluation rubrics

---

### Resume Upload (OCR)

![OCR](https://cdn.jsdelivr.net/gh/free-whiteboard-online/Free-Erasorio-Alternative-for-Collaborative-Design@412d36b74ad6888218a39383d57f0a4e7d623469/uploads/2026-05-11T15-54-30-642Z-qdw7eni2x.png)

AILokak can read your resume and use it to tailor interview questions to your actual background.

```text
User uploads resume photo/screenshot (PNG, JPG)
        ↓
OCR_LATIN_RECOGNIZER_1 extracts all text (fully local, via @qvac/sdk)
        ↓
Qwen3 analyzes extracted text → structured profile
(job title, years of experience, skills, industries, achievements)
        ↓
Profile injected into LLM system prompt
        ↓
Questions and evaluations personalized to your resume
```

**What the AI extracts from your resume:**

* Current/target job title
* Years of experience
* Technical and soft skills
* Industries worked in
* Notable achievements

**Privacy:** the image never leaves your machine. OCR and LLM analysis both run fully on-device via QVAC.

---

### Choose Your Language Model

![Model Switcher](https://raw.githubusercontent.com/free-whiteboard-online/Free-Erasorio-Alternative-for-Collaborative-Design/d211950de3042021d4efa8afd45567fbe86f417a/uploads/2026-05-11T16-02-54-811Z-z3j0ywj53.png)

AILokak lets you switch the underlying LLM at any time from the **Settings** screen (sidebar → Settings icon).

Available models:

| Model               | Size    | RAM   | Notes                   |
| ------------------- | ------- | ----- | ----------------------- |
| Qwen3 0.6B          | 356 MB  | 2 GB  | Fastest, lowest quality |
| Qwen3 1.7B          | 1.0 GB  | 4 GB  | Default, balanced       |
| Qwen3 4B            | 2.3 GB  | 6 GB  | Better answers          |
| Qwen3 8B            | 4.7 GB  | 10 GB | High quality            |
| Llama 3.2 1B        | 737 MB  | 3 GB  | Fast Meta alternative   |
| Unsloth GPT-OSS 20B | 10.8 GB | 16 GB | Largest, best quality   |

**How switching works:**

```text
User selects model in Settings
        ↓
New model downloads (if not cached)
Progress bar shown in UI
        ↓
Old model unloaded via unloadModel()
New model loaded via loadModel()
        ↓
Interview session resumes with new model
```

Models are cached in `~/.qvac/models/` after first download. Switching back to a previously used model is instant — no re-download.

> **Note:** Interview sessions are unavailable during model switching.

---

## Marketplace Packs

![Packs](https://cdn.jsdelivr.net/gh/free-whiteboard-online/Free-Erasorio-Alternative-for-Collaborative-Design@1d57e0045b17b153bf99f9c557943f3ca6520563/uploads/2026-05-11T12-38-13-565Z-3h7n6m2r6.png)

AILokak's marketplace offers interview packs tailored to specific careers, each containing field-specific questions and evaluation criteria.

Users can:

* Browse by industry
* Receive AI-powered recommendations
* Purchase packs once using **USDT0**

Purchased packs are embedded into a local RAG knowledge base using `@qvac/sdk`, enabling the interviewer AI to understand what strong answers look like within a given profession.

Each pack includes:

* Role-specific questions
* Voice and text input support
* AI evaluation adapted to role context

### AI-Powered Recommendations

![AI Recommendation](https://cdn.jsdelivr.net/gh/free-whiteboard-online/Free-Erasorio-Alternative-for-Collaborative-Design@c1c85313a0120847c215a06013de18f6ddf2747f/uploads/2026-05-09T19-54-10-886Z-qwamv5bi9.png)

---

## How Pack Purchase Works: x402 + Tether WDK

Packs are gated using **x402**, a micropayment protocol built on **Plasma Mainnet** with near zero-fee USDT0 transactions ([docs](https://docs.wdk.tether.io/ai/x402)).

We use Plasma Mainnet as it is currently the chain supported by the Tether WDK x402 protocol. We look forward to Tether x402 development expanding to the **Solana ecosystem**.

No external account or subscription is required — only a one-time on-chain payment.

### Seed Phrase Storage

| Platform | Path                                                    |
| -------- | ------------------------------------------------------- |
| macOS    | `~/Library/Application Support/ailokak/wallet-seed.txt` |
| Windows  | `%APPDATA%\ailokak\wallet-seed.txt`                     |
| Linux    | `~/.config/ailokak/wallet-seed.txt`                     |

The file is written with `mode: 0o600`, making it readable only by the current OS user. It is stored outside the project directory and excluded from Git tracking.

### Purchase Flow

![Purchase Flow](https://cdn.jsdelivr.net/gh/free-whiteboard-online/Free-Erasorio-Alternative-for-Collaborative-Design@da47d75ebffc0c2efd487ce9b309eb6ec0f29107/uploads/2026-05-09T19-59-33-582Z-mapmo6cho.png)

The pack server receives only:

* Wallet address
* Payment proof

It never receives:

* Interview answers
* Voice recordings
* AI session data

---

## Catalog Sync: Metadata Only, AI Stays Private

Pack metadata (titles, descriptions, prices, categories) lives on the pack server rather than being hardcoded into the application. This enables packs to be updated without re-releasing the app.

```text
User opens Pack Browser
        ↓
[Electron Main] HTTP GET /catalog → pack-server
        ↓
Server returns metadata only
(questions array is never sent)
        ↓
Metadata merged into local pack list
        ↓
UI shows sync status:
spinner → ✓ success / ✗ error
        ↓
Full questions released only after x402 purchase
```

### Important Privacy Detail

The AI never touches the network.

All of the following run fully on-device via QVAC:

* LLM inference
* Whisper transcription
* Embeddings

The only outbound connections are:

* `/catalog` → pack metadata sync
* x402 facilitator → payment settlement

### Pack Format

Each `.json` file inside `pack-server/packs/`:

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

* macOS (M1/M2/M3 recommended for Metal GPU acceleration)
* Node.js >= 20
* Python 3 (for Piper TTS)
* FFmpeg (for microphone capture)
* ~5 GB free disk space (model downloads on first launch)

> Currently tested only on **MacBook Air M1**.

---

## Setup

### Option A — Download DMG (macOS arm64)

[![Download DMG](https://img.shields.io/badge/Download-ailokak--1.0.0--beta.dmg-black?style=for-the-badge&logo=apple)](https://github.com/ridhoizzulhaq/AILokak-Github/releases/tag/1.0.0)

1. Open `ailokak-1.0.0-beta.dmg`
2. Drag **AILokak** to Applications
3. First launch: QVAC models download automatically (~2–3 GB)

> macOS may block the app — right-click → Open to bypass Gatekeeper.

---

### Option B — Run from Source

### 1. Clone and Install

```bash
git clone https://github.com/ridhoizzulhaq/AILokak-Github.git
cd AILokak-Github
npm install
```

### 2. Download Piper TTS Model

Download and place the following files inside `resources/`:

```text
resources/
├── en_US-ryan-high.onnx
└── en_US-ryan-high.onnx.json
```

Download from: `https://github.com/rhasspy/piper/releases` — use model `en_US-ryan-high`

### 3. Run the Application

```bash
npm run dev
```

**First launch:** QVAC models download automatically (~2–3 GB). Progress is displayed in the UI. Subsequent launches use locally cached models.

---

## Marketplace Pack Server (Optional)

The marketplace pack server is deployed at:

```text
http://13.221.44.63:4021
```

> **Note:** The pack server may be offline. If packs fail to load, run locally (see below) and update the URL in app Settings.

The pack server URL can be changed at any time from inside the app: **sidebar → Settings → Pack Server**.

### Run Locally

```bash
cd pack-server
npm install
cp .env.example .env
# edit .env with your values
node index.js
```

Then update the server address in the app: **Settings → Pack Server → `http://localhost:4021`**

### Endpoints

| Route           | Auth         | Description                       |
| --------------- | ------------ | --------------------------------- |
| `GET /catalog`  | None         | Pack metadata (without questions) |
| `GET /pack/:id` | x402 payment | Full pack JSON with questions     |

---

## Project Structure

```text
src/
├── main/
│   ├── index.ts           # Electron main — QVAC IPC handlers
│   ├── interview-data.ts  # Built-in interview data for RAG
│   └── wallet.ts          # x402 payment wallet (auto-generated per user)
├── preload/
│   ├── index.ts           # IPC bridge (contextBridge)
│   └── index.d.ts         # Type declarations for window.qvacAPI
└── renderer/src/
    ├── App.tsx
    └── components/
        ├── LoadingScreen.tsx      # Model download progress
        ├── HomeScreen.tsx         # Mode selection + resume upload (OCR)
        ├── InterviewSession.tsx   # Main interview loop + AI coaching UI
        ├── SessionSummary.tsx     # Post-session analysis
        ├── PackBrowser.tsx        # Marketplace pack browser
        ├── PackSearch.tsx         # AI-powered pack recommendation
        ├── ConfigScreen.tsx       # Settings: server address + LLM model switcher
        └── Layout.tsx             # Sidebar navigation

pack-server/
├── index.js               # Express server — x402 payment-gated pack routes
├── packs/                 # Interview question packs (JSON)
└── .env.example           # Environment variable template

resources/
├── piper_server.py        # Piper TTS server — reads text from stdin, streams WAV to stdout
├── en_US-ryan-high.onnx   # Voice model (download separately — see Setup)
└── en_US-ryan-high.onnx.json
```

---

## Development

```bash
npm run dev
```

---

## Tech Stack

* **Electron** + **electron-vite**
* **React** + **TypeScript** + **Tailwind CSS v4**
* **@qvac/sdk** — LLM, Whisper, Embeddings, OCR, RAG
* **Piper TTS** — offline neural text-to-speech
* **x402 / t402** — micropayment-gated marketplace packs
* **Tether WDK** — non-custodial wallet (auto-generated per user)
