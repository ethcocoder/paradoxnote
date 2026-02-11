# App Name (working): EchoMind
## A Voice-First, Offline, Human-First Second Brain

---

## 1. Core Vision

EchoMind is an offline-first notebook app where users speak their thoughts
and the app captures everything they say as raw, permanent memory.

The system never filters, deletes, or edits human thought.
AI is only an optional layer used to help users explore, summarize,
and restructure their own mind.

Source of truth = the human voice.

---

## 2. Fundamental Philosophy

- Anything the user says is always saved.
- Raw transcript is sacred and immutable.
- AI never replaces human thought.
- AI only adds interpretation layers.
- Memory first, intelligence second.
- Human mind > AI mind.

This app is not about productivity.
It is about preserving thinking.

---

## 3. Core Features

### 3.1 Voice Capture (Offline)

- One-tap microphone.
- User speaks naturally.
- Uses offline Whisper (base/small).
- Real-time transcription.
- No internet required.
- No background listening.

### 3.2 Raw Transcript Storage

Every session is saved as a local file:

- Markdown for human-readable content.
- YAML frontmatter for metadata.

Example:

---
title: Future City Idea
created: 2026-02-01
tags: [sci-fi, ideas]
source: voice
ai:
  summary: null
  key_points: []
---

# Raw Transcript

I was walking and suddenly thought about a city where energy is used as money...

---

### 3.3 Review & Search

- Timeline of sessions.
- Full-text search.
- Semantic search (optional local LLM).
- No cloud indexing.

---

## 4. AI Tools (Optional, On-Demand)

AI never runs automatically.
Only when user clicks a button.

### Tools:

- Summarize
- Extract key ideas
- Create outline
- Turn into article
- Turn into script
- Find action items
- Rewrite in different styles

AI output is stored in YAML.
Original transcript never changes.

---

## 5. Offline Architecture

### Voice Model:
- Whisper base / small (quantized)
- Runs fully on-device

### AI Model:
- Local LLM (Llama / Mistral / Phi)
- Via llama.cpp / Ollama

### Storage:
- Local filesystem
- Markdown + YAML
- No proprietary format

### Platforms:
- iOS
- Android
- Desktop (later)

---

## 6. Privacy & Trust

- No account required.
- No cloud.
- No data collection.
- No tracking.
- No analytics.
- No servers.

User owns their brain.

---

## 7. Product Differentiation

EchoMind is not:
- Notion
- Otter
- Google Docs
- Voice recorder

EchoMind is:
- A memory system
- A second brain
- A thinking tool
- A cognitive companion

---

## 8. Target Users (Initial)

Primary:
- Writers
- Creators
- Thinkers
- Founders
- Journalers

People who think faster than they type.

---

## 9. Business Model

Offline-first monetization:

### Option A: One-time license
$49 – $99

### Option B: Freemium
Free:
- Voice capture
- Raw transcripts

Pro:
- AI tools
- Semantic search
- Advanced export

### Option C: Paid upgrades
Major versions require repurchase.

---

## 10. Long-Term Vision

EchoMind becomes:
- A personal memory OS
- A lifelong thinking archive
- A private cognitive assistant
- A human-AI co-thinking system

Not cloud AI.
Not surveillance AI.

Personal intelligence.
Owned by the user.
