import React, { useEffect, useState } from "react";
import { getChallenges, joinChallenge, leaveChallenge } from "../utils/api";
import "./ChallengesPage.css";

export default function ChallengesPage() {
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [tab, setTab] = useState("available"); // 'available' | 'mine'
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState({}); // { [id]: boolean }

  const load = async () => {
    try {
      setLoading(true);
      const data = await getChallenges();
      setAvailable(Array.isArray(data?.available) ? data.available : []);
      setMine(Array.isArray(data?.mine) ? data.mine : []);
    } catch (e) {
      setToast(e?.response?.data?.message || "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const join = async (id) => {
    try {
      setBusy((s) => ({ ...s, [id]: true }));
      await joinChallenge(id);
      setToast("Joined challenge!");
      // Move card from available → mine
      const found = available.find(c => c.challenge_id === id);
      setAvailable(av => av.filter(c => c.challenge_id !== id));
      if (found) setMine(m => [{ ...found, participants: Number(found.participants || 0) + 1 }, ...m]);
    } catch (e) {
      setToast(e?.response?.data?.message || "Could not join");
    } finally {
      setBusy((s) => ({ ...s, [id]: false }));
    }
  };

  const leave = async (id) => {
    try {
      setBusy((s) => ({ ...s, [id]: true }));
      await leaveChallenge(id);
      setToast("Left challenge.");
      // Move card from mine → available
      const found = mine.find(c => c.challenge_id === id);
      setMine(m => m.filter(c => c.challenge_id !== id));
      if (found) setAvailable(a => [{ ...found, participants: Math.max(Number(found.participants || 0) - 1, 0) }, ...a]);
    } catch (e) {
      setToast(e?.response?.data?.message || "Could not leave");
    } finally {
      setBusy((s) => ({ ...s, [id]: false }));
    }
  };

  return (
    <div className="ch-page">
      <header className="ch-hero">
        <h1>🌍 Sustainability Challenges</h1>
        <p>Join challenges to reduce your footprint and earn rewards.</p>
      </header>

      {toast && <div className="ch-toast" onAnimationEnd={() => setToast("")}>{toast}</div>}

      <div className="ch-tabs">
        <button className={tab === "available" ? "active" : ""} onClick={() => setTab("available")}>
          Available
          <span className="badge">{available.length}</span>
        </button>
        <button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>
          My Challenges
          <span className="badge">{mine.length}</span>
        </button>
      </div>

      {loading ? (
        <div className="skeleton-grid">
          {[...Array(6)].map((_, i) => <div className="skeleton-card" key={i} />)}
        </div>
      ) : (
        <>
          {tab === "available" && (
            available.length === 0 ? (
              <div className="empty">
                <h3>No active challenges right now</h3>
                <p>Check back soon!</p>
              </div>
            ) : (
              <div className="ch-grid">
                {available.map(c => (
                  <Card key={c.challenge_id} c={c}>
                    <button
                      className="btn primary"
                      disabled={busy[c.challenge_id]}
                      onClick={() => join(c.challenge_id)}
                    >
                      {busy[c.challenge_id] ? "Joining..." : "Join"}
                    </button>
                  </Card>
                ))}
              </div>
            )
          )}

          {tab === "mine" && (
            mine.length === 0 ? (
              <div className="empty">
                <h3>You haven’t joined any challenges yet</h3>
                <p>Pick one from the “Available” tab to get started.</p>
              </div>
            ) : (
              <div className="ch-grid">
                {mine.map(c => (
                  <Card key={c.challenge_id} c={c}>
                    <button
                      className="btn ghost"
                      disabled={busy[c.challenge_id]}
                      onClick={() => leave(c.challenge_id)}
                    >
                      {busy[c.challenge_id] ? "Leaving..." : "Leave"}
                    </button>
                  </Card>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

function Card({ c, children }) {
  const fmt = (d) => new Date(d).toLocaleDateString();
  return (
    <div className="ch-card">
      <div className="ch-card-head">
        <h3>{c.challenge_name}</h3>
        <span className={`pill ${c.category}`}>{c.category}</span>
      </div>
      <p className="desc">{c.description}</p>
      <div className="meta">
        <div><strong>Reward</strong><div>{c.reward_points} pts</div></div>
        <div><strong>Participants</strong><div>{c.participants ?? 0}</div></div>
        <div><strong>Duration</strong><div>{fmt(c.start_date)} – {fmt(c.end_date)}</div></div>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
