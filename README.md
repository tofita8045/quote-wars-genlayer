# ⚔️ QuoteWars

Quote battle arena on GenLayer. Drop a quote, someone challenges with theirs, both stake tokens, and AI validators pick the most powerful one. Winner takes all.

## How it works

1. Player 1 drops a quote and stakes GEN
2. Player 2 challenges with their quote and matches the stake
3. AI validators judge: depth, originality, emotional impact, relevance
4. Winner takes the full prize pool

## Setup

```bash
genlayer network set studionet
genlayer account unlock --password "YOUR_PASSWORD"
genlayer deploy --contract contracts/quote_wars.py

cd frontend && npm install
# Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local
npm run dev
```
