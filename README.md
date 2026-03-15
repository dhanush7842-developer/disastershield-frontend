# DisasterShield AI — Frontend Dashboard

React-based Command Center UI connecting to the FastAPI ML backend.

**Live Demo:** [https://disastershield-frontend.onrender.com](https://disastershield-frontend.onrender.com)

## Quick Start

### Prerequisites
- Node.js 18+ installed
- DisasterShield AI backend running on port 8000

### 1. Install dependencies
```bash
cd disastershield-frontend
npm install
```

### 2. Start the dev server
```bash
npm start
```
Opens at: **http://localhost:3000**

The app automatically proxies `/v1/...` and `/health` to `http://localhost:8000`
(configured via `"proxy"` in package.json).

---

## Views

| Icon | View | Description |
|------|------|-------------|
| ⬡ | **Dashboard** | Overview: model registry, class distribution, priority zones, performance chart |
| ⊞ | **Dataset** | Browse all 207 records with filtering, sorting, pagination, CSV export |
| ◈ | **Predict** | Free-text input → real-time disaster classification + alert simulation |
| ◉ | **Visualize** | All 5 charts: confusion matrix, ROC curves, distributions, accuracy comparison, elbow |
| ≡ | **Logs** | Live event log with filtering by level + auto-refresh |

---

## Features

- **Works offline** — mock data fallback when backend is not running
- **Live backend status** indicator (green/red dots in sidebar)
- **Retrain button** in header — streams training progress in real-time modal
- **Alert simulation** — auto-triggers CDOT/RAHAT alert when confidence > 0.75 + High zone
- **Prediction history** — last 6 predictions shown in predict view
- **Chart zoom** — click ⤢ to fullscreen any chart; ↓ to download PNG
- **Log live-tail** — toggle LIVE mode for auto-refresh every 5s
- **CSV export** from dataset table

---

## Running with Backend

Make sure the backend is running first:
```bash
# In the disastershield/ folder:
python train.py          # first time only
cd app
uvicorn main:app --reload --port 8000
```

Then start the frontend:
```bash
cd disastershield-frontend
npm start
```

---

## Production Build

```bash
npm run build
# Outputs to: build/
# Serve with: npx serve -s build
```

---

## Project Structure

```
src/
├── App.jsx                     ← Root layout, health polling, retrain trigger
├── index.jsx                   ← React entry point
├── index.css                   ← Global design tokens + animations
├── services/
│   └── api.js                  ← All API calls + mock data fallback
├── components/
│   ├── Sidebar.jsx             ← Icon nav + status dots
│   ├── Header.jsx              ← Title, retrain button, status, clock
│   └── TrainingModal.jsx       ← SSE training progress overlay
└── views/
    ├── Dashboard.jsx           ← Stats, charts, model registry table
    ├── DatasetTable.jsx        ← Filterable/sortable table + snippet panel
    ├── PredictionPanel.jsx     ← Text input, model select, results, alert
    ├── Visualizations.jsx      ← 5-chart viewer with thumbnails + zoom
    └── Logs.jsx                ← Event log with level filter + live mode
```
