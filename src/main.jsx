import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { registerPlugin } from '@capacitor/core';
import { 
  Lock, 
  Moon, 
  Sun, 
  LayoutGrid, 
  BarChart3,
  ChevronLeft
} from 'lucide-react';

const BockerNative = registerPlugin('BockerNative');

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
);
const TwitterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
);
const YouTubeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
);

const INITIAL_APPS = [
  { id: "instagram", pkg: "com.instagram.android", name: "Instagram", icon: <InstagramIcon />, color: "#C13584", blocked: true, dailyMin: 0, sessions: 0 },
  { id: "tiktok", pkg: "com.zhiliaoapp.musically", name: "TikTok", icon: <TikTokIcon />, color: "#010101", blocked: true, dailyMin: 0, sessions: 0 },
  { id: "twitter", pkg: "com.twitter.android", name: "Twitter / X", icon: <TwitterIcon />, color: "#1A8CD8", blocked: false, dailyMin: 0, sessions: 0 },
  { id: "youtube", pkg: "com.google.android.youtube", name: "YouTube", icon: <YouTubeIcon />, color: "#FF0000", blocked: true, dailyMin: 0, sessions: 0 },
];

const THEMES = {
  light: { bg: "#F5F4F0", surface: "#FFFFFF", border: "#E2E0D8", text: "#1A1917", muted: "#8A8880", danger: "#C0392B", success: "#2D6A4F" },
  dark: { bg: "#0A0A0A", surface: "#1A1A1A", border: "#333333", text: "#F5F4F0", muted: "#888888", danger: "#E74C3C", success: "#27AE60" }
};

