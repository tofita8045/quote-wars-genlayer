#  QuoteWars

**Words are weapons. Back yours with tokens.**

QuoteWars lets you challenge anyone to a battle of quotes. You both stake GEN, and GenLayer's AI validators decide which quote hits harder. Winner takes everything.

---

## The Concept

Two quotes enter. One quote leaves.

Players pick their most powerful quote — could be Shakespeare, could be something you wrote in the shower — and put money behind it. A challenger steps up with theirs. Then a panel of decentralized AI judges scores both on meaning, creativity, emotion, and relevance.

No human bias. No popular vote. Just AI consensus on which words carry more weight.

---

## Why This Needs GenLayer

Traditional blockchains can't judge a quote. They can add numbers and move tokens, but they can't read a sentence and feel something.

GenLayer can. Its validators run LLMs, evaluate text independently, and agree on a subjective verdict through consensus. That's what makes QuoteWars possible — you can't build this on Ethereum or Solana.

---

## Quick Start

```bash
npm install -g genlayer
genlayer network set studionet
genlayer account create --name player --password "yourpass"
genlayer account unlock --password "yourpass"
genlayer deploy --contract contracts/quote_wars.py
```

Then:
```bash
cd frontend
npm install
npm run dev
```

Set your contract address in `frontend/.env.local` and open `localhost:3000`.

---

## Deployed Contract

**Network:** GenLayer Studionet  
**Address:** `0xaFd6d033F753AC97fb151e1e65f6cc5EEc449c10`

---

## How the AI Judges

Each validator independently scores both quotes (1-10) on:

- Depth — what's beneath the surface?
- Originality — has this been said a thousand times?
- Emotion — does it make you pause?
- Relevance — does it speak to everyone?

Consensus passes when validators agree on the winner and their scores land within ±2 of each other.

---

## Stack

| Layer | Tech |
|-------|------|
| Contract | Python (GenLayer Intelligent Contract) |
| Consensus | `gl.vm.run_nondet_unsafe` + partial field matching |
| Frontend | Next.js, TypeScript |
| SDK | GenLayerJS |

---

## Interact via CLI

```bash
# Create a battle (stake 5 GEN)
genlayer write --contract 0xaFd6d03... create_battle "Be the change you wish to see." "Gandhi" --fee-value 5000000000000000000

# Challenge
genlayer write --contract 0xaFd6d03... challenge "1" "Stay hungry, stay foolish." "Steve Jobs" --fee-value 5000000000000000000

# Judge
genlayer write --contract 0xaFd6d03... judge_battle "1"

# Check result
genlayer call --contract 0xaFd6d03... get_battle "1"
```

---

## 📜 License

[MIT](./LICENSE)
