


# 🦀 RustAcademy Web
> Next.js frontend for RustAcademy — Learn Rust, earn XLM, build Web3.

## Overview

RustAcademy Web provides the learner, tutor, and community experience for the platform.

Users can:

* Browse Rust courses
* Complete coding challenges
* Chat with the AI Mentor
* Join community discussions
* Manage rewards and certifications
* Connect Stellar wallets
* Track XP, streaks, and achievements

---

## Features

### 🎓 Learning Platform

* Course catalog
* Lesson player
* Interactive coding environment
* Progress tracking
* Quiz system
* Task submissions

### 🤖 AI Mentor

* Rust tutoring
* Soroban assistance
* Code explanations
* Error debugging
* Personalized recommendations

### 🧑‍🏫 Tutor Portal

* Course creation
* Task management
* Submission reviews
* Earnings dashboard

### 🗣️ Community

* Social feed
* Comments & reactions
* Study groups
* Direct messaging

### 💰 Wallet & Rewards

* Freighter integration
* Reward tracking
* Certificate viewing
* Badge collection

---

## Tech Stack

* Next.js 15
* TypeScript
* Tailwind CSS v4
* shadcn/ui
* Zustand
* TanStack Query
* Framer Motion
* Monaco Editor
* Socket.io Client
* Stellar SDK

---

## Folder Structure

```bash
src/
├── app/
├── components/
├── hooks/
├── lib/
├── providers/
├── store/
├── types/
└── styles/
```

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000

NEXT_PUBLIC_STELLAR_NETWORK=testnet

NEXT_PUBLIC_REWARD_POOL_CONTRACT_ID=
NEXT_PUBLIC_CERTIFICATE_CONTRACT_ID=
NEXT_PUBLIC_BADGE_CONTRACT_ID=
NEXT_PUBLIC_REPUTATION_CONTRACT_ID=
```

---

## Development

```bash
pnpm install

pnpm dev
```

Runs on:

```bash
http://localhost:3000
```

---

## Build

```bash
pnpm build
pnpm start
```

---

## Testing

```bash
pnpm test
```

---

## Key User Flows

### Learner Journey

```text
Register
  ↓
Connect Wallet
  ↓
Enroll in Course
  ↓
Complete Tasks
  ↓
AI/Tutor Review
  ↓
Earn XLM
  ↓
Receive NFT Certificate
```

---

## Deployment

Recommended:

* Frontend → Vercel
* Assets → Cloudflare R2





