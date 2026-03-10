/* components/TrainingModal.jsx */
import React from "react";

const STAGE_LABELS = {
  loading_csv:       "Loading CSV Dataset",
  tfidf_fit:         "Fitting TF-IDF Vectorizer",
  rf_training:       "Training Random Forest",
  adaboost_training: "Training AdaBoost",
  gb_training:       "Training Gradient Boosting",
  kmeans:            "K-Means Clustering (K=4)",
  saving:            "Saving Artifacts to Disk",
  done:              "Training Complete",
  error:             "Training Failed",
};

const STAGE_ORDER = ["loading_csv","tfidf_fit","rf_training","adaboost_training","gb_training","kmeans","saving","done"];

export default function TrainingModal({ event, onClose }) {
  if (!event) return null;

  const isDone  = event.stage === "done";
  const isError = event.stage === "error";
  const progress= event.progress ?? 0;
  const stageIdx= STAGE_ORDER.indexOf(event.stage);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:24,
    }}>
      <div style={{
        background:"var(--bg-card)", border:"1px solid var(--border)",
        borderRadius:20, padding:32, width:"100%", maxWidth:480,
        boxShadow:"0 24px 60px rgba(0,0,0,0.5)",
        animation:"fade-in 0.3s ease both",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <div style={{
            width:44, height:44, borderRadius:12,
            background: isDone ? "rgba(16,185,129,0.15)" : isError ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
            border: `1px solid ${isDone ? "rgba(16,185,129,0.3)" : isError ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
          }}>
            {isDone ? "✅" : isError ? "❌" : <span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>↻</span>}
          </div>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:16, color:"var(--text-hi)" }}>
              {isDone ? "Training Complete!" : isError ? "Training Failed" : "Model Retraining…"}
            </div>
            <div style={{ fontSize:11, color:"var(--text-lo)", fontFamily:"var(--font-mono)", marginTop:2 }}>
              {event.message || "Processing…"}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)" }}>
              {STAGE_LABELS[event.stage] || event.stage}
            </span>
            <span style={{ fontSize:10, color:"var(--blue)", fontFamily:"var(--font-mono)", fontWeight:700 }}>
              {progress}%
            </span>
          </div>
          <div style={{ height:6, background:"var(--bg-hover)", borderRadius:3, overflow:"hidden" }}>
            <div style={{
              height:"100%", borderRadius:3,
              width:`${progress}%`,
              background: isDone ? "var(--emerald)" : isError ? "var(--red)" : "linear-gradient(90deg,var(--blue),var(--amber))",
              transition:"width 0.5s ease",
              boxShadow: isDone ? "0 0 8px var(--emerald)" : "0 0 8px var(--blue)",
            }} />
          </div>
        </div>

        {/* Stage checklist */}
        <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:20 }}>
          {STAGE_ORDER.filter(s=>s!=="done").map((s, i) => {
            const done    = i < stageIdx || isDone;
            const current = s === event.stage && !isDone;
            return (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{
                  width:16, height:16, borderRadius:4, flexShrink:0,
                  background: done ? "var(--emerald)" : current ? "var(--blue)" : "var(--bg-hover)",
                  border: `1px solid ${done ? "var(--emerald)" : current ? "var(--blue)" : "var(--border)"}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:9, color:"white", fontWeight:800,
                }}>
                  {done ? "✓" : current ? <span style={{ animation:"pulse-dot 1s infinite", display:"inline-block" }}>•</span> : ""}
                </span>
                <span style={{
                  fontSize:11, fontFamily:"var(--font-mono)",
                  color: done ? "var(--emerald)" : current ? "var(--text-hi)" : "var(--text-lo)",
                  fontWeight: current ? 700 : 400,
                }}>
                  {STAGE_LABELS[s]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Results (done) */}
        {isDone && event.accuracies && (
          <div style={{
            background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)",
            borderRadius:10, padding:"12px 16px", marginBottom:16,
          }}>
            <div style={{ fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)", marginBottom:10, letterSpacing:0.8 }}>
              FINAL ACCURACIES
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {Object.entries(event.accuracies).map(([k,v]) => (
                <div key={k} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:9, color:"var(--text-lo)", fontFamily:"var(--font-mono)", marginBottom:3 }}>{k.toUpperCase()}</div>
                  <div style={{
                    fontSize:18, fontWeight:800, fontFamily:"var(--font-mono)",
                    color: k===event.best_model ? "var(--amber)" : "var(--text-mid)",
                  }}>
                    {(v*100).toFixed(1)}%
                  </div>
                  {k===event.best_model && <div style={{ fontSize:8, color:"var(--amber)", marginTop:1 }}>BEST</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close / dismiss */}
        {(isDone || isError) && (
          <button onClick={onClose} style={{
            width:"100%", padding:"11px 0",
            background: isDone ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            border:`1px solid ${isDone ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            borderRadius:10, color: isDone ? "var(--emerald)" : "var(--red)",
            fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:"var(--font-display)",
          }}>
            {isDone ? "Done — Reload Dashboard" : "Dismiss"}
          </button>
        )}
      </div>
    </div>
  );
}
