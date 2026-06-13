# Build QuoteWars: A Quote Battle dApp on GenLayer

Ever argued with someone about which quote is more powerful? What if you could stake money on it and let AI decide?

In this tutorial, we'll build **QuoteWars** — a dApp where players pit quotes against each other, stake tokens, and GenLayer's AI validators judge the winner. The better quote takes the prize pool.

**GenLayer** is an AI-native blockchain where validators use LLMs to reach consensus on subjective decisions. Unlike traditional smart contracts that only handle deterministic logic, GenLayer's Intelligent Contracts can evaluate text, judge quality, and make nuanced decisions — perfect for judging quotes.

## Prerequisites

- Node.js 18+
- Basic Python and TypeScript knowledge
- A terminal

## Step 1: Setup GenLayer

Install the GenLayer CLI and create your deployment account:

```bash
npm install -g genlayer
genlayer network set studionet
genlayer account create --name deployer --password "your-password"
genlayer account unlock --password "your-password"
```

That's it. You're connected to GenLayer's Studio Network — a hosted environment where you can deploy and test for free.

## Step 2: Write the Intelligent Contract

Create `contracts/quote_wars.py`. GenLayer contracts are written in Python and run on the GenVM:

```python
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json
import typing
from datetime import datetime, timezone


class QuoteWars(gl.Contract):
    battle_count: i32
    battles: TreeMap[str, str]

    def __init__(self):
        self.battle_count = i32(0)
```

