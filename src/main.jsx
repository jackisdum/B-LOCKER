import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { registerPlugin } from '@capacitor/core';

const BockerNative = registerPlugin('BockerNative');

const APPS = [
  { id: "instagram", name: "Instagram", color: "#E1306C", bg: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", icon: "IG", blocked: true, dailyMin: 47, sessions: 3 },
  { id: "tiktok", name: "TikTok", color: "#69C9D0", bg: "linear-gradient(135deg, #010101, #69C9D0)", icon: "TT", blocked: true, dailyMin: 62, sessions: 5 },
  { id: "twitter", name: "Twitter / X", color: "#1DA1F2", bg: "linear-gradient(135deg, #1DA1F2, #0d6efd)", icon: "X", blocked: false, dailyMin: 23, sessions: 2 },
  { id: "youtube", name: "YouTube", color: "#FF0000", bg: "linear-gradient(135deg, #FF0000, #CC0000)", icon: "YT", blocked: true, dailyMin: 88, sessions: 4 },
];

const GOAL_OPTIONS = [5, 10, 15, 20, 30];

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function CircularTimer({ seconds, total, color }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? (1 - seconds / total) : 0;
  const dash = progress * circ;
  return (
    <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s linear" }} />
    </svg>
  );
}

function BLocker() {
  const [screen, setScreen] = useState("home"); // home | session-start | active | hurdle | dashboard
  const [apps, setApps] = useState(APPS);
  const [selectedApp, setSelectedApp] = useState(null);
  const [goalMin, setGoalMin] = useState(10);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalSec, setTotalSec] = useState(0);
  const [hurdleInput, setHurdleInput] = useState("");
  const [hurdleElapsed, setHurdleElapsed] = useState(0);
  const [hurdleExtended, setHurdleExtended] = useState(false);
  const [extensionError, setExtensionError] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (screen === "active" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { 
            clearInterval(timerRef.current); 
            setScreen("hurdle"); 
            // NATIVE: Start blocking again when time is up
            BockerNative.setUnlockState({ state: false });
            return 0; 
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [screen, timeLeft]);

  function startSession() {
    const secs = goalMin * 60;
    setTotalSec(secs);
    setTimeLeft(secs);
    setHurdleElapsed(goalMin);
    setHurdleInput("");
    setExtensionError(false);
    setScreen("active");
    
    // NATIVE: Unlock the app
    BockerNative.setUnlockState({ state: true });
  }

  function toggleBlock(id) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, blocked: !a.blocked } : a));
  }

  function openApp(app) {
    if (!app.blocked) return;
    setSelectedApp(app);
    setGoalMin(10);
    setScreen("session-start");
  }

  const requiredPhrase = selectedApp
    ? `I have spent ${hurdleElapsed} minutes on ${selectedApp.name}.`
    : "";

  function tryExtend() {
    if (hurdleInput.trim() === requiredPhrase) {
      setHurdleExtended(true);
      setExtensionError(false);
      const newSecs = 5 * 60;
      setTotalSec(newSecs);
      setTimeLeft(newSecs);
      setHurdleElapsed(h => h + 5);
      setHurdleInput("");
      
      // NATIVE: Unlock again for extension
      BockerNative.setUnlockState({ state: true });
      
      setTimeout(() => { setHurdleExtended(false); setScreen("active"); }, 1200);
    } else {
      setExtensionError(true);
    }
  }

  const totalUsage = apps.reduce((s, a) => s + a.dailyMin, 0);
  const totalSessions = apps.reduce((s, a) => s + a.sessions, 0);

  const styles = {
    shell: {
      minHeight: "100vh",
      background: "#0a0a12",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "2rem 1rem",
    },
    phone: {
      width: "100%",
      maxWidth: 375,
      minHeight: 780,
      background: "linear-gradient(160deg, #0f0f1e 0%, #0a0a12 50%, #0d0d1a 100%)",
      borderRadius: 44,
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 0 80px rgba(120,80,255,0.15), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    },
    statusBar: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 24px 0", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500,
    },
    notch: {
      width: 120, height: 34, background: "#0a0a12",
      borderRadius: "0 0 20px 20px",
      position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
      zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    },
    screen: { flex: 1, padding: "0 20px 20px", overflowY: "auto" },
    nav: {
      display: "flex", justifyContent: "space-around", padding: "12px 0 24px",
      borderTop: "0.5px solid rgba(255,255,255,0.08)",
      background: "rgba(10,10,18,0.95)",
    },
    navBtn: (active) => ({
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      color: active ? "#a78bfa" : "rgba(255,255,255,0.3)",
      background: "none", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 500,
      transition: "color 0.2s",
    }),
    glass: {
      background: "rgba(255,255,255,0.05)",
      backdropFilter: "blur(20px)",
      border: "0.5px solid rgba(255,255,255,0.1)",
      borderRadius: 20,
    },
    appCard: (app) => ({
      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
      background: "rgba(255,255,255,0.04)",
      border: "0.5px solid rgba(255,255,255,0.08)",
      borderRadius: 16, marginBottom: 10, cursor: app.blocked ? "pointer" : "default",
      transition: "transform 0.15s, background 0.2s",
    }),
    appIcon: (bg) => ({
      width: 48, height: 48, borderRadius: 14, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: 14, flexShrink: 0,
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    }),
    toggle: (on) => ({
      width: 46, height: 26, borderRadius: 13, background: on ? "#7c3aed" : "rgba(255,255,255,0.12)",
      position: "relative", cursor: "pointer", transition: "background 0.25s", flexShrink: 0,
      border: "none",
    }),
    toggleThumb: (on) => ({
      position: "absolute", width: 20, height: 20, borderRadius: 10,
      background: on ? "white" : "rgba(255,255,255,0.6)",
      top: 3, left: on ? 23 : 3, transition: "left 0.25s",
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    }),
    pill: (color) => ({
      display: "inline-block", padding: "2px 8px", borderRadius: 99,
      background: `${color}22`, color: color, fontSize: 11, fontWeight: 600,
    }),
    goalBtn: (active) => ({
      flex: 1, padding: "10px 0", borderRadius: 12, border: "none",
      background: active ? "#7c3aed" : "rgba(255,255,255,0.07)",
      color: active ? "white" : "rgba(255,255,255,0.5)",
      fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
    }),
    cta: {
      display: "block", width: "100%", padding: "16px", borderRadius: 16,
      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
      color: "white", fontWeight: 700, fontSize: 16, border: "none",
      cursor: "pointer", textAlign: "center",
      boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
    },
    ctaSecondary: {
      display: "block", width: "100%", padding: "16px", borderRadius: 16,
      background: "rgba(255,255,255,0.07)",
      color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 15, border: "none",
      cursor: "pointer", textAlign: "center",
    },
    statCard: (color) => ({
      flex: 1, padding: "14px", borderRadius: 16,
      background: `linear-gradient(135deg, ${color}18, ${color}08)`,
      border: `0.5px solid ${color}30`,
    }),
  };

  const NavBar = () => (
    <nav style={styles.nav}>
      {[
        { id: "home", icon: "⊞", label: "Apps" },
        { id: "dashboard", icon: "◎", label: "Stats" },
      ].map(item => (
        <button key={item.id} style={styles.navBtn(screen === item.id || (screen !== "dashboard" && item.id === "home" && ["home","session-start","active","hurdle"].includes(screen)))} onClick={() => setScreen(item.id)}>
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );

  return (
    <div style={styles.shell}>
      <div style={styles.phone}>
        {/* Notch */}
        <div style={styles.notch}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ width: 60, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Status Bar */}
        <div style={styles.statusBar}>
          <span>9:41</span>
          <span style={{ width: 80 }} />
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span>●●●</span> <span>WiFi</span>
            <span style={{ background: "rgba(255,255,255,0.3)", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>100%</span>
          </span>
        </div>

        {/* === HOME SCREEN === */}
        {screen === "home" && (
          <>
            <div style={{ ...styles.screen, paddingTop: 32 }}>
              <div style={{ marginBottom: 28 }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>Good morning ✦</p>
                <h1 style={{ color: "white", fontSize: 28, fontWeight: 700, margin: "4px 0 0", letterSpacing: -0.5 }}>
                  B-LOCKER <span style={{ color: "#7c3aed" }}>🔒</span>
                </h1>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                <div style={styles.statCard("#7c3aed")}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 4 }}>TODAY</p>
                  <p style={{ margin: 0, color: "white", fontSize: 22, fontWeight: 700 }}>{totalUsage}m</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>total usage</p>
                </div>
                <div style={styles.statCard("#06b6d4")}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 4 }}>SESSIONS</p>
                  <p style={{ margin: 0, color: "white", fontSize: 22, fontWeight: 700 }}>{totalSessions}</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>check-ins</p>
                </div>
                <div style={styles.statCard("#10b981")}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 4 }}>BLOCKED</p>
                  <p style={{ margin: 0, color: "white", fontSize: 22, fontWeight: 700 }}>{apps.filter(a => a.blocked).length}</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>apps active</p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>Managed Apps</p>
                <span style={{ color: "#7c3aed", fontSize: 12, fontWeight: 600 }}>+ Add app</span>
              </div>

              {apps.map(app => (
                <div key={app.id} style={styles.appCard(app)} onClick={() => openApp(app)}>
                  <div style={styles.appIcon(app.bg)}>{app.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: "white", fontWeight: 600, fontSize: 15 }}>{app.name}</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{app.dailyMin}m today</span>
                      <span style={{ ...styles.pill("#06b6d4") }}>{app.sessions} sessions</span>
                    </div>
                  </div>
                  {app.blocked && (
                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginRight: 8 }}>tap to open</span>
                  )}
                  <button style={styles.toggle(app.blocked)} onClick={e => { e.stopPropagation(); toggleBlock(app.id); }}>
                    <div style={styles.toggleThumb(app.blocked)} />
                  </button>
                </div>
              ))}
            </div>
            <NavBar />
          </>
        )}

        {/* === SESSION START === */}
        {screen === "session-start" && selectedApp && (
          <div style={{ ...styles.screen, paddingTop: 32, display: "flex", flexDirection: "column" }}>
            <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 24, textAlign: "left" }}>
              ← Back
            </button>

            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ ...styles.appIcon(selectedApp.bg), width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px", fontSize: 20, boxShadow: `0 12px 40px ${selectedApp.color}44` }}>
                {selectedApp.icon}
              </div>
              <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: 0 }}>Open {selectedApp.name}</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 6 }}>Be intentional. How long do you need?</p>
            </div>

            <div style={{ ...styles.glass, padding: 20, marginBottom: 20 }}>
              <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>Session Goal</p>
              <div style={{ display: "flex", gap: 8 }}>
                {GOAL_OPTIONS.map(min => (
                  <button key={min} style={styles.goalBtn(goalMin === min)} onClick={() => setGoalMin(min)}>
                    {min}m
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...styles.glass, padding: 20, marginBottom: 24 }}>
              <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>Custom (minutes)</p>
              <input
                type="number" min="1" max="120" value={goalMin}
                onChange={e => setGoalMin(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "white", fontSize: 22, fontWeight: 700, padding: "8px 14px", width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginTop: "auto" }}>
              <button style={styles.cta} onClick={startSession}>
                Start {goalMin}-Minute Session →
              </button>
            </div>
          </div>
        )}

        {/* === ACTIVE SESSION === */}
        {screen === "active" && selectedApp && (
          <div style={{ ...styles.screen, paddingTop: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <div style={{ ...styles.pill("#10b981"), padding: "5px 12px", fontSize: 12 }}>● LIVE SESSION</div>
              <button onClick={() => { 
                clearInterval(timerRef.current); 
                BockerNative.setUnlockState({ state: false });
                setScreen("home"); 
              }} style={{ background: "rgba(255,80,80,0.1)", border: "0.5px solid rgba(255,80,80,0.3)", color: "#ff6b6b", padding: "6px 14px", borderRadius: 99, cursor: "pointer", fontSize: 12 }}>End</button>
            </div>

            <div style={{ ...styles.appIcon(selectedApp.bg), width: 56, height: 56, borderRadius: 16, marginBottom: 12, fontSize: 18 }}>
              {selectedApp.icon}
            </div>
            <p style={{ color: "white", fontWeight: 600, fontSize: 16, margin: "0 0 32px" }}>{selectedApp.name}</p>

            <div style={{ position: "relative", width: 200, height: 200, marginBottom: 32 }}>
              <CircularTimer seconds={timeLeft} total={totalSec} color={selectedApp.color} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                <div style={{ color: "white", fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>{formatTime(timeLeft)}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>remaining</div>
              </div>
            </div>

            <div style={{ ...styles.glass, padding: 16, width: "100%", marginBottom: 16, boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Goal</p>
                  <p style={{ margin: 0, color: "white", fontWeight: 600 }}>{goalMin}m</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Used today</p>
                  <p style={{ margin: 0, color: "white", fontWeight: 600 }}>{selectedApp.dailyMin}m</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Sessions</p>
                  <p style={{ margin: 0, color: "white", fontWeight: 600 }}>{selectedApp.sessions + 1}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === HURDLE SCREEN === */}
        {screen === "hurdle" && selectedApp && (
          <div style={{ ...styles.screen, paddingTop: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
              <h2 style={{ color: "white", fontSize: 26, fontWeight: 700, margin: "0 0 8px" }}>Time's up!</h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                Your {hurdleElapsed}-minute session on<br />
                <span style={{ color: "white", fontWeight: 600 }}>{selectedApp.name}</span> has ended.
              </p>
            </div>

            <div style={{ width: "100%", background: "rgba(124,58,237,0.1)", border: "0.5px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: 18, marginBottom: 20, boxSizing: "border-box" }}>
              <p style={{ margin: "0 0 10px", color: "#a78bfa", fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>To extend 5 more minutes, type exactly:</p>
              <p style={{ margin: 0, color: "white", fontSize: 15, fontWeight: 500, lineHeight: 1.7, fontStyle: "italic" }}>
                "{requiredPhrase}"
              </p>
            </div>

            <div style={{ width: "100%", marginBottom: 16, boxSizing: "border-box" }}>
              <textarea
                ref={inputRef}
                value={hurdleInput}
                onChange={e => { setHurdleInput(e.target.value); setExtensionError(false); }}
                placeholder="Type the phrase above…"
                rows={3}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.05)",
                  border: `0.5px solid ${extensionError ? "#ff6b6b" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 14, color: "white", fontSize: 14, padding: "12px 14px",
                  resize: "none", boxSizing: "border-box", lineHeight: 1.6,
                  outline: "none",
                }}
              />
              {extensionError && (
                <p style={{ color: "#ff6b6b", fontSize: 12, margin: "6px 0 0" }}>
                  Phrase doesn't match. Be exact, including punctuation.
                </p>
              )}
            </div>

            {hurdleExtended ? (
              <div style={{ ...styles.cta, background: "linear-gradient(135deg, #059669, #10b981)", textAlign: "center" }}>
                ✓ Session Extended! Unlocking…
              </div>
            ) : (
              <>
                <button style={styles.cta} onClick={tryExtend}>
                  Acknowledge & Extend 5 Minutes
                </button>
                <div style={{ height: 12 }} />
                <button style={styles.ctaSecondary} onClick={() => {
                  BockerNative.setUnlockState({ state: false });
                  setScreen("home");
                }}>
                  I'm done for now
                </button>
              </>
            )}
          </div>
        )}

        {/* === DASHBOARD === */}
        {screen === "dashboard" && (
          <>
            <div style={{ ...styles.screen, paddingTop: 32 }}>
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>Monday, Apr 28</p>
                <h2 style={{ color: "white", fontSize: 26, fontWeight: 700, margin: "4px 0 0" }}>Your Usage</h2>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                <div style={styles.statCard("#7c3aed")}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>TOTAL TODAY</p>
                  <p style={{ margin: 0, color: "white", fontSize: 24, fontWeight: 700 }}>{totalUsage}m</p>
                </div>
                <div style={styles.statCard("#f59e0b")}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>VS YESTERDAY</p>
                  <p style={{ margin: 0, color: "#fbbf24", fontSize: 24, fontWeight: 700 }}>+12m</p>
                </div>
              </div>
            </div>
            <NavBar />
          </>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BLocker />
  </React.StrictMode>
);
