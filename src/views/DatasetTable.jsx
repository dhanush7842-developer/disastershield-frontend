/* views/DatasetTable.jsx */
import React, { useState, useEffect, useCallback } from "react";
import { fetchDataset } from "../services/api";

const PRIORITY_STYLE = {
  "High":        { bg:"rgba(239,68,68,0.12)",  color:"#ef4444", border:"rgba(239,68,68,0.3)" },
  "Medium-High": { bg:"rgba(249,115,22,0.12)", color:"#f97316", border:"rgba(249,115,22,0.3)" },
  "Medium-Low":  { bg:"rgba(245,158,11,0.12)", color:"#f59e0b", border:"rgba(245,158,11,0.3)" },
  "Low":         { bg:"rgba(16,185,129,0.12)", color:"#10b981", border:"rgba(16,185,129,0.3)" },
};
const TYPE_COLOR = {
  Flood:"#3b82f6", Earthquake:"#8b5cf6", Fire:"#ef4444", Cyclone:"#06b6d4",
  Rail:"#f59e0b", Stampede:"#f97316", Epidemic:"#10b981", Aviation:"#6366f1", Other:"#6b7280", Landslide:"#a16207",
};

function Badge({ label, type = "type" }) {
  const c = type === "priority" ? (PRIORITY_STYLE[label] || {}) : {};
  const color = type === "priority" ? c.color : (TYPE_COLOR[label] || "#6b7280");
  return (
    <span style={{
      background: type === "priority" ? c.bg : `${color}18`,
      color,
      border: `1px solid ${type === "priority" ? c.border : `${color}33`}`,
      borderRadius: 5, padding:"2px 7px",
      fontSize: 10, fontWeight: 700,
      fontFamily: "var(--font-mono)", whiteSpace:"nowrap",
    }}>{label}</span>
  );
}

const COLS = [
  { key:"year",             label:"Year",    sortable:true,  w:60  },
  { key:"date",             label:"Date",    sortable:true,  w:96  },
  { key:"title",            label:"Title",   sortable:false, w:null },
  { key:"disaster_type",    label:"Type",    sortable:true,  w:110 },
  { key:"cluster_priority", label:"Priority",sortable:false, w:110 },
  { key:"duration",         label:"Duration",sortable:false, w:80  },
];

function useDebounce(val, ms) {
  const [dv, setDv] = useState(val);
  useEffect(() => { const t = setTimeout(() => setDv(val), ms); return () => clearTimeout(t); }, [val, ms]);
  return dv;
}

