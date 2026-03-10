/* services/api.js — All backend calls with mock-data fallback */

const BASE = "";   // empty = uses CRA proxy (localhost:8000)

// ── helpers ───────────────────────────────────────────────────────────────
async function req(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ── MOCK DATA (used when backend is offline) ──────────────────────────────
const MOCK_META = {
  best_model: "rf",
  accuracies:  { rf: 0.7143, adaboost: 0.4286, gb: 0.6667 },
  f1_scores:   { rf: 0.6861, adaboost: 0.4056, gb: 0.6281 },
  classes: ["Aviation","Cyclone","Earthquake","Epidemic","Fire","Flood","Other","Rail","Stampede"],
  n_records: 207,
  trained_at: new Date().toISOString(),
  priority_map: { "0":"Medium-Low","1":"High","2":"Medium-High","3":"Low" },
};

const MOCK_DATASET = {
  total: 207, page: 1, page_size: 20, pages: 11,
  class_counts:    { Flood:67, Earthquake:37, Fire:31, Other:24, Rail:19, Stampede:18, Epidemic:5, Aviation:3, Cyclone:3 },
  priority_counts: { High:129, "Medium-High":35, "Medium-Low":23, Low:20 },
  data: Array.from({ length: 20 }, (_, i) => ({
    record_id: i,
    year: 1990 + Math.floor(i * 1.6),
    date: `199${Math.floor(i/3)}-0${(i%9)+1}-15`,
    title: ["1990 Andhra Pradesh Cyclone","1991 Uttarkashi Earthquake","1993 Latur Earthquake",
            "1994 Plague in India","Firozabad Rail Disaster","Uphaar Cinema Fire",
            "1998 Malpa Landslide","1999 Sabarimala Stampede","2000 Mumbai Landslide",
            "2001 Gujarat Earthquake","2004 Indian Ocean Tsunami","2005 Kashmir Earthquake",
            "2008 Bihar Floods","2010 Leh Cloudbursts","2013 Uttarakhand Floods",
            "2014 Cyclone Hudhud","2015 Chennai Floods","2018 Kerala Floods",
            "2019 Cyclone Fani","2021 Chamoli Disaster"][i] || `Disaster Event ${i+1}`,
    disaster_type: ["Cyclone","Earthquake","Earthquake","Epidemic","Rail","Fire",
                    "Landslide","Stampede","Landslide","Earthquake","Flood","Earthquake",
                    "Flood","Flood","Flood","Cyclone","Flood","Flood","Cyclone","Flood"][i] || "Other",
    cluster_priority: ["High","High","High","Medium-High","Medium-High","High",
                       "Medium-Low","Medium-High","Low","High","High","High",
                       "High","Medium-Low","High","High","High","High","High","High"][i] || "Medium-Low",
    duration: `${(i%10)+2} days`,
    snippet: "Description of disaster event and its impact on the affected region...",
  })),
};

function mockPrediction(description, model) {
  const keywords = description.toLowerCase();
  let cls = "Other";
  if (keywords.includes("flood") || keywords.includes("monsoon")) cls = "Flood";
  else if (keywords.includes("earth") || keywords.includes("quake") || keywords.includes("seismic")) cls = "Earthquake";
  else if (keywords.includes("cyclon") || keywords.includes("storm")) cls = "Cyclone";
  else if (keywords.includes("fire") || keywords.includes("blaze")) cls = "Fire";
  else if (keywords.includes("train") || keywords.includes("rail")) cls = "Rail";
  else if (keywords.includes("stamp") || keywords.includes("crowd")) cls = "Stampede";
  else if (keywords.includes("plague") || keywords.includes("epidemic")) cls = "Epidemic";
  else if (keywords.includes("aircraft") || keywords.includes("flight")) cls = "Aviation";
  const conf = 0.65 + Math.random() * 0.3;
  const probs = {};
  MOCK_META.classes.forEach(c => probs[c] = c === cls ? parseFloat(conf.toFixed(3)) : parseFloat((Math.random() * 0.1).toFixed(3)));
  return {
    predicted_class: cls,
    confidence: parseFloat(conf.toFixed(3)),
    probabilities: probs,
    cluster_id: 1,
    cluster_priority: conf > 0.8 ? "High" : "Medium-High",
    model_used: model === "best" ? "rf" : model,
    model_accuracy: MOCK_META.accuracies[model === "best" ? "rf" : model] || 0.71,
    model_f1: 0.69,
    alert_triggered: conf > 0.75,
    alert_id: conf > 0.75 ? `ALT-${Date.now().toString(36).toUpperCase()}` : null,
  };
}

// ── API CALLS ─────────────────────────────────────────────────────────────
export async function checkHealth() {
  try   { return await req("GET", "/health"); }
  catch { return { status:"offline", models_loaded:false, best_model:null }; }
}

export async function fetchModels() {
  try   { return await req("GET", "/v1/models"); }
  catch { return MOCK_META; }
}

export async function fetchDataset(params = {}) {
  const qs = new URLSearchParams({
    page:      params.page      || 1,
    page_size: params.pageSize  || 20,
    sort:      params.sort      || "year",
    order:     params.order     || "asc",
    ...(params.filter && { filter: params.filter }),
  });
  try   { return await req("GET", `/v1/dataset-preview?${qs}`); }
  catch { return MOCK_DATASET; }
}

export async function predict(description, model = "best") {
  try   { return await req("POST", "/v1/predict", { description, model }); }
  catch { return mockPrediction(description, model); }
}

export async function fetchVisualizations(model = "best") {
  try   { return await req("GET", `/v1/visualizations?model=${model}`); }
  catch { return null; }
}

export async function simulateAlert(payload) {
  try {
    return await req("POST", "/v1/alerts/simulate", payload);
  } catch {
    return {
      alert_id: `ALT-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      disaster_type: payload.disaster_type,
      severity: payload.cluster_priority === "High" ? "CRITICAL" : "HIGH",
      zone: `${payload.cluster_priority} Priority Zone`,
      recommended_action: "Activate disaster response protocol, alert local authorities.",
      simulated_recipients: ["NDRF HQ","State DM Authority","IMD Alert","CDOT Emergency","RAHAT Platform"],
      delivery_channels: ["SMS_BULK","IVR_CALL","MOBILE_APP_PUSH","EMAIL_BLAST"],
      simulated: true,
    };
  }
}

export async function fetchLogs(params = {}) {
  const qs = new URLSearchParams({ limit: params.limit || 100, ...(params.level && { level: params.level }) });
  try   { return await req("GET", `/v1/logs?${qs}`); }
  catch {
    return {
      total: 6,
      logs: [
        { timestamp: new Date().toISOString(), level:"INFO",  event:"startup_loaded_artifacts", details:{ best_model:"rf" } },
        { timestamp: new Date(Date.now()-30000).toISOString(), level:"INFO", event:"prediction_made", details:{ model:"rf", predicted:"Flood", confidence:0.87 } },
        { timestamp: new Date(Date.now()-60000).toISOString(), level:"WARN", event:"alert_triggered",  details:{ alert_id:"ALT-001", disaster_type:"Flood" } },
        { timestamp: new Date(Date.now()-90000).toISOString(), level:"INFO", event:"visualizations_generated", details:{ model:"rf" } },
        { timestamp: new Date(Date.now()-120000).toISOString(), level:"INFO", event:"prediction_made", details:{ model:"gb", predicted:"Earthquake", confidence:0.71 } },
        { timestamp: new Date(Date.now()-200000).toISOString(), level:"INFO", event:"startup_loaded_artifacts", details:{ best_model:"rf" } },
      ],
    };
  }
}

export function trainModels(onEvent) {
  return fetch("/v1/train", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
    .then(res => {
      if (!res.body) throw new Error("No SSE stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      function pump() {
        return reader.read().then(({ done, value }) => {
          if (done) return;
          const text = decoder.decode(value);
          text.split("\n").forEach(line => {
            if (line.startsWith("data: ")) {
              try { onEvent(JSON.parse(line.slice(6))); } catch {}
            }
          });
          return pump();
        });
      }
      return pump();
    })
    .catch(() => {
      // Mock training stream
      const stages = [
        { stage:"loading_csv", progress:10, message:"Loading dataset (207 records)..." },
        { stage:"tfidf_fit",   progress:25, message:"Fitting TF-IDF vectorizer..." },
        { stage:"rf_training", progress:45, message:"Training Random Forest (200 trees)..." },
        { stage:"adaboost_training", progress:60, message:"Training AdaBoost (100 estimators)..." },
        { stage:"gb_training", progress:78, message:"Training Gradient Boosting..." },
        { stage:"kmeans",      progress:90, message:"Running K-Means clustering (K=4)..." },
        { stage:"saving",      progress:97, message:"Saving models to disk..." },
        { stage:"done",        progress:100, message:"Training complete!", best_model:"rf",
          accuracies:{ rf:0.7143, adaboost:0.4286, gb:0.6667 }, f1_scores:{ rf:0.6861, adaboost:0.4056, gb:0.6281 } },
      ];
      let i = 0;
      return new Promise(resolve => {
        const interval = setInterval(() => {
          onEvent(stages[i++]);
          if (i >= stages.length) { clearInterval(interval); resolve(); }
        }, 700);
      });
    });
}
