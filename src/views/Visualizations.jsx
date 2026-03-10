/* views/Visualizations.jsx */
import React, { useState, useEffect } from "react";
import { fetchVisualizations } from "../services/api";

const CHARTS = [
  { key:"confusion_matrix",      label:"Confusion Matrix",      icon:"⊞", desc:"Prediction accuracy per class on test set" },
  { key:"roc_curves",            label:"ROC Curves",            icon:"◉", desc:"True vs False positive rate per class (AUC)" },
  { key:"disaster_distribution", label:"Disaster Distribution", icon:"◈", desc:"Top 5 types bar chart + full class pie chart" },
  { key:"accuracy_comparison",   label:"Model Comparison",      icon:"⬡", desc:"Accuracy & F1 for all 3 ensemble models" },
  { key:"elbow_plot",            label:"K-Means Elbow",         icon:"↗", desc:"Inertia vs K (2..10) — why K=4 was selected" },
];

const MODEL_OPTIONS = [
  { value:"best", label:"Auto (Best)" },
  { value:"rf",   label:"Random Forest" },
  { value:"gb",   label:"Gradient Boosting" },
  { value:"adaboost", label:"AdaBoost" },
];

export default function Visualizations() {
  const [charts,  setCharts]  = useState({});
  const [model,   setModel]   = useState("best");
  const [active,  setActive]  = useState("confusion_matrix");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [zoom,    setZoom]    = useState(false);

  const load = (mdl) => {
    setLoading(true); setError("");
    fetchVisualizations(mdl)
      .then(data => {
        if (!data) throw new Error("Backend offline — charts require the backend running.\nStart with: cd app && uvicorn main:app --reload");
        setCharts(data.charts || {});
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(model); }, [model]);

  const currentImg = charts[active];

  const downloadChart = () => {
    if (!currentImg) return;
    const a = document.createElement("a");
    a.href = currentImg;
    a.download = `${active}.png`;
    a.click();
  };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>

      {/* Left sidebar: chart selector */}
      <div style={{ width:220, flexShrink:0, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", padding:"16px 12px", gap:6 }}>
        {/* Model switcher */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)", letterSpacing:0.8, marginBottom:8 }}>
            MODEL
          </div>
          <select value={model} onChange={e=>setModel(e.target.value)} style={{
            width:"100%", background:"var(--bg-card)", border:"1px solid var(--border)",
            borderRadius:8, padding:"7px 10px", color:"var(--text-hi)",
            fontSize:12, outline:"none", fontFamily:"var(--font-body)",
          }}>
            {MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)", letterSpacing:0.8, marginBottom:4 }}>
          CHARTS
        </div>

        {CHARTS.map(c => {
          const isActive = active === c.key;
          const hasData  = !!charts[c.key];
          return (
            <button key={c.key} onClick={()=>setActive(c.key)} style={{
              background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
              border: `1px solid ${isActive ? "rgba(245,158,11,0.3)" : "transparent"}`,
              borderRadius:9, padding:"9px 10px", textAlign:"left",
              cursor:"pointer", transition:"all 0.15s",
              display:"flex", alignItems:"flex-start", gap:8,
            }}
            onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="var(--bg-hover)"; }}
            onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="transparent"; }}
            >
              <span style={{ fontSize:14, color: isActive ? "var(--amber)" : "var(--text-lo)", lineHeight:1, marginTop:1, flexShrink:0 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color: isActive ? "var(--amber)" : "var(--text-mid)", lineHeight:1.3 }}>{c.label}</div>
                <div style={{ fontSize:9, color:"var(--text-lo)", marginTop:2, lineHeight:1.4, fontFamily:"var(--font-mono)" }}>{c.desc}</div>
              </div>
              {hasData && !loading && (
                <span style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:"var(--emerald)", flexShrink:0, marginTop:4 }} />
              )}
            </button>
          );
        })}

        {/* Reload button */}
        <div style={{ marginTop:"auto", paddingTop:12, borderTop:"1px solid var(--border)" }}>
          <button onClick={()=>load(model)} style={{
            width:"100%", padding:"8px 0",
            background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.25)",
            borderRadius:8, color:"var(--blue)", fontSize:11, fontWeight:600,
            cursor:"pointer", fontFamily:"var(--font-body)",
          }}>↻ Refresh Charts</button>
        </div>
      </div>

      {/* Right: Chart display */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Chart header */}
        <div style={{
          padding:"12px 20px", borderBottom:"1px solid var(--border)",
          display:"flex", alignItems:"center", gap:12, flexShrink:0,
        }}>
          {CHARTS.filter(c=>c.key===active).map(c => (
            <React.Fragment key={c.key}>
              <span style={{ fontSize:18, color:"var(--amber)" }}>{c.icon}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:"var(--text-hi)" }}>{c.label}</div>
                <div style={{ fontSize:11, color:"var(--text-lo)" }}>{c.desc}</div>
              </div>
            </React.Fragment>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            {currentImg && (
              <>
                <button onClick={()=>setZoom(true)} style={{
                  background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:7,
                  padding:"5px 12px", color:"var(--text-mid)", fontSize:11, cursor:"pointer",
                }}>⤢ Full screen</button>
                <button onClick={downloadChart} style={{
                  background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)",
                  borderRadius:7, padding:"5px 12px", color:"var(--emerald)", fontSize:11, fontWeight:600, cursor:"pointer",
                }}>↓ Download PNG</button>
              </>
            )}
          </div>
        </div>

        {/* Chart canvas */}
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24, overflow:"auto" }}>
          {loading ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, opacity:0.5 }}>
              <span style={{ fontSize:32, animation:"spin 1s linear infinite", display:"inline-block" }}>↻</span>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-lo)" }}>Loading charts from backend…</div>
            </div>
          ) : error ? (
            <div style={{ maxWidth:480, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>⚠</div>
              <div style={{ fontWeight:700, color:"var(--amber)", fontFamily:"var(--font-display)", marginBottom:8 }}>Charts Unavailable</div>
              <pre style={{ fontSize:11, color:"var(--text-lo)", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, padding:"12px 16px", textAlign:"left", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
                {error}
              </pre>
              <div style={{ marginTop:12, fontSize:12, color:"var(--text-lo)" }}>
                Charts are generated server-side. Make sure the FastAPI backend is running.
              </div>
            </div>
          ) : currentImg ? (
            <img
              src={currentImg}
              alt={active}
              style={{
                maxWidth:"100%", maxHeight:"100%", borderRadius:12,
                border:"1px solid var(--border)",
                boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
                animation:"fade-in 0.3s ease both",
              }}
            />
          ) : (
            <div style={{ opacity:0.3, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>◉</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:12 }}>Select a chart</div>
            </div>
          )}
        </div>

        {/* Chart strip thumbnails */}
        {!loading && !error && Object.keys(charts).length > 0 && (
          <div style={{
            padding:"10px 20px", borderTop:"1px solid var(--border)",
            display:"flex", gap:8, overflowX:"auto", flexShrink:0,
          }}>
            {CHARTS.map(c => charts[c.key] && (
              <button key={c.key} onClick={()=>setActive(c.key)} style={{
                flexShrink:0, width:100, height:64, padding:2,
                background: active===c.key ? "rgba(245,158,11,0.12)" : "var(--bg-card)",
                border:`1px solid ${active===c.key ? "var(--amber)" : "var(--border)"}`,
                borderRadius:7, overflow:"hidden", cursor:"pointer",
                transition:"all 0.15s",
              }}>
                <img src={charts[c.key]} alt={c.label} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:5, opacity:active===c.key?1:0.5 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom modal */}
      {zoom && currentImg && (
        <div
          onClick={()=>setZoom(false)}
          style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000,
            display:"flex", alignItems:"center", justifyContent:"center", padding:40,
            cursor:"zoom-out",
          }}
        >
          <img src={currentImg} alt={active} style={{ maxWidth:"90vw", maxHeight:"90vh", borderRadius:12, boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }} />
        </div>
      )}
    </div>
  );
}
