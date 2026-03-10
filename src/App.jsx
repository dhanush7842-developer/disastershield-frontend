/* App.jsx */
import React, { useState, useEffect, useCallback } from "react";
import "./index.css";

import Sidebar        from "./components/Sidebar";
import Header         from "./components/Header";
import TrainingModal  from "./components/TrainingModal";
import Dashboard      from "./views/Dashboard";
import DatasetTable   from "./views/DatasetTable";
import PredictionPanel from "./views/PredictionPanel";
import Visualizations from "./views/Visualizations";
import Logs           from "./views/Logs";

import { checkHealth, trainModels } from "./services/api";

export default function App() {
  const [view,         setView]     = useState("dashboard");
  const [health,       setHealth]   = useState(null);
  const [training,     setTraining] = useState(false);
  const [trainEvent,   setTrainEvt] = useState(null);

  // Poll health every 10s
  const pollHealth = useCallback(() => {
    checkHealth().then(h => setHealth({
      ...h,
      best_model: h.best_model || null,
      models_loaded: h.models_loaded ?? (h.status === "ok"),
    }));
  }, []);

  useEffect(() => {
    pollHealth();
    const t = setInterval(pollHealth, 10000);
    return () => clearInterval(t);
  }, [pollHealth]);

  const handleRetrain = () => {
    if (training) return;
    if (!window.confirm("Retrain all 3 models on the full dataset? This takes ~30 seconds.")) return;
    setTraining(true);
    setTrainEvt({ stage:"loading_csv", progress:5, message:"Starting training pipeline…" });
    trainModels(evt => setTrainEvt(evt))
      .finally(() => setTraining(false));
  };

  const handleTrainClose = () => {
    setTrainEvt(null);
    pollHealth();   // refresh health after training
  };

  const VIEWS = { dashboard: Dashboard, dataset: DatasetTable, predict: PredictionPanel, visualize: Visualizations, logs: Logs };
  const ViewComponent = VIEWS[view] || Dashboard;

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      {/* Sidebar */}
      <Sidebar active={view} onNav={setView} health={health} />

      {/* Main area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header
          view={view}
          health={health}
          onRetrain={handleRetrain}
          training={training}
        />

        {/* View content */}
        <main style={{ flex:1, overflow:"hidden", position:"relative" }}>
          <ViewComponent health={health} />
        </main>
      </div>

      {/* Training modal */}
      {trainEvent && (
        <TrainingModal
          event={trainEvent}
          onClose={handleTrainClose}
        />
      )}
    </div>
  );
}
