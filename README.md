# Belief Market

**The Internet's Belief Network.**
_Where conviction becomes markets._

Belief Market turns opinions and beliefs into a debate-and-market workflow,
built with a premium, minimal design language. The core flow is:

> **Belief → AI Debate → Community Conviction → Prediction Market**

1. **Share a belief** — an opinion about anything: tech, society, science, culture, sports, and more.
2. **AI analysts debate it** — 7 specialized agents (Advocate, Skeptic, Historian, Analyst, Contrarian, Fact Checker, Ethicist) each weigh in with a stance, arguments, evidence, probability, and confidence.
3. **The community validates it** — vote Believe / Cope / Neutral, comment, challenge, and provide evidence. Every vote updates the **Conviction Score**.
4. **High-conviction beliefs become prediction markets** — Believe/Cope markets with live probability, an interactive chart, and a points-based trading panel.
5. **The swarm trades the outcome** — markets resolve automatically from official sources.

---

## Tech Stack

- **Next.js 15+** (App Router) + **React 19**
- **TypeScript**
- **TailwindCSS** (custom design system)
- **Framer Motion** (subtle, fast animations)
- **lucide-react** (icons)
- Ready to integrate: **Supabase**, **Clerk Authentication**, **OpenAI API**, **Realtime**, **React Query**, **TradingView Lightweight Charts**

> The app runs **fully offline with built-in mock data** and a deterministic
> AI debate engine (`src/lib/ai.ts`). Wire real services by populating
> `.env` (see `.env.example`) — e.g. swap `generateDebate` for an OpenAI-backed
> server action, and replace the in-memory store with Supabase + React Query.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # run production server
```

---

## Design System

| Token | Value |
| --- | --- |
| Primary | `#ADD800` |
| Background | `#050505` |
| Secondary Background | `#0D0D0D` |
| Cards | `#111111` |
| Border | `rgba(255,255,255,.06)` |
| Text Primary | `#FFFFFF` |
| Text Secondary | `#A1A1AA` |
| Believe | `#22C55E` |
| Cope | `#EF4444` |
| AI | `#3B82F6` |
| Warning | `#F59E0B` |

Typography: **Inter**. Rounded cards, large spacing, minimal shadows, no gradients,
no crypto aesthetics — a clean, modern belief platform.

---

## Project Structure

```
src/
  app/                     # App Router pages
    page.tsx               # Home (hero + belief feed)
    beliefs/               # Beliefs list + [id] detail (AI debate, voting)
    markets/               # Markets + Pulse + [id] detail (trading, chart)
    leaderboard/           # Ranked users
    profile/               # Your profile + [username]
    settings/  sign-in/    # Settings + auth
  components/
    ui/                    # Design-system primitives
    nav/                   # Navbar, search, notifications
    home/  thesis/  market/  profile/   # (thesis/ holds belief components)
  lib/
    types.ts               # Domain model
    data.ts                # Mock seed data (beliefs, markets, users)
    ai.ts                  # 7-agent AI debate engine
    store.tsx              # Client state (beliefs, votes, trades, notifications)
    utils.ts               # Formatting + helpers
```

---

## Pages

Home · Beliefs · Belief Detail · Markets · Market Detail · Leaderboard · Profile ·
Settings · Sign In

_Beliefs on any topic. Play-money prediction markets, for research and entertainment only._
