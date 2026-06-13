# ⚔️ QuoteWars

Quote battle arena built on GenLayer. Drop your best quote, stake tokens, and wait for a challenger. When someone steps up with their own quote, AI validators judge which one hits harder. Winner takes the prize pool.

## How it works

1. **Drop a Quote** — Pick your most powerful quote (famous or original), stake GEN tokens on it
2. **Get Challenged** — Another player drops their counter-quote and matches your stake
3. **AI Judges** — GenLayer's AI validators score both quotes on depth, originality, emotional impact, and relevance
4. **Winner Takes All** — The quote with the higher score wins the full prize pool

## Why GenLayer?

Judging quotes is inherently subjective — no deterministic code can decide which quote is "better." GenLayer's AI validators reach consensus on subjective decisions through the Equivalence Principle. Multiple AI models independently evaluate the quotes and must agree on a winner, making the judgment decentralized and fair.

## Tech Stack

- **Smart Contract**: GenLayer Intelligent Contract (Python) using `gl.vm.run_nondet_unsafe` for AI consensus
- **Frontend**: Next.js + TypeScript + GenLayerJS SDK
- **Network**: GenLayer Studionet
- **Consensus**: Partial field matching — winner must match exactly, scores within ±2 tolerance

## Contract Address

```
0xaFd6d033F753AC97fb151e1e65f6cc5EEc449c10 (Studionet)
```

## Project Structure

```
quote-wars-genlayer/
├── contracts/
│   └── quote_wars.py          # Intelligent Contract
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx       # Main UI
│   │   └── lib/
│   │       └── genlayer.ts    # SDK config
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

## Setup & Run

```bash
# Install GenLayer CLI
npm install -g genlayer

# Deploy contract (already deployed on studionet)
genlayer network set studionet
genlayer deploy --contract contracts/quote_wars.py

# Run frontend
cd frontend
npm install
# Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local
npm run dev
```

## Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `create_battle(quote, author)` | payable | Drop a quote and stake GEN |
| `challenge(battle_id, quote, author)` | payable | Challenge with counter-quote + stake |
| `judge_battle(battle_id)` | write (AI) | Trigger AI judgment |
| `cancel_battle(battle_id)` | write | Cancel open battle, refund stake |
| `get_battle(battle_id)` | view | Get battle details |
| `get_battle_count()` | view | Total battles created |

## AI Judging Criteria

The AI validators evaluate quotes on:
1. **Depth of meaning** — How profound is the insight?
2. **Originality** — Is it creative and unexpected?
3. **Emotional impact** — Does it move you?
4. **Universal relevance** — Does it speak to the human condition?

Both leader and validator nodes independently score the quotes. The winner field must match exactly, and scores must be within ±2 for consensus to pass.
