/* components/Header.jsx */
import React, { useState, useEffect } from "react";

const TITLES = {
  dashboard: { title:"Command Center", sub:"System overview & model status" },
  dataset:   { title:"Dataset Explorer", sub:"207 India disaster records · 1990–2021" },
  predict:   { title:"Prediction Engine", sub:"Real-time disaster classification" },
  visualize: { title:"Visualizations", sub:"Model performance charts & analytics" },
  logs:      { title:"Event Logs", sub:"System activity & alert history" },
};

export default function Header({ view, health, onRetrain, training }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { title, sub } = TITLES[view] || TITLES.dashboard;
  const online = health?.status === "ok";

  return (
    <header style={{
      height: 60, flexShrink: 0,
      background: "var(--bg-panel)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center",
      padding: "0 24px", gap: 16,
    }}>
      {/* Title block */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 16, color: "var(--text-hi)", lineHeight: 1,
          letterSpacing: "-0.02em",
        }}>{title}</h1>
        <p style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
          {sub}
        </p>
      </div>

      {/* Best model badge */}
      {health?.best_model && (
        <div style={{
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 6, padding: "4px 10px",
          fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ opacity: 0.6 }}>BEST</span>
          <span style={{ fontWeight: 700 }}>{health.best_model.toUpperCase()}</span>
        </div>
      )}

      {/* Retrain button */}
      <button
        onClick={onRetrain}
        disabled={training}
        style={{
          background: training ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.12)",
          border: "1px solid rgba(59,130,246,0.3)",
          borderRadius: 8, padding: "6px 14px",
          color: "var(--blue)", fontSize: 12, fontWeight: 600,
          cursor: training ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: "var(--font-body)",
          transition: "all 0.15s",
          opacity: training ? 0.7 : 1,
        }}
      >
        <span style={{
          display: "inline-block",
          animation: training ? "spin 1s linear infinite" : "none",
          fontSize: 13,
        }}>↻</span>
        {training ? "Training…" : "Retrain"}
      </button>

      {/* Status + Clock */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          background: online ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${online ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
          borderRadius: 6, padding: "4px 10px",
          fontSize: 11, fontFamily: "var(--font-mono)",
          color: online ? "var(--emerald)" : "var(--red)",
        }}>
          <span style={{
            width:6, height:6, borderRadius:"50%",
            background: online ? "var(--emerald)" : "var(--red)",
            animation: "pulse-dot 2s infinite",
            display:"inline-block",
          }} />
          {online ? "ONLINE" : "OFFLINE"}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 11,
          color: "var(--text-lo)",
          minWidth: 56,
        }}>
          {time.toLocaleTimeString("en-IN", { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" })}
        </div>
      </div>
    </header>
  );
}
