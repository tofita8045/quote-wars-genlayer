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

    @gl.public.write.payable
    def create_battle(self, quote: str, author: str) -> i32:
        value = gl.message.value
        if value == u256(0):
            raise gl.vm.UserError("Must stake on your quote")

        self.battle_count = i32(int(self.battle_count) + 1)
        battle_id = str(int(self.battle_count))
        now = int(datetime.now(timezone.utc).timestamp())

        battle = {
            "id": battle_id,
            "player1": str(gl.message.sender_address),
            "player2": "",
            "quote1": quote,
            "quote1_author": author,
            "quote2": "",
            "quote2_author": "",
            "stake1": str(value),
            "stake2": "0",
            "status": 0,  # 0=open, 1=matched, 2=judged
            "winner": "",
            "judgment": "",
            "created_at": now,
        }
        self.battles[battle_id] = json.dumps(battle)
        return self.battle_count

    @gl.public.write.payable
    def challenge(self, battle_id: str, quote: str, author: str) -> None:
        battle = json.loads(self.battles[battle_id])
        if battle["status"] != 0:
            raise gl.vm.UserError("Battle not open")
        if str(gl.message.sender_address) == battle["player1"]:
            raise gl.vm.UserError("Cannot challenge yourself")

        value = gl.message.value
        if value == u256(0):
            raise gl.vm.UserError("Must stake on your quote")

        battle["player2"] = str(gl.message.sender_address)
        battle["quote2"] = quote
        battle["quote2_author"] = author
        battle["stake2"] = str(value)
        battle["status"] = 1
        self.battles[battle_id] = json.dumps(battle)

    @gl.public.write
    def judge_battle(self, battle_id: str) -> typing.Any:
        battle = json.loads(self.battles[battle_id])
        if battle["status"] != 1:
            raise gl.vm.UserError("Battle not ready")

        def leader_fn():
            prompt = f"""You are judging a quote battle. Which quote is more powerful, profound, and inspiring?

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
    "reasoning": "brief explanation of why the winning quote is superior"
}}"""
            response = gl.nondet.exec_prompt(prompt)
            return json.loads(response)

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            validator_data = leader_fn()
            leader_data = leader_result.calldata
            return (leader_data["winner"] == validator_data["winner"]
                    and abs(leader_data["score1"] - validator_data["score1"]) <= 2
                    and abs(leader_data["score2"] - validator_data["score2"]) <= 2)

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        total = u256(int(battle["stake1"]) + int(battle["stake2"]))
        if result["winner"] == 1:
            battle["winner"] = battle["player1"]
            self._pay(battle["player1"], total)
        else:
            battle["winner"] = battle["player2"]
            self._pay(battle["player2"], total)

        battle["status"] = 2
        battle["judgment"] = json.dumps(result)
        self.battles[battle_id] = json.dumps(battle)

    @gl.public.write
    def cancel_battle(self, battle_id: str) -> None:
        battle = json.loads(self.battles[battle_id])
        if battle["status"] != 0:
            raise gl.vm.UserError("Can only cancel open battles")
        if str(gl.message.sender_address) != battle["player1"]:
            raise gl.vm.UserError("Only creator can cancel")

        battle["status"] = 2
        self.battles[battle_id] = json.dumps(battle)
        self._pay(battle["player1"], u256(int(battle["stake1"])))

    @gl.public.view
    def get_battle(self, battle_id: str) -> str:
        return self.battles[battle_id]

    @gl.public.view
    def get_battle_count(self) -> i32:
        return self.battle_count

    def _pay(self, recipient: str, amount: u256) -> None:
        @gl.evm.contract_interface
        class _Recipient:
            class View:
                pass
            class Write:
                pass
        _Recipient(Address(recipient)).emit_transfer(value=amount)
