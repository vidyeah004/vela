# Vela Scheduling Intelligence Demo

Multi-agent scheduling coordination: paste a messy email thread, get constraints extracted, conflicts resolved, and a confirmation email drafted.

## Stack
- Next.js 14 (App Router)
- Claude API (3 agents: parse → resolve → draft)
- Tailwind CSS
- Deploy to Vercel

## Setup

1. Clone repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and add your Anthropic API key
4. `npm run dev`

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add `ANTHROPIC_API_KEY` environment variable
4. Deploy
