/* views/PredictionPanel.jsx */
import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { predict, simulateAlert } from "../services/api";

const MODEL_OPTIONS = [
  { value:"best",     label:"Auto (Best Model)", color:"var(--amber)" },
  { value:"rf",       label:"Random Forest",     color:"var(--blue)" },
  { value:"adaboost", label:"AdaBoost",           color:"var(--orange)" },
  { value:"gb",       label:"Gradient Boosting",  color:"var(--emerald)" },
];
const PRIORITY_STYLE = {
  "High":       { bg:"rgba(239,68,68,0.15)",  text:"#ef4444", border:"rgba(239,68,68,0.35)" },
  "Medium-High":{ bg:"rgba(249,115,22,0.15)", text:"#f97316", border:"rgba(249,115,22,0.35)" },
  "Medium-Low": { bg:"rgba(245,158,11,0.15)", text:"#f59e0b", border:"rgba(245,158,11,0.35)" },
  "Low":        { bg:"rgba(16,185,129,0.15)", text:"#10b981", border:"rgba(16,185,129,0.35)" },
};
const EXAMPLES = [
  "Heavy monsoon floods submerged dozens of villages in Assam causing massive displacement of thousands of people",
  "A 6.8 magnitude earthquake struck the Himalayan region causing widespread destruction to buildings and infrastructure",
  "Super cyclonic storm made landfall near Odisha coast with wind speeds of 180 kmh causing severe damage",
  "Passengers trampled in a massive crowd crush during the religious festival near the riverbank",
  "Blaze engulfed the factory building trapping workers inside causing multiple casualties and injuries",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--bg-panel)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px" }}>
      <div style={{ fontSize:11, color:"var(--text-mid)", marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:700, color:"var(--text-hi)" }}>{payload[0].value}%</div>
    </div>
  );
};

