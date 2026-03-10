/* components/Sidebar.jsx */
import React from "react";

const NAV = [
  { id:"dashboard",    icon:"⬡",  label:"Dashboard"   },
  { id:"dataset",      icon:"⊞",  label:"Dataset"     },
  { id:"predict",      icon:"◈",  label:"Predict"     },
  { id:"visualize",    icon:"◉",  label:"Visualize"   },
  { id:"logs",         icon:"≡",  label:"Logs"        },
];

export default function Sidebar({ active, onNav, health }) {
  const online = health?.status === "ok";
  const modelsLoaded = health?.models_loaded;

  return (
    <aside style={{
      width: 72, flexShrink: 0,
      background: "var(--bg-panel)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      alignItems: "center",
      padding: "20px 0",
      gap: 4,
    }}>
      {/* Logo */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, marginBottom: 20,
        background: "linear-gradient(135deg,#f59e0b,#ef4444)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, fontWeight: 900, color: "white",
        fontFamily: "var(--font-display)",
        boxShadow: "0 0 20px rgba(245,158,11,0.4)",
      }}>⚡</div>

      {/* Nav items */}
      {NAV.map(n => {
        const isActive = active === n.id;
        return (
          <button key={n.id} onClick={() => onNav(n.id)} title={n.label} style={{
            width: 48, height: 48, borderRadius: 12,
            border: isActive ? "1px solid var(--amber)" : "1px solid transparent",
            background: isActive ? "rgba(245,158,11,0.12)" : "transparent",
            color: isActive ? "var(--amber)" : "var(--text-lo)",
            fontSize: 18, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 2, transition: "all 0.15s",
            boxShadow: isActive ? "0 0 12px rgba(245,158,11,0.2)" : "none",
          }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-mid)"; }}}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-lo)"; }}}
          >
            <span style={{ fontFamily: "monospace", lineHeight: 1 }}>{n.icon}</span>
            <span style={{ fontSize: 8, letterSpacing: 0.5, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {n.label.toUpperCase().slice(0,3)}
            </span>
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Status indicator */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        <div title={online ? "Backend online" : "Backend offline"} style={{
          width: 10, height: 10, borderRadius: "50%",
          background: online ? "var(--emerald)" : "var(--red)",
          boxShadow: online ? "0 0 8px var(--emerald)" : "0 0 8px var(--red)",
          animation: "pulse-dot 2s infinite",
        }} />
        <div title={modelsLoaded ? "Models loaded" : "Models not loaded"} style={{
          width: 10, height: 10, borderRadius: "50%",
          background: modelsLoaded ? "var(--amber)" : "var(--text-lo)",
          boxShadow: modelsLoaded ? "0 0 8px var(--amber)" : "none",
        }} />
      </div>
    </aside>
  );
}