function BLocker() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const C = THEMES[theme];

  const [screen, setScreen] = useState("home");
  const [apps, setApps] = useState(INITIAL_APPS);
  const [selectedApp, setSelectedApp] = useState(null);
  const [goalMin, setGoalMin] = useState(10);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalSec, setTotalSec] = useState(0);
  const [hurdleInput, setHurdleInput] = useState("");
  const [hurdleElapsed, setHurdleElapsed] = useState(0);
  const [hurdleOk, setHurdleOk] = useState(false);
  const [hurdleError, setHurdleError] = useState(false);
  const timerRef = useRef(null);

  // FETCH REAL STATS & INITIAL SYNC
  useEffect(() => {
    async function syncNative() {
      try {
        const { stats } = await BockerNative.getUsageStats();
        setApps(prev => prev.map(app => ({
          ...app,
          dailyMin: stats[app.pkg] || 0
        })));

        // Sync initial blocked list
        const blockedPkgs = INITIAL_APPS.filter(a => a.blocked).map(a => a.pkg);
        await BockerNative.setBlockedApps({ apps: blockedPkgs });
      } catch (e) {
        console.error("Native sync failed", e);
      }
    }
    syncNative();
  }, []);

  useEffect(() => {
    if (screen === "active" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { 
            clearInterval(timerRef.current); 
            setScreen("hurdle"); 
            BockerNative.setUnlockState({ state: false });
            return 0; 
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [screen, timeLeft]);

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  async function toggleBlock(id, e) {
    e.stopPropagation();
    const updatedApps = apps.map(a => a.id === id ? { ...a, blocked: !a.blocked } : a);
    setApps(updatedApps);
    
    // NATIVE SYNC
    const blockedPkgs = updatedApps.filter(a => a.blocked).map(a => a.pkg);
    await BockerNative.setBlockedApps({ apps: blockedPkgs });
  }

  function startSession() {
    const secs = goalMin * 60;
    setTotalSec(secs);
    setTimeLeft(secs);
    setHurdleElapsed(goalMin);
    setScreen("active");
    BockerNative.setUnlockState({ state: true });
  }

  const requiredPhrase = selectedApp ? `I have spent ${hurdleElapsed} minutes on ${selectedApp.name}.` : "";

  function tryExtend() {
    if (hurdleInput.trim() === requiredPhrase) {
      setHurdleOk(true);
      setTotalSec(5 * 60);
      setTimeLeft(5 * 60);
      setHurdleElapsed(h => h + 5);
      setHurdleInput("");
      BockerNative.setUnlockState({ state: true });
      setTimeout(() => { setHurdleOk(false); setScreen("active"); }, 1000);
    } else {
      setHurdleError(true);
    }
  }

  const totalUsage = apps.reduce((s, a) => s + a.dailyMin, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { cursor: pointer; border: none; font-family: inherit; }
        .row:active { background: ${theme === 'light' ? '#EFEDE8' : '#222'} !important; }
      `}</style>

      {/* ── HOME ── */}
      {screen === "home" && (
        <div style={{ flex: 1, padding: "60px 24px 20px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>B-LOCKER</p>
              <h1 style={{ fontSize: 32, fontWeight: 600 }}>Real-time.</h1>
            </div>
            <button onClick={toggleTheme} style={{ width: 44, height: 44, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>
              {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
            <div style={{ background: C.surface, borderRadius: 20, padding: 20, border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Today's Usage</p>
              <p style={{ fontSize: 28, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{totalUsage}m</p>
            </div>
            <div style={{ background: C.surface, borderRadius: 20, padding: 20, border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Blocked Apps</p>
              <p style={{ fontSize: 28, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{apps.filter(a=>a.blocked).length}</p>
            </div>
          </div>

          <p style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Managed Apps</p>
          <div style={{ background: C.surface, borderRadius: 24, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {apps.map((app, i) => (
              <div key={app.id} className="row" onClick={() => { if(app.blocked) { setSelectedApp(app); setScreen("session-start"); } }}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: i < apps.length - 1 ? `1px solid ${C.border}` : "none", transition: "background 0.1s" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: app.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                  {app.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 600 }}>{app.name}</p>
                  <p style={{ fontSize: 13, color: C.muted }}>{app.dailyMin}m today</p>
                </div>
                <button onClick={e => toggleBlock(app.id, e)}
                  style={{ width: 48, height: 28, borderRadius: 14, background: app.blocked ? C.text : C.border, position: "relative", transition: "0.2s" }}>
                  <div style={{ position: "absolute", width: 22, height: 22, borderRadius: 11, background: "white", top: 3, left: app.blocked ? 23 : 3, transition: "0.2s" }} />
                </button>
              </div>
            ))}
          </div>
          <Nav screen={screen} setScreen={setScreen} C={C} />
        </div>
      )}

      {/* ── SESSION START ── */}
      {screen === "session-start" && selectedApp && (
        <div style={{ flex: 1, padding: "60px 24px", display: "flex", flexDirection: "column" }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", color: C.muted, display: "flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
            <ChevronLeft size={20} /> Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: selectedApp.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              {selectedApp.icon}
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 600 }}>{selectedApp.name}</h2>
          </div>

          <p style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>SELECT DURATION</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 32 }}>
            {[5, 10, 15, 20, 30, 60].map(m => (
              <button key={m} onClick={() => setGoalMin(m)}
                style={{ padding: "16px", borderRadius: 16, background: goalMin === m ? C.text : C.surface, color: goalMin === m ? C.surface : C.text, border: `1px solid ${C.border}`, fontWeight: 600 }}>
                {m}m
              </button>
            ))}
          </div>

          <button onClick={startSession}
            style={{ marginTop: "auto", padding: "20px", borderRadius: 20, background: C.text, color: C.surface, fontSize: 18, fontWeight: 600 }}>
            Unlock for {goalMin} minutes
          </button>
        </div>
      )}

      {/* ── ACTIVE SESSION ── */}
      {screen === "active" && selectedApp && (
        <div style={{ flex: 1, padding: "80px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 120, height: 120, borderRadius: 32, background: selectedApp.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginBottom: 32 }}>
            {React.cloneElement(selectedApp.icon, { size: 48 })}
          </div>
          <p style={{ fontSize: 14, color: C.muted, letterSpacing: 2, marginBottom: 16 }}>TIME REMAINING</p>
          <p style={{ fontSize: 84, fontWeight: 500, fontFamily: "'DM Mono', monospace", letterSpacing: -4, marginBottom: 40 }}>
            {String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}
          </p>
          <div style={{ width: "100%", height: 8, background: C.border, borderRadius: 4, overflow: "hidden", marginBottom: 60 }}>
            <div style={{ height: "100%", background: selectedApp.color, width: `${(timeLeft/totalSec)*100}%`, transition: "width 1s linear" }} />
          </div>
          <button onClick={() => { BockerNative.setUnlockState({ state: false }); setScreen("home"); }}
            style={{ padding: "18px 48px", borderRadius: 99, background: C.danger + "20", color: C.danger, fontWeight: 600 }}>
            End Session
          </button>
        </div>
      )}

      {/* ── HURDLE ── */}
      {screen === "hurdle" && selectedApp && (
        <div style={{ flex: 1, padding: "60px 24px", display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 16 }}>Acknowledge.</h2>
          <p style={{ color: C.muted, marginBottom: 32 }}>Type the statement below exactly to extend.</p>
          <div style={{ padding: 20, background: C.surface, borderRadius: 20, borderLeft: `6px solid ${selectedApp.color}`, marginBottom: 24 }}>
            <p style={{ fontSize: 18, fontStyle: "italic", lineHeight: 1.6 }}>"{requiredPhrase}"</p>
          </div>
          <textarea value={hurdleInput} onChange={e => { setHurdleInput(e.target.value); setHurdleError(false); }}
            placeholder="Type here..."
            style={{ flex: 1, padding: 20, borderRadius: 20, border: `2px solid ${hurdleError ? C.danger : C.border}`, background: C.surface, color: C.text, fontSize: 16, outline: "none", resize: "none" }} />
          <button onClick={tryExtend}
            style={{ marginTop: 20, padding: "20px", borderRadius: 20, background: C.text, color: C.surface, fontSize: 18, fontWeight: 600 }}>
            Extend 5 Minutes
          </button>
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {screen === "dashboard" && (
        <div style={{ flex: 1, padding: "60px 24px 20px" }}>
          <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 32 }}>Usage Stats</h2>
          <div style={{ background: C.surface, borderRadius: 24, border: `1px solid ${C.border}`, padding: 24 }}>
            {apps.map(app => (
              <div key={app.id} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{app.name}</span>
                  <span style={{ color: C.muted }}>{app.dailyMin}m</span>
                </div>
                <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: app.color, width: `${Math.min(100, (app.dailyMin/120)*100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Nav screen={screen} setScreen={setScreen} C={C} />
        </div>
      )}
    </div>
  );
}

function Nav({ screen, setScreen, C }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 80, background: C.surface, display: "flex", borderTop: `1px solid ${C.border}`, paddingBottom: 20 }}>
      <button onClick={() => setScreen("home")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: screen === "home" ? C.text : C.muted }}>
        <LayoutGrid size={24} />
        <span style={{ fontSize: 10, marginTop: 4 }}>Apps</span>
      </button>
      <button onClick={() => setScreen("dashboard")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: screen === "dashboard" ? C.text : C.muted }}>
        <BarChart3 size={24} />
        <span style={{ fontSize: 10, marginTop: 4 }}>Stats</span>
      </button>
    </nav>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<BLocker />);