export default function PredictionPanel() {
  const [desc,    setDesc]    = useState("");
  const [model,   setModel]   = useState("best");
  const [result,  setResult]  = useState(null);
  const [alert,   setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [history, setHistory] = useState([]);

  const charCount = desc.length;
  const charValid = charCount >= 20;

  const handlePredict = async () => {
    if (!charValid) { setError("Description must be at least 20 characters."); return; }
    setError(""); setLoading(true); setAlert(null);
    try {
      const res = await predict(desc, model);
      setResult(res);
      setHistory(h => [{ ...res, desc: desc.slice(0,60)+"…", ts: new Date().toLocaleTimeString() }, ...h].slice(0,6));
      if (res.alert_triggered) {
        const alertRes = await simulateAlert({
          disaster_type: res.predicted_class,
          probability: res.confidence,
          cluster_priority: res.cluster_priority,
          description: desc,
        });
        setAlert(alertRes);
      }
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const probData = result
    ? Object.entries(result.probabilities)
        .sort((a,b) => b[1]-a[1]).slice(0,7)
        .map(([name,value]) => ({ name, value: parseFloat((value*100).toFixed(1)) }))
    : [];

  const ps = result ? (PRIORITY_STYLE[result.cluster_priority] || PRIORITY_STYLE["Low"]) : null;

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>

      {/* Left: Input */}
      <div style={{ width:400, flexShrink:0, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ flex:1, padding:24, overflowY:"auto", display:"flex", flexDirection:"column", gap:16 }}>

          <div>
            <label style={{ display:"block", fontSize:11, color:"var(--text-lo)", fontFamily:"var(--font-mono)", letterSpacing:1, marginBottom:8 }}>
              DISASTER DESCRIPTION
            </label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe a disaster event in detail… (min 20 characters)"
              rows={7}
              style={{
                width:"100%", background:"var(--bg-card)", border:`1px solid ${charValid || !desc ? "var(--border)" : "var(--red)"}`,
                borderRadius:10, padding:"12px 14px", color:"var(--text-hi)",
                fontSize:13, outline:"none", resize:"none",
                fontFamily:"var(--font-body)", lineHeight:1.7,
                transition:"border-color 0.2s",
              }}
            />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
              <span style={{ fontSize:10, color: charValid ? "var(--emerald)" : "var(--text-lo)", fontFamily:"var(--font-mono)" }}>
                {charCount}/2000 chars {charValid ? "✓" : "(min 20)"}
              </span>
            </div>
          </div>

          {/* Examples */}
          <div>
            <div style={{ fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)", letterSpacing:0.8, marginBottom:8 }}>EXAMPLE INPUTS</div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={()=>setDesc(ex)} style={{
                  background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:7,
                  padding:"6px 10px", textAlign:"left", color:"var(--text-lo)", fontSize:11,
                  cursor:"pointer", lineHeight:1.5, transition:"all 0.15s",
                  fontFamily:"var(--font-body)",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border-hi)";e.currentTarget.style.color="var(--text-mid)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text-lo)"}}
                >
                  {ex.slice(0,80)}…
                </button>
              ))}
            </div>
          </div>

          {/* Model selector */}
          <div>
            <div style={{ fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)", letterSpacing:0.8, marginBottom:8 }}>SELECT MODEL</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {MODEL_OPTIONS.map(opt => (
                <label key={opt.value} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                  background: model===opt.value ? `${opt.color}12` : "var(--bg-card)",
                  border: `1px solid ${model===opt.value ? opt.color+"40" : "var(--border)"}`,
                  borderRadius:8, cursor:"pointer", transition:"all 0.15s",
                }}>
                  <input type="radio" name="model" value={opt.value}
                    checked={model===opt.value} onChange={()=>setModel(opt.value)}
                    style={{ accentColor: opt.color }} />
                  <span style={{ fontSize:12, color: model===opt.value ? opt.color : "var(--text-mid)", fontWeight: model===opt.value ? 700 : 400 }}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
          {error && (
            <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"8px 12px", marginBottom:10, fontSize:12, color:"var(--red)" }}>
              {error}
            </div>
          )}
          <button onClick={handlePredict} disabled={loading || !desc} style={{
            width:"100%", padding:"12px 0",
            background: loading ? "var(--bg-hover)" : "linear-gradient(135deg,var(--amber),#ea580c)",
            border:"none", borderRadius:10, color: loading ? "var(--text-lo)" : "#000",
            fontSize:14, fontWeight:800, cursor: loading||!desc ? "not-allowed" : "pointer",
            fontFamily:"var(--font-display)", letterSpacing:"0.03em",
            transition:"all 0.2s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            boxShadow: !loading && desc ? "0 4px 16px rgba(245,158,11,0.3)" : "none",
          }}>
            {loading ? (
              <><span style={{ animation:"spin 0.8s linear infinite", display:"inline-block", fontSize:16 }}>↻</span> Analyzing…</>
            ) : "▶  Run Prediction"}
          </button>
        </div>
      </div>

      {/* Right: Results */}
      <div style={{ flex:1, overflowY:"auto", padding:24, display:"flex", flexDirection:"column", gap:16 }}>
        {!result && !loading && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", opacity:0.35 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>◈</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:16, color:"var(--text-mid)" }}>Awaiting prediction input</div>
            <div style={{ fontSize:12, color:"var(--text-lo)", marginTop:6 }}>Enter a disaster description and click Run Prediction</div>
          </div>
        )}

        {result && (
          <div style={{ animation:"fade-in 0.35s ease both" }}>
            {/* Main result */}
            <div style={{
              background:"var(--bg-card)", border:"1px solid var(--border)",
              borderRadius:16, padding:20, marginBottom:16,
            }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                {[
                  { label:"Predicted Class", value:result.predicted_class, color:"var(--amber)", mono:false },
                  { label:"Confidence",      value:`${(result.confidence*100).toFixed(1)}%`, color: result.confidence>0.75?"var(--emerald)":"var(--orange)", mono:true },
                  { label:"Model Accuracy",  value:`${(result.model_accuracy*100).toFixed(1)}%`, color:"var(--blue)", mono:true },
                  { label:"Model Used",      value:result.model_used.toUpperCase(), color:"var(--text-mid)", mono:true },
                ].map(s => (
                  <div key={s.label} style={{ background:"var(--bg-hover)", borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontSize:9, color:"var(--text-lo)", fontFamily:"var(--font-mono)", letterSpacing:0.8, marginBottom:6 }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:s.mono?"var(--font-mono)":"var(--font-display)" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Priority zone */}
              {ps && (
                <div style={{
                  background:ps.bg, border:`1px solid ${ps.border}`, borderRadius:10,
                  padding:"10px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:16,
                }}>
                  <span style={{ fontSize:20 }}>{result.cluster_priority==="High"?"🔴":result.cluster_priority==="Medium-High"?"🟠":result.cluster_priority==="Medium-Low"?"🟡":"🟢"}</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:13, color:ps.text, fontFamily:"var(--font-display)" }}>
                      {result.cluster_priority} Priority Zone
                    </div>
                    <div style={{ fontSize:11, color:"var(--text-lo)", marginTop:2 }}>
                      K-Means cluster {result.cluster_id} · Resource deployment: {
                        {"High":"Immediate","Medium-High":"Within 1 hour","Medium-Low":"Within 4 hours","Low":"Standard"}[result.cluster_priority]
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Probability chart */}
              <div style={{ fontSize:11, color:"var(--text-lo)", fontFamily:"var(--font-mono)", marginBottom:10, letterSpacing:0.8 }}>
                PROBABILITY DISTRIBUTION
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={probData} layout="vertical" margin={{ left:0, right:20 }}>
                  <XAxis type="number" domain={[0,100]} tick={{ fontSize:9, fill:"var(--text-lo)" }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:"var(--text-mid)", fontFamily:"var(--font-mono)" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0,4,4,0]} maxBarSize={16}>
                    {probData.map((d, i) => (
                      <Cell key={i} fill={i===0 ? "var(--amber)" : i===1 ? "rgba(245,158,11,0.5)" : "rgba(245,158,11,0.2)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Alert panel */}
            {result.alert_triggered && alert && (
              <div style={{
                background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)",
                borderRadius:12, padding:16, animation:"glow-pulse 2s infinite",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <span style={{ fontSize:22 }}>🚨</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:"var(--red)", fontFamily:"var(--font-display)" }}>
                      EMERGENCY ALERT TRIGGERED — {alert.severity}
                    </div>
                    <div style={{ fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)", marginTop:2 }}>
                      ID: {alert.alert_id}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize:12, color:"var(--text-mid)", lineHeight:1.7, marginBottom:12 }}>
                  {alert.recommended_action}
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {alert.simulated_recipients?.map(r => (
                    <span key={r} style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:4, padding:"2px 8px", fontSize:10, color:"#fca5a5", fontFamily:"var(--font-mono)" }}>{r}</span>
                  ))}
                </div>
                <div style={{ display:"flex", gap:6, marginTop:10 }}>
                  {alert.delivery_channels?.map(c => (
                    <span key={c} style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:4, padding:"2px 8px", fontSize:9, color:"var(--red)", fontFamily:"var(--font-mono)", fontWeight:700 }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div style={{ fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)", letterSpacing:0.8, marginBottom:10 }}>RECENT PREDICTIONS</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {history.map((h, i) => (
                <div key={i} style={{
                  background:"var(--bg-card)", border:"1px solid var(--border)",
                  borderRadius:8, padding:"8px 12px",
                  display:"flex", alignItems:"center", gap:12,
                }}>
                  <span style={{ fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)", flexShrink:0 }}>{h.ts}</span>
                  <span style={{ fontSize:11, color:"var(--text-mid)", flex:1 }} className="truncate">{h.desc}</span>
                  <span style={{ fontSize:11, color:"var(--amber)", fontWeight:700, fontFamily:"var(--font-mono)", flexShrink:0 }}>{h.predicted_class}</span>
                  <span style={{ fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)", flexShrink:0 }}>{(h.confidence*100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
