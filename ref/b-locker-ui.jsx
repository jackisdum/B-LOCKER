import { useState, useEffect, useRef } from "react";

const APPS = [
  { id: "instagram", name: "Instagram", letter: "Ig", color: "#C13584", blocked: true, dailyMin: 47, sessions: 3 },
  { id: "tiktok", name: "TikTok", letter: "Tt", color: "#010101", blocked: true, dailyMin: 62, sessions: 5 },
  { id: "twitter", name: "Twitter / X", letter: "X", color: "#1A8CD8", blocked: false, dailyMin: 23, sessions: 2 },
  { id: "youtube", name: "YouTube", letter: "Yt", color: "#FF0000", blocked: true, dailyMin: 88, sessions: 4 },
];

const GOAL_OPTIONS = [5, 10, 15, 20, 30];

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const C = {
  bg: "#F5F4F0",
  surface: "#FFFFFF",
  border: "#E2E0D8",
  text: "#1A1917",
  muted: "#8A8880",
  danger: "#C0392B",
  success: "#2D6A4F",
};

export default function BLocker() {
  const [screen, setScreen] = useState("home");
  const [apps, setApps] = useState(APPS);
  const [selectedApp, setSelectedApp] = useState(null);
  const [goalMin, setGoalMin] = useState(10);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalSec, setTotalSec] = useState(0);
  const [hurdleInput, setHurdleInput] = useState("");
  const [hurdleElapsed, setHurdleElapsed] = useState(0);
  const [hurdleOk, setHurdleOk] = useState(false);
  const [hurdleError, setHurdleError] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (screen === "active" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); setScreen("hurdle"); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [screen]);

  function startSession() {
    const secs = goalMin * 60;
    setTotalSec(secs);
    setTimeLeft(secs);
    setHurdleElapsed(goalMin);
    setHurdleInput("");
    setHurdleError(false);
    setHurdleOk(false);
    setScreen("active");
  }

  function openApp(app) {
    if (!app.blocked) return;
    setSelectedApp(app);
    setGoalMin(10);
    setScreen("session-start");
  }

  function toggleBlock(id, e) {
    e.stopPropagation();
    setApps(prev => prev.map(a => a.id === id ? { ...a, blocked: !a.blocked } : a));
  }

  const requiredPhrase = selectedApp
    ? `I have spent ${hurdleElapsed} minutes on ${selectedApp.name}.`
    : "";

  function tryExtend() {
    if (hurdleInput.trim() === requiredPhrase) {
      setHurdleOk(true);
      setHurdleError(false);
      setTotalSec(5 * 60);
      setTimeLeft(5 * 60);
      setHurdleElapsed(h => h + 5);
      setHurdleInput("");
      setTimeout(() => { setHurdleOk(false); setScreen("active"); }, 1000);
    } else {
      setHurdleError(true);
    }
  }

  const totalUsage = apps.reduce((s, a) => s + a.dailyMin, 0);
  const totalSessions = apps.reduce((s, a) => s + a.sessions, 0);
  const pct = (v) => Math.round((v / totalUsage) * 100);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea { font-family: inherit; }
        .row-hover:hover { background: #EFEDE8 !important; }
        .btn-outline:hover { background: #F5F4F0 !important; }
        .goal-opt:hover { border-color: #1A1917 !important; }
      `}</style>

      <div style={{ width: 375, background: C.surface, borderRadius: 48, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.10)", display: "flex", flexDirection: "column", minHeight: 760 }}>

        {/* Status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px 0", fontSize: 13, fontWeight: 500, color: C.text }}>
          <span>9:41</span>
          <div style={{ width: 72, height: 6, background: C.border, borderRadius: 3, alignSelf: "center" }} />
          <span>100%</span>
        </div>

        {/* ── HOME ── */}
        {screen === "home" && <>
          <div style={{ flex: 1, padding: "24px 20px 12px", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <p style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>B-LOCKER</p>
                <h1 style={{ fontSize: 28, fontWeight: 600, color: C.text, lineHeight: 1 }}>Good morning.</h1>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔒</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 28 }}>
              {[["Today", `${totalUsage}m`], ["Sessions", totalSessions], ["Blocked", apps.filter(a=>a.blocked).length]].map(([l, v]) => (
                <div key={l} style={{ background: C.bg, borderRadius: 14, padding: "12px 14px" }}>
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>{l}</p>
                  <p style={{ fontSize: 22, fontWeight: 600, color: C.text, fontFamily: "'DM Mono', monospace" }}>{v}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Managed Apps</p>
              <p style={{ fontSize: 12, color: C.muted }}>tap to open</p>
            </div>

            <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
              {apps.map((app, i) => (
                <div key={app.id} className="row-hover" onClick={() => openApp(app)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", background: C.surface, borderBottom: i < apps.length - 1 ? `1px solid ${C.border}` : "none", cursor: app.blocked ? "pointer" : "default", transition: "background 0.12s" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: app.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {app.letter}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{app.name}</p>
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{app.dailyMin}m today · {app.sessions} sessions</p>
                  </div>
                  <button onClick={e => toggleBlock(app.id, e)}
                    style={{ width: 44, height: 26, borderRadius: 13, background: app.blocked ? C.text : C.border, border: "none", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", width: 20, height: 20, borderRadius: 10, background: "white", top: 3, left: app.blocked ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.18)" }} />
                  </button>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 18, lineHeight: 1.7 }}>
              Toggle to enable or disable blocking.<br />Blocked apps require an intentional check-in.
            </p>
          </div>
          <Nav screen={screen} setScreen={setScreen} C={C} />
        </>}

        {/* ── SESSION START ── */}
        {screen === "session-start" && selectedApp && (
          <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column" }}>
            <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: C.muted, fontSize: 14, textAlign: "left", padding: 0, marginBottom: 24 }}>← Back</button>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: selectedApp.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 600, fontSize: 16 }}>
                {selectedApp.letter}
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Opening</p>
                <p style={{ fontSize: 20, fontWeight: 600, color: C.text }}>{selectedApp.name}</p>
              </div>
            </div>

            <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>How long do you need?</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {GOAL_OPTIONS.map(min => (
                <button key={min} className="goal-opt" onClick={() => setGoalMin(min)}
                  style={{ flex: 1, padding: "10px 0", border: `1.5px solid ${goalMin === min ? C.text : C.border}`, borderRadius: 10, background: goalMin === min ? C.text : "white", color: goalMin === min ? "white" : C.muted, fontSize: 14, fontWeight: 500, transition: "all 0.15s" }}>
                  {min}m
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "2px 16px", marginBottom: 28 }}>
              <input type="number" min="1" max="120" value={goalMin}
                onChange={e => setGoalMin(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 24, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: C.text, padding: "10px 0", background: "transparent" }} />
              <span style={{ color: C.muted, fontSize: 14 }}>minutes</span>
            </div>

            <div style={{ background: C.bg, borderRadius: 12, padding: "14px 16px", marginBottom: "auto" }}>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                When your session ends, you'll need to type a short acknowledgement before you can extend. This is intentional.
              </p>
            </div>

            <button onClick={startSession}
              style={{ marginTop: 20, display: "block", width: "100%", padding: "15px", borderRadius: 14, background: C.text, color: "white", fontSize: 16, fontWeight: 600, border: "none" }}>
              Start {goalMin}-minute session
            </button>
          </div>
        )}

        {/* ── ACTIVE SESSION ── */}
        {screen === "active" && selectedApp && (
          <div style={{ flex: 1, padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 44 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: 4, background: C.success }} />
                <span style={{ fontSize: 13, color: C.muted }}>Live session</span>
              </div>
              <button onClick={() => { clearInterval(timerRef.current); setScreen("home"); }}
                className="btn-outline" style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 99, color: C.muted, padding: "5px 14px", fontSize: 13, transition: "background 0.12s" }}>
                End
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: selectedApp.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 600 }}>
                {selectedApp.letter}
              </div>
              <span style={{ fontSize: 16, fontWeight: 500, color: C.text }}>{selectedApp.name}</span>
            </div>

            <p style={{ fontSize: 80, fontWeight: 400, fontFamily: "'DM Mono', monospace", color: C.text, letterSpacing: -3, lineHeight: 1, marginBottom: 10 }}>
              {formatTime(timeLeft)}
            </p>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 44 }}>remaining of {goalMin} minutes</p>

            <div style={{ width: "100%", height: 4, background: C.border, borderRadius: 2, marginBottom: 36, overflow: "hidden" }}>
              <div style={{ height: "100%", background: C.text, borderRadius: 2, width: `${totalSec > 0 ? Math.round((1 - timeLeft / totalSec) * 100) : 0}%`, transition: "width 1s linear" }} />
            </div>

            <div style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
              {[["Goal", `${goalMin}m`], ["Used today", `${selectedApp.dailyMin}m`], ["Sessions", `${selectedApp.sessions + 1}`]].map(([l, v], i, a) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: i < a.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 14, color: C.muted }}>{l}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: "'DM Mono', monospace" }}>{v}</span>
                </div>
              ))}
            </div>

            <button onClick={() => { clearInterval(timerRef.current); setScreen("hurdle"); }}
              style={{ marginTop: "auto", paddingTop: 20, background: "none", border: "none", color: C.muted, fontSize: 13 }}>
              Preview hurdle →
            </button>
          </div>
        )}

        {/* ── HURDLE ── */}
        {screen === "hurdle" && selectedApp && (
          <div style={{ flex: 1, padding: "32px 20px 24px", display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Time's up</p>
            <h2 style={{ fontSize: 26, fontWeight: 600, color: C.text, marginBottom: 10, lineHeight: 1.2 }}>Acknowledge<br />your usage.</h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
              Type the statement below exactly to unlock 5 more minutes.
            </p>

            <div style={{ borderLeft: `3px solid ${C.text}`, paddingLeft: 14, marginBottom: 22 }}>
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, fontStyle: "italic" }}>
                "{requiredPhrase}"
              </p>
            </div>

            <textarea value={hurdleInput} onChange={e => { setHurdleInput(e.target.value); setHurdleError(false); }}
              rows={3} placeholder="Type the statement above…"
              style={{ width: "100%", border: `1.5px solid ${hurdleError ? C.danger : C.border}`, borderRadius: 12, fontSize: 15, padding: "12px 14px", resize: "none", outline: "none", color: C.text, lineHeight: 1.7, background: "white", transition: "border-color 0.15s", marginBottom: 8 }} />

            {hurdleError && <p style={{ fontSize: 13, color: C.danger, marginBottom: 8 }}>Doesn't match — check spacing and punctuation.</p>}
            {hurdleOk && <p style={{ fontSize: 13, color: C.success, fontWeight: 500, marginBottom: 8 }}>✓ Acknowledged. Resuming session…</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto", paddingTop: 16 }}>
              <button onClick={tryExtend}
                style={{ padding: "15px", borderRadius: 14, background: C.text, color: "white", fontSize: 16, fontWeight: 600, border: "none" }}>
                Extend 5 more minutes
              </button>
              <button onClick={() => setScreen("home")} className="btn-outline"
                style={{ padding: "14px", borderRadius: 14, background: "transparent", color: C.muted, fontSize: 15, border: `1px solid ${C.border}`, transition: "background 0.12s" }}>
                I'm done for now
              </button>
            </div>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {screen === "dashboard" && <>
          <div style={{ flex: 1, padding: "24px 20px 12px", overflowY: "auto" }}>
            <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Monday, Apr 28</p>
            <h2 style={{ fontSize: 28, fontWeight: 600, color: C.text, marginBottom: 24 }}>Your usage</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28 }}>
              {[["Total today", `${totalUsage}m`, false], ["vs. yesterday", "+12m", true], ["Sessions", totalSessions, false], ["Hurdles passed", 4, false]].map(([l, v, warn]) => (
                <div key={l} style={{ background: C.bg, borderRadius: 14, padding: "14px 16px" }}>
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>{l}</p>
                  <p style={{ fontSize: 24, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: warn ? C.danger : C.text }}>{v}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>App breakdown</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
              {apps.map(app => (
                <div key={app.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: app.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 600 }}>
                        {app.letter}
                      </div>
                      <span style={{ fontSize: 14, color: C.text }}>{app.name}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: C.text }}>{app.dailyMin}m</span>
                  </div>
                  <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: app.color, opacity: 0.7, borderRadius: 3, width: `${pct(app.dailyMin)}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{app.sessions} sessions</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{pct(app.dailyMin)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>This week</p>
            <div style={{ background: C.bg, borderRadius: 14, padding: "16px", display: "flex", alignItems: "flex-end", gap: 6, height: 88 }}>
              {[80, 120, 95, 140, 110, 220, totalUsage].map((val, i) => {
                const days = ["M","T","W","T","F","S","S"];
                const isToday = i === 6;
                const h = Math.round((val / 220) * 44);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ width: "100%", height: h, background: isToday ? C.text : C.border, borderRadius: "3px 3px 0 0" }} />
                    <span style={{ fontSize: 10, color: isToday ? C.text : C.muted, fontWeight: isToday ? 600 : 400 }}>{days[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <Nav screen={screen} setScreen={setScreen} C={C} />
        </>}
      </div>
    </div>
  );
}

function Nav({ screen, setScreen, C }) {
  return (
    <nav style={{ display: "flex", borderTop: `1px solid ${C.border}` }}>
      {[{ id: "home", label: "Apps", icon: "⊞" }, { id: "dashboard", label: "Stats", icon: "◎" }].map(tab => {
        const active = screen === tab.id || (tab.id === "home" && ["session-start","active","hurdle"].includes(screen));
        return (
          <button key={tab.id} onClick={() => setScreen(tab.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "12px 0 22px", background: "white", border: "none", color: active ? C.text : C.border, fontSize: 10, fontWeight: active ? 600 : 400, cursor: "pointer", transition: "color 0.15s" }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