The contract stores battles in a `TreeMap` (GenLayer's on-chain key-value store). Let's add the core functions.

### Creating a Battle

A player drops a quote and stakes tokens:

```python
    @gl.public.write.payable
    def create_battle(self, quote: str, author: str) -> i32:
        value = gl.message.value
        if value == u256(0):
            raise gl.vm.UserError("Must stake on your quote")

        self.battle_count = i32(int(self.battle_count) + 1)
        battle_id = str(int(self.battle_count))

        battle = {
            "id": battle_id,
            "player1": str(gl.message.sender_address),
            "quote1": quote,
            "quote1_author": author,
            "stake1": str(value),
            "status": 0,  # 0=open, 1=matched, 2=judged
            # ... other fields
        }
        self.battles[battle_id] = json.dumps(battle)
        return self.battle_count
```

The `@gl.public.write.payable` decorator means this function can receive GEN tokens. The staked amount is held by the contract until the battle is resolved.

### Challenging

Another player counter-quotes and matches the stake:

```python
    @gl.public.write.payable
    def challenge(self, battle_id: str, quote: str, author: str) -> None:
        battle = json.loads(self.battles[battle_id])
        if battle["status"] != 0:
            raise gl.vm.UserError("Battle not open")
        if str(gl.message.sender_address) == battle["player1"]:
            raise gl.vm.UserError("Cannot challenge yourself")

        battle["player2"] = str(gl.message.sender_address)
        battle["quote2"] = quote
        battle["quote2_author"] = author
        battle["stake2"] = str(gl.message.value)
        battle["status"] = 1  # now matched, ready for judging
        self.battles[battle_id] = json.dumps(battle)
```

### The AI Judgment — The Core of GenLayer

This is where the magic happens. We use `gl.vm.run_nondet_unsafe` to create a **leader/validator pattern**:

```python
    @gl.public.write
    def judge_battle(self, battle_id: str) -> typing.Any:
        battle = json.loads(self.battles[battle_id])
        if battle["status"] != 1:
            raise gl.vm.UserError("Battle not ready")

        def leader_fn():
            prompt = f"""You are judging a quote battle. Which quote is more powerful?

QUOTE 1: "{battle['quote1']}" — {battle['quote1_author']}
QUOTE 2: "{battle['quote2']}" — {battle['quote2_author']}

Judge based on:
1. Depth of meaning and insight
2. Originality and creativity
3. Emotional impact
4. Universal relevance

Return JSON:
{{
    "winner": 1 or 2,
    "score1": 1-10,
    "score2": 1-10,
    "reasoning": "brief explanation"
}}"""
            response = gl.nondet.exec_prompt(prompt)
            return json.loads(response)

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            validator_data = leader_fn()
            leader_data = leader_result.calldata
            # Winner must match exactly, scores within ±2
            return (leader_data["winner"] == validator_data["winner"]
                    and abs(leader_data["score1"] - validator_data["score1"]) <= 2
                    and abs(leader_data["score2"] - validator_data["score2"]) <= 2)

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        # Pay the winner
        total = u256(int(battle["stake1"]) + int(battle["stake2"]))
        if result["winner"] == 1:
            self._pay(battle["player1"], total)
        else:
            self._pay(battle["player2"], total)
```

**How consensus works here:**

1. The **leader** node runs the LLM prompt and proposes a result
2. Each **validator** node independently runs the same prompt
3. Validators check: does the leader's winner match mine? Are scores within ±2?
4. If a majority agrees, the result is accepted and stored on-chain

This is the Equivalence Principle — validators don't need identical outputs, just equivalent judgments. Two LLMs might give scores of 8 and 7, but they'll agree on who won.

## Step 3: Deploy

```bash
genlayer deploy --contract contracts/quote_wars.py
```

Output:
```
✔ Contract deployed successfully.
Contract Address: 0xaFd6d033F753AC97fb151e1e65f6cc5EEc449c10
```

Your contract is now live on GenLayer's network with AI validators ready to judge quote battles.

## Step 4: Build the Frontend

Install the GenLayerJS SDK:

```bash
mkdir frontend && cd frontend
npm init -y
npm install genlayer-js next react react-dom
```

Create the client (`src/lib/genlayer.ts`):

```typescript
import { createClient, createAccount } from "genlayer-js";
import { simulator } from "genlayer-js/chains";

const account = createAccount();
export const client = createClient({ chain: simulator, account });
export const CONTRACT_ADDRESS = "0xaFd6d033F753AC97fb151e1e65f6cc5EEc449c10";
```

Reading a battle:

```typescript
const raw = await client.readContract({
  address: CONTRACT_ADDRESS,
  functionName: "get_battle",
  args: ["1"],
});
const battle = JSON.parse(raw);
```

Creating a battle (with payment):

```typescript
const hash = await client.writeContract({
  address: CONTRACT_ADDRESS,
  functionName: "create_battle",
  args: ["The only way to do great work is to love what you do.", "Steve Jobs"],
  value: BigInt(5) * BigInt(10 ** 18), // 5 GEN
});
await client.waitForTransactionReceipt({ hash });
```

Triggering AI judgment:

```typescript
const hash = await client.writeContract({
  address: CONTRACT_ADDRESS,
  functionName: "judge_battle",
  args: ["1"],
});
// This takes a moment — AI validators are evaluating the quotes
await client.waitForTransactionReceipt({ hash });
```

## Step 5: Demo Flow

Here's a complete battle:

1. **Player 1** drops: *"The only way to do great work is to love what you do."* — Steve Jobs (stakes 5 GEN)

2. **Player 2** challenges: *"It is not the strongest that survive, nor the most intelligent, but the one most responsive to change."* — Charles Darwin (stakes 5 GEN)

3. **Anyone** triggers judgment → AI validators score both quotes independently

4. **Result**: AI decides Darwin's quote wins (deeper evolutionary insight, more universal) → Player 2 receives 10 GEN

The whole process takes about 30 seconds from judgment trigger to payout.

## What You Learned

- **Intelligent Contracts** use Python and can call LLMs directly
- **`gl.vm.run_nondet_unsafe`** lets you define custom leader/validator logic for AI consensus
- **Partial field matching** is how you handle subjective scoring — exact match on the decision, tolerance on the numbers
- **GenLayerJS SDK** makes frontend integration straightforward — same pattern as other web3 libraries

## What's Next

Some ideas to extend QuoteWars:
- Add categories (philosophy, humor, motivation)
- Implement a leaderboard tracking win/loss records
- Allow spectators to bet on which quote wins
- Add multi-round tournaments

## Resources

- [Source code on GitHub](https://github.com/tofita8045/quote-wars-genlayer)
- [GenLayer Documentation](https://docs.genlayer.com)
- [GenLayer Studio](https://studio.genlayer.com)
- [Equivalence Principle explained](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
