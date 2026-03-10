/* views/Logs.jsx */
import React, { useState, useEffect, useRef } from "react";
import { fetchLogs } from "../services/api";

const LEVEL_STYLE = {
  INFO:  { bg:"rgba(59,130,246,0.1)",  color:"#3b82f6", border:"rgba(59,130,246,0.25)" },
  WARN:  { bg:"rgba(245,158,11,0.1)",  color:"#f59e0b", border:"rgba(245,158,11,0.25)" },
  ERROR: { bg:"rgba(239,68,68,0.1)",   color:"#ef4444", border:"rgba(239,68,68,0.25)" },
};

const EVENT_ICON = {
  startup_loaded_artifacts: "⚡",
  prediction_made:          "◈",
  alert_triggered:          "🚨",
  alert_simulated:          "📡",
  training_complete:        "✅",
  visualizations_generated: "◉",
};

export default function Logs() {
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [level,   setLevel]   = useState("");
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAuto]= useState(false);
  const timerRef = useRef(null);

  const load = () => {
    setLoading(true);
    fetchLogs({ level, limit:100 })
      .then(d => { setLogs(d.logs || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [level]);

  useEffect(() => {
    if (autoRefresh) { timerRef.current = setInterval(load, 5000); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, level]);

  const levelCounts = logs.reduce((acc, l) => { acc[l.level] = (acc[l.level]||0)+1; return acc; }, {});

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>

      {/* Toolbar */}
      <div style={{
        padding:"12px 24px", borderBottom:"1px solid var(--border)",
        display:"flex", alignItems:"center", gap:12, background:"var(--bg-panel)", flexShrink:0,
      }}>
        {/* Level filter tabs */}
        <div style={{ display:"flex", gap:6 }}>
          {["", "INFO","WARN","ERROR"].map(lv => {
            const cnt = lv ? (levelCounts[lv]||0) : logs.length;
            const s   = lv ? LEVEL_STYLE[lv] : { bg:"rgba(255,255,255,0.05)", color:"var(--text-mid)", border:"var(--border)" };
            return (
              <button key={lv} onClick={()=>setLevel(lv)} style={{
                background: level===lv ? s.bg : "var(--bg-card)",
                border:`1px solid ${level===lv ? s.border : "var(--border)"}`,
                borderRadius:7, padding:"5px 12px",
                color: level===lv ? s.color : "var(--text-lo)",
                fontSize:11, fontWeight:700, cursor:"pointer",
                fontFamily:"var(--font-mono)",
                display:"flex", alignItems:"center", gap:5,
              }}>
                {lv || "ALL"}
                <span style={{ opacity:0.7 }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* Auto-refresh toggle */}
        <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", marginLeft:8 }}>
          <div style={{
            width:32, height:18, borderRadius:9,
            background: autoRefresh ? "var(--emerald)" : "var(--bg-hover)",
            border:"1px solid var(--border)", position:"relative",
            transition:"background 0.2s", cursor:"pointer",
          }} onClick={()=>setAuto(a=>!a)}>
            <div style={{
              width:12, height:12, borderRadius:"50%", background:"white",
              position:"absolute", top:2, left: autoRefresh ? 16 : 2,
              transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)",
            }} />
          </div>
          <span style={{ fontSize:11, color:"var(--text-lo)", fontFamily:"var(--font-mono)" }}>LIVE</span>
          {autoRefresh && <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--emerald)",animation:"pulse-dot 1s infinite",display:"inline-block" }} />}
        </label>

        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <span style={{ fontSize:11, color:"var(--text-lo)", fontFamily:"var(--font-mono)", alignSelf:"center" }}>
            {total} events
          </span>
          <button onClick={load} style={{
            background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:7,
            padding:"5px 12px", color:"var(--text-mid)", fontSize:11, cursor:"pointer",
          }}>↻ Refresh</button>
        </div>
      </div>

      {/* Logs list */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 24px", display:"flex", flexDirection:"column", gap:4 }}>
        {loading ? (
          Array(8).fill(0).map((_,i) => (
            <div key={i} className="skeleton" style={{ height:52, borderRadius:8 }} />
          ))
        ) : logs.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", opacity:0.3 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>≡</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:12 }}>No logs found</div>
          </div>
        ) : logs.map((log, i) => {
          const ls = LEVEL_STYLE[log.level] || LEVEL_STYLE.INFO;
          const icon = EVENT_ICON[log.event] || "•";
          return (
            <div key={i} style={{
              background:"var(--bg-card)", border:"1px solid var(--border)",
              borderRadius:8, padding:"10px 14px",
              display:"flex", alignItems:"flex-start", gap:12,
              animation: i < 3 ? `fade-in 0.3s ease ${i*0.05}s both` : "none",
              transition:"background 0.1s",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"}
            onMouseLeave={e=>e.currentTarget.style.background="var(--bg-card)"}
            >
              {/* Level badge */}
              <span style={{
                background:ls.bg, color:ls.color, border:`1px solid ${ls.border}`,
                borderRadius:4, padding:"1px 6px",
                fontSize:9, fontWeight:800, fontFamily:"var(--font-mono)",
                flexShrink:0, letterSpacing:0.5, marginTop:1,
              }}>{log.level}</span>

              {/* Icon + event */}
              <span style={{ fontSize:14, flexShrink:0, marginTop:0 }}>{icon}</span>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, color:"var(--text-mid)" }}>
                    {log.event}
                  </span>
                </div>
                {/* Details */}
                {log.details && Object.keys(log.details).length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {Object.entries(log.details).map(([k,v]) => (
                      <span key={k} style={{
                        background:"var(--bg-hover)", borderRadius:3,
                        fontSize:9, fontFamily:"var(--font-mono)", color:"var(--text-lo)",
                        padding:"1px 6px",
                      }}>
                        <span style={{ color:"var(--text-lo)" }}>{k}:</span>
                        {" "}
                        <span style={{ color:"var(--text-mid)", fontWeight:600 }}>
                          {typeof v === "number" && v < 2 ? `${(v*100).toFixed(1)}%` : String(v)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span style={{ fontSize:9, color:"var(--text-lo)", fontFamily:"var(--font-mono)", flexShrink:0, marginTop:1, whiteSpace:"nowrap" }}>
                {new Date(log.timestamp).toLocaleTimeString("en-IN", { hour12:false })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
