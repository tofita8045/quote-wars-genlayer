"use client";
import { useState, useEffect } from "react";
import { client, CONTRACT_ADDRESS } from "@/lib/genlayer";

type Battle = {
  id: string; player1: string; player2: string; quote1: string; quote1_author: string;
  quote2: string; quote2_author: string; stake1: string; stake2: string;
  status: number; winner: string; judgment: string;
};

const STATUS = ["Open", "Matched", "Finished"];
const COLORS = ["#4caf50", "#ff9800", "#9c27b0"];

export default function Home() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"browse" | "create">("browse");
  const [selected, setSelected] = useState<Battle | null>(null);
  const [form, setForm] = useState({ quote: "", author: "", stake: "" });
  const [challenge, setChallenge] = useState({ quote: "", author: "" });
  const [tx, setTx] = useState("");

  useEffect(() => { if (CONTRACT_ADDRESS) load(); }, []);

  async function load() {
    try {
      const count = Number(await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, functionName: "get_battle_count", args: [] }));
      const loaded: Battle[] = [];
      for (let i = 1; i <= count; i++) {
        const raw = await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, functionName: "get_battle", args: [String(i)] });
        loaded.push(JSON.parse(raw as string));
      }
      setBattles(loaded);
    } catch (e) { console.error(e); }
  }

  async function send(fn: string, args: any[], value?: bigint) {
    setLoading(true); setTx(`${fn}...`);
    try {
      const hash = await client.writeContract({ address: CONTRACT_ADDRESS as `0x${string}`, functionName: fn, args, ...(value ? { value } : {}) });
      await client.waitForTransactionReceipt({ hash });
      setTx("✓ Done!"); await load(); setSelected(null);
    } catch (e: any) { setTx(`Error: ${e.message}`); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ textAlign: "center" }}>⚔️ QuoteWars</h1>
      <p style={{ textAlign: "center", color: "#888" }}>Pit quotes against each other. Stake tokens. AI picks the winner.</p>

      {tx && <div style={{ background: "#1a1a2e", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{tx}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button onClick={() => { setTab("browse"); setSelected(null); }} style={tabBtn(tab === "browse")}>Battles</button>
        <button onClick={() => { setTab("create"); setSelected(null); }} style={tabBtn(tab === "create")}>Drop a Quote</button>
      </div>

      {tab === "create" && (
        <form onSubmit={e => { e.preventDefault(); send("create_battle", [form.quote, form.author], BigInt(form.stake) * BigInt(10**18)); }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <textarea placeholder="Your quote..." value={form.quote} onChange={e => setForm({...form, quote: e.target.value})} required rows={2} style={inp} />
          <input placeholder="Author (or 'Me')" value={form.author} onChange={e => setForm({...form, author: e.target.value})} required style={inp} />
          <input placeholder="Stake (GEN)" type="number" min="1" value={form.stake} onChange={e => setForm({...form, stake: e.target.value})} required style={inp} />
          <button type="submit" disabled={loading} style={btn}>🎤 Drop Quote & Stake</button>
        </form>
      )}

      {tab === "browse" && !selected && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {battles.length === 0 && <p style={{ color: "#888" }}>No battles yet. Drop the first quote!</p>}
          {battles.map(b => (
            <div key={b.id} onClick={() => setSelected(b)} style={{ background: "#1a1a2e", padding: 16, borderRadius: 8, cursor: "pointer", border: "1px solid #333" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontStyle: "italic" }}>"{b.quote1.slice(0, 60)}{b.quote1.length > 60 ? "..." : ""}"</p>
                <span style={{ background: COLORS[b.status], padding: "4px 10px", borderRadius: 12, fontSize: 12 }}>{STATUS[b.status]}</span>
              </div>
              {b.quote2 && <p style={{ margin: "4px 0 0", color: "#f44336", fontStyle: "italic" }}>vs "{b.quote2.slice(0, 60)}{b.quote2.length > 60 ? "..." : ""}"</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "browse" && selected && (
        <div style={{ background: "#1a1a2e", padding: 24, borderRadius: 12, border: "1px solid #333" }}>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#6c5ce7", cursor: "pointer" }}>← Back</button>
          <span style={{ background: COLORS[selected.status], padding: "4px 10px", borderRadius: 12, fontSize: 12, marginLeft: 12 }}>{STATUS[selected.status]}</span>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: selected.winner === selected.player1 ? "#1a2a1a" : "#12122a", padding: 16, borderRadius: 8, border: selected.winner === selected.player1 ? "2px solid #4caf50" : "1px solid #333" }}>
              <p style={{ fontSize: 18, fontStyle: "italic", margin: "0 0 8px" }}>"{selected.quote1}"</p>
              <small style={{ color: "#aaa" }}>— {selected.quote1_author}</small><br />
              <small>Stake: {(Number(BigInt(selected.stake1)) / 1e18).toFixed(1)} GEN</small>
              {selected.winner === selected.player1 && <div style={{ color: "#4caf50", marginTop: 8 }}>👑 WINNER</div>}
            </div>
            <div style={{ background: selected.winner === selected.player2 ? "#1a2a1a" : "#12122a", padding: 16, borderRadius: 8, border: selected.winner === selected.player2 ? "2px solid #4caf50" : "1px solid #333" }}>
              {selected.quote2 ? (
                <>
                  <p style={{ fontSize: 18, fontStyle: "italic", margin: "0 0 8px" }}>"{selected.quote2}"</p>
                  <small style={{ color: "#aaa" }}>— {selected.quote2_author}</small><br />
                  <small>Stake: {(Number(BigInt(selected.stake2)) / 1e18).toFixed(1)} GEN</small>
                  {selected.winner === selected.player2 && <div style={{ color: "#4caf50", marginTop: 8 }}>👑 WINNER</div>}
                </>
              ) : <p style={{ color: "#888" }}>Waiting for challenger...</p>}
            </div>
          </div>

          {selected.judgment && (
            <div style={{ marginTop: 16, background: "#1a2a1a", padding: 12, borderRadius: 8 }}>
              <strong>⚖️ Verdict:</strong> {JSON.parse(selected.judgment).reasoning}
            </div>
          )}

          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {selected.status === 0 && (
              <>
                <textarea placeholder="Your counter-quote..." value={challenge.quote} onChange={e => setChallenge({...challenge, quote: e.target.value})} rows={2} style={inp} />
                <input placeholder="Author" value={challenge.author} onChange={e => setChallenge({...challenge, author: e.target.value})} style={inp} />
                <button onClick={() => send("challenge", [selected.id, challenge.quote, challenge.author], BigInt(Number(BigInt(selected.stake1))))} disabled={loading || !challenge.quote || !challenge.author} style={{ ...btn, background: "#f44336" }}>⚔️ Challenge & Match Stake</button>
              </>
            )}
            {selected.status === 1 && (
              <button onClick={() => send("judge_battle", [selected.id])} disabled={loading} style={{ ...btn, background: "#ff9800" }}>⚖️ Let AI Judge</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = { padding: 12, borderRadius: 8, border: "1px solid #333", background: "#1a1a2e", color: "#e0e0e0", fontSize: 14 };
const btn: React.CSSProperties = { padding: "12px 20px", borderRadius: 8, border: "none", background: "#6c5ce7", color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: "bold" };
const tabBtn = (a: boolean): React.CSSProperties => ({ padding: "10px 20px", background: a ? "#6c5ce7" : "#2d2d2d", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer" });