export default function DatasetTable() {
  const [data,    setData]    = useState({ total:0, pages:1, data:[], class_counts:{}, priority_counts:{} });
  const [page,    setPage]    = useState(1);
  const [filter,  setFilter]  = useState("");
  const [sort,    setSort]    = useState({ col:"year", order:"asc" });
  const [loading, setLoading] = useState(true);
  const [selected,setSelected]= useState(null);

  const debouncedFilter = useDebounce(filter, 300);

  const load = useCallback(() => {
    setLoading(true);
    fetchDataset({ page, filter: debouncedFilter, sort: sort.col, order: sort.order })
      .then(setData).finally(() => setLoading(false));
  }, [page, debouncedFilter, sort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedFilter]);

  const handleSort = col => {
    setSort(s => ({ col, order: s.col === col && s.order === "asc" ? "desc" : "asc" }));
    setPage(1);
  };

  const exportCSV = () => {
    const hdr = COLS.map(c=>c.label).join(",");
    const rows = data.data.map(r => [r.year, r.date, `"${r.title}"`, r.disaster_type, r.cluster_priority, r.duration||""].join(","));
    const blob = new Blob([hdr+"\n"+rows.join("\n")], { type:"text/csv" });
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="disasters.csv"; a.click();
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>

      {/* Toolbar */}
      <div style={{
        padding:"14px 24px", borderBottom:"1px solid var(--border)",
        display:"flex", alignItems:"center", gap:12, background:"var(--bg-panel)", flexShrink:0,
      }}>
        <div style={{ position:"relative", flex:1, maxWidth:320 }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text-lo)", fontSize:13 }}>⌕</span>
          <input
            value={filter} onChange={e=>setFilter(e.target.value)}
            placeholder="Filter by title…"
            style={{
              width:"100%", background:"var(--bg-card)", border:"1px solid var(--border)",
              borderRadius:8, padding:"7px 10px 7px 30px",
              color:"var(--text-hi)", fontSize:13, outline:"none",
              fontFamily:"var(--font-body)",
            }}
          />
        </div>

        {/* Summary badges */}
        <div style={{ display:"flex", gap:8 }}>
          {Object.entries(data.class_counts).slice(0,4).map(([k,v]) => (
            <div key={k} style={{ fontSize:10, fontFamily:"var(--font-mono)", color:TYPE_COLOR[k]||"var(--text-lo)",
              background:`${TYPE_COLOR[k]||"#6b7280"}15`, border:`1px solid ${TYPE_COLOR[k]||"#6b7280"}25`,
              borderRadius:4, padding:"2px 8px", display:"flex", alignItems:"center", gap:4 }}>
              {k} <span style={{ color:"var(--text-mid)", fontWeight:700 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ marginLeft:"auto", fontSize:11, color:"var(--text-lo)", fontFamily:"var(--font-mono)" }}>
          {data.total} records
        </div>
        <button onClick={exportCSV} style={{
          background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)",
          borderRadius:7, padding:"6px 14px", color:"var(--emerald)",
          fontSize:12, fontWeight:600, cursor:"pointer",
        }}>↓ CSV</button>
      </div>

      {/* Table */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
          <thead style={{ position:"sticky", top:0, zIndex:10, background:"var(--bg-panel)" }}>
            <tr>
              {COLS.map(col => (
                <th key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{
                    textAlign:"left", padding:"10px 16px",
                    fontSize:10, color: sort.col===col.key ? "var(--amber)" : "var(--text-lo)",
                    fontFamily:"var(--font-mono)", letterSpacing:0.8,
                    borderBottom:"1px solid var(--border)", fontWeight:700,
                    cursor: col.sortable ? "pointer" : "default",
                    width: col.w || undefined,
                    userSelect:"none",
                    whiteSpace:"nowrap",
                  }}>
                  {col.label.toUpperCase()}
                  {col.sortable && sort.col===col.key && (
                    <span style={{ marginLeft:4, color:"var(--amber)" }}>{sort.order==="asc"?"↑":"↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(10).fill(0).map((_,i) => (
                <tr key={i}>
                  {COLS.map(c => (
                    <td key={c.key} style={{ padding:"12px 16px" }}>
                      <div className="skeleton" style={{ height:14, borderRadius:4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.data.map((row, i) => (
              <tr key={row.record_id}
                onClick={() => setSelected(selected?.record_id===row.record_id ? null : row)}
                style={{
                  borderBottom:"1px solid var(--border)",
                  background: selected?.record_id===row.record_id ? "rgba(245,158,11,0.06)"
                              : i%2===0 ? "transparent" : "rgba(255,255,255,0.01)",
                  cursor:"pointer",
                  transition:"background 0.1s",
                }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"}
                onMouseLeave={e=>e.currentTarget.style.background=selected?.record_id===row.record_id?"rgba(245,158,11,0.06)":i%2===0?"transparent":"rgba(255,255,255,0.01)"}
              >
                <td style={{ padding:"10px 16px", fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-lo)" }}>{row.year}</td>
                <td style={{ padding:"10px 16px", fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-lo)" }}>{row.date}</td>
                <td style={{ padding:"10px 16px", fontSize:12, color:"var(--text-hi)", maxWidth:280 }} className="truncate">
                  {row.title}
                </td>
                <td style={{ padding:"10px 16px" }}><Badge label={row.disaster_type} type="type" /></td>
                <td style={{ padding:"10px 16px" }}><Badge label={row.cluster_priority} type="priority" /></td>
                <td style={{ padding:"10px 16px", fontSize:11, color:"var(--text-lo)", fontFamily:"var(--font-mono)" }}>{row.duration||"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel (selected row) */}
      {selected && (
        <div style={{
          padding:"14px 24px", background:"var(--bg-card)",
          borderTop:"1px solid var(--border)", flexShrink:0,
          animation:"fade-in 0.2s ease both",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--text-hi)" }}>{selected.title}</div>
            <button onClick={()=>setSelected(null)} style={{ background:"none",border:"none",color:"var(--text-lo)",cursor:"pointer",fontSize:18 }}>✕</button>
          </div>
          <p style={{ fontSize:12, color:"var(--text-mid)", lineHeight:1.7 }}>{selected.snippet}</p>
        </div>
      )}

      {/* Pagination */}
      <div style={{
        padding:"12px 24px", borderTop:"1px solid var(--border)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"var(--bg-panel)", flexShrink:0,
      }}>
        <span style={{ fontSize:11, color:"var(--text-lo)", fontFamily:"var(--font-mono)" }}>
          Page {page} / {data.pages}
        </span>
        <div style={{ display:"flex", gap:6 }}>
          {[1, page-1, page, page+1, data.pages].filter((v,i,a) => v>=1 && v<=data.pages && a.indexOf(v)===i)
            .reduce((acc, v, i, arr) => {
              if (i > 0 && v - arr[i-1] > 1) acc.push("…");
              acc.push(v); return acc;
            }, [])
            .map((p, i) => (
              p === "…"
                ? <span key={`e${i}`} style={{ padding:"0 4px", color:"var(--text-lo)", fontSize:12 }}>…</span>
                : <button key={p} onClick={()=>setPage(p)} style={{
                    width:28, height:28, borderRadius:6,
                    background: page===p ? "var(--amber)" : "var(--bg-card)",
                    border:`1px solid ${page===p ? "var(--amber)" : "var(--border)"}`,
                    color: page===p ? "#000" : "var(--text-mid)",
                    fontSize:11, fontWeight:700, cursor:"pointer",
                    fontFamily:"var(--font-mono)",
                  }}>{p}</button>
            ))
          }
        </div>
        <span style={{ fontSize:11, color:"var(--text-lo)", fontFamily:"var(--font-mono)" }}>
          {data.total} total
        </span>
      </div>
    </div>
  );
}
