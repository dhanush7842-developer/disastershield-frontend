/* views/Dashboard.jsx */
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { fetchModels, fetchDataset } from "../services/api";

const PRIORITY_COLOR = { High:"var(--red)", "Medium-High":"var(--orange)", "Medium-Low":"var(--amber)", Low:"var(--emerald)" };
const MODEL_COLOR    = { rf:"var(--blue)", adaboost:"var(--amber)", gb:"var(--emerald)" };
const MODEL_LABEL    = { rf:"Random Forest", adaboost:"AdaBoost", gb:"Grad. Boosting" };

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, accent = "var(--amber)", delay = 0 }) {
  return (
    <Card style={{ animation: `fade-in 0.4s ease ${delay}s both` }}>
      <div style={{ fontSize: 11, color: "var(--text-mid)", fontFamily:"var(--font-mono)", letterSpacing:1, marginBottom:8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, fontFamily:"var(--font-display)", color: accent, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-lo)", marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--bg-panel)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px" }}>
      <div style={{ color:"var(--text-mid)", fontSize:11, marginBottom:4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:"var(--text-hi)", fontSize:13, fontWeight:600 }}>
          {typeof p.value === "number" && p.value < 2 ? (p.value * 100).toFixed(1) + "%" : p.value}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({ health }) {
  const [meta, setMeta]       = useState(null);
  const [dsData, setDsData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchModels(), fetchDataset({ pageSize: 1 })])
      .then(([m, d]) => { setMeta(m); setDsData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, padding:24 }}>
      {Array(8).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:100 }} />)}
    </div>
  );

  const accData = meta ? Object.entries(meta.accuracies).map(([k,v]) => ({
    name: MODEL_LABEL[k] || k, acc: parseFloat((v*100).toFixed(1)), f1: parseFloat(((meta.f1_scores?.[k]||0)*100).toFixed(1)),
    color: MODEL_COLOR[k],
  })) : [];

  const classDist = dsData?.class_counts
    ? Object.entries(dsData.class_counts).sort((a,b)=>b[1]-a[1]).map(([name,value]) => ({ name, value }))
    : [];

  const priorityDist = dsData?.priority_counts
    ? Object.entries(dsData.priority_counts).map(([name, value]) => ({ name, value, fill: PRIORITY_COLOR[name] }))
    : [];

  return (
    <div style={{ padding:24, overflowY:"auto", height:"100%" }}>
      {/* Stat Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:16 }}>
        <Stat label="Total Records" value={dsData?.total || 207} sub="India disasters 1990–2021" accent="var(--amber)" delay={0} />
        <Stat label="Best Model" value={(meta?.best_model || "rf").toUpperCase()} sub={`Accuracy: ${((meta?.accuracies?.[meta?.best_model]||0)*100).toFixed(1)}%`} accent="var(--blue)" delay={0.05} />
        <Stat label="Disaster Classes" value={meta?.classes?.length || 9} sub="Including: Flood, Quake, Cyclone…" accent="var(--emerald)" delay={0.1} />
        <Stat label="Priority Zones" value="K=4" sub="High / Med-High / Med-Low / Low" accent="var(--red)" delay={0.15} />
      </div>

      {/* Charts Row */}
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr 0.8fr", gap:16, marginBottom:16 }}>

        {/* Model Accuracy Chart */}
        <Card style={{ animation:"fade-in 0.4s ease 0.2s both" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-mid)", marginBottom:16, fontFamily:"var(--font-mono)", letterSpacing:1 }}>
            MODEL PERFORMANCE
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={accData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize:10, fill:"var(--text-lo)", fontFamily:"var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fontSize:9, fill:"var(--text-lo)" }} axisLine={false} tickLine={false} width={28} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="acc" name="Accuracy" radius={[4,4,0,0]} maxBarSize={36}>
                {accData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.85} />)}
              </Bar>
              <Bar dataKey="f1" name="F1 Score" radius={[4,4,0,0]} maxBarSize={36}>
                {accData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.35} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"var(--text-lo)" }}>
              <span style={{ width:10,height:10,borderRadius:2,background:"var(--blue)",opacity:0.85,display:"inline-block" }} />Accuracy
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"var(--text-lo)" }}>
              <span style={{ width:10,height:10,borderRadius:2,background:"var(--blue)",opacity:0.35,display:"inline-block" }} />F1
            </div>
          </div>
        </Card>

        {/* Disaster Class Distribution */}
        <Card style={{ animation:"fade-in 0.4s ease 0.25s both" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-mid)", marginBottom:16, fontFamily:"var(--font-mono)", letterSpacing:1 }}>
            CLASS DISTRIBUTION
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {classDist.slice(0,6).map((d, i) => (
              <div key={d.name} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontSize:10, color:"var(--text-lo)", width:72, fontFamily:"var(--font-mono)", textAlign:"right" }}>{d.name}</div>
                <div style={{ flex:1, height:14, background:"var(--bg-hover)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{
                    height:"100%", borderRadius:3,
                    width: `${(d.value / (classDist[0]?.value||1)) * 100}%`,
                    background: `hsl(${210 + i*25},80%,55%)`,
                    transition:"width 1s ease",
                  }} />
                </div>
                <div style={{ fontSize:10, color:"var(--text-mid)", fontFamily:"var(--font-mono)", width:24, textAlign:"right" }}>{d.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Priority Zones */}
        <Card style={{ animation:"fade-in 0.4s ease 0.3s both" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-mid)", marginBottom:12, fontFamily:"var(--font-mono)", letterSpacing:1 }}>
            PRIORITY ZONES
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={priorityDist} dataKey="value" cx="50%" cy="50%" innerRadius={34} outerRadius={58} paddingAngle={3}>
                {priorityDist.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:4 }}>
            {priorityDist.map(d => (
              <div key={d.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, color:"var(--text-lo)" }}>
                  <span style={{ width:8,height:8,borderRadius:"50%",background:d.fill,display:"inline-block" }} />
                  {d.name}
                </div>
                <span style={{ color:"var(--text-mid)", fontFamily:"var(--font-mono)" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Model details table */}
      <Card style={{ animation:"fade-in 0.4s ease 0.35s both" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--text-mid)", marginBottom:16, fontFamily:"var(--font-mono)", letterSpacing:1 }}>
          MODEL REGISTRY
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              {["Model","Algorithm","Accuracy","F1 Score","Train Time","Status"].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:10, color:"var(--text-lo)", fontFamily:"var(--font-mono)", letterSpacing:0.8, borderBottom:"1px solid var(--border)", fontWeight:600 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { key:"rf",       algo:"RandomForestClassifier", params:"n_estimators=200, balanced" },
              { key:"adaboost", algo:"AdaBoostClassifier",     params:"n_estimators=100, lr=0.5" },
              { key:"gb",       algo:"GradientBoostingClassifier", params:"n_estimators=150, lr=0.1" },
            ].map((row, i) => {
              const isBest = meta?.best_model === row.key;
              return (
                <tr key={row.key} style={{ borderBottom:"1px solid var(--border)", background: isBest ? "rgba(245,158,11,0.04)" : "transparent" }}>
                  <td style={{ padding:"10px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontWeight:700, color: MODEL_COLOR[row.key], fontSize:13 }}>{row.key.toUpperCase()}</span>
                      {isBest && <span style={{ background:"rgba(245,158,11,0.15)", color:"var(--amber)", fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:3, fontFamily:"var(--font-mono)" }}>BEST</span>}
                    </div>
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:11, color:"var(--text-mid)" }}>
                    <div>{row.algo}</div>
                    <div style={{ fontSize:10, color:"var(--text-lo)", marginTop:2, fontFamily:"var(--font-mono)" }}>{row.params}</div>
                  </td>
                  <td style={{ padding:"10px 12px", fontFamily:"var(--font-mono)", fontSize:13, fontWeight:700, color: MODEL_COLOR[row.key] }}>
                    {meta ? (meta.accuracies[row.key] * 100).toFixed(2) + "%" : "—"}
                  </td>
                  <td style={{ padding:"10px 12px", fontFamily:"var(--font-mono)", fontSize:13, color:"var(--text-mid)" }}>
                    {meta?.f1_scores ? (meta.f1_scores[row.key] * 100).toFixed(2) + "%" : "—"}
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:11, color:"var(--text-lo)", fontFamily:"var(--font-mono)" }}>
                    ~{[1.1, 0.9, 23][i]}s
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    <span style={{
                      background:"rgba(16,185,129,0.1)", color:"var(--emerald)",
                      border:"1px solid rgba(16,185,129,0.2)", borderRadius:4,
                      fontSize:9, fontWeight:700, padding:"2px 7px", fontFamily:"var(--font-mono)",
                    }}>LOADED</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
