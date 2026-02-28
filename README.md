# Flood Risk Intelligence Engine 🌍

An interactive, software-based climate intelligence engine that transforms open satellite data into structured, decision-ready climate risk insights. Built in response to **COSMEON Problem Statement 6**.

## Overview
This platform ingests live public satellite imagery (Sentinel-2) via the **Google Earth Engine (GEE)** API and processes it using Earth Engine's server-side spatial computing power. Rather than relying on static, pre-downloaded batches, this system operates dynamically: when a user clicks a location on the dashboard, the backend instantly calculates historical water baselines (NDWI), detects recent flood expansions, factors in geographical elevation (SRTM Digital Elevation Model), and formulates an on-demand, explainable risk assessment.

## Features
- 🛰️ **Live GEE Integration**: No more downloading gigabytes of `.tif` files. Computations happen server-side on Google Cloud.
- 🌊 **Automated Water Detection**: Dynamically computes Normalized Difference Water Index (NDWI) on demand.
- 📉 **Change Detection**: Compares historical water baselines (Past Year) against recent observations to detect anomalies.
- 🏔️ **Topographical Context**: Ingests SRTM elevation data to identify low-lying, vulnerable basins.
- 💬 **Explainable AI Insights**: Doesn't just give a risk score; provides human-readable context on *why* an area is at risk.
- 🗺️ **Interactive 3D Dashboard**: A premium Next.js UI using MapLibre that fetches and displays live analytics natively.

## Architecture Structure
The application uses an On-Demand API Architecture split into two interconnected layers:

1. **The Backend (`/src`) - Python / FastAPI**
    - `api.py`: The high-speed controller that receives coordinates and returns structured JSON risk insights to the dashboard.
    - `gee_analysis.py`: The intelligence module governing Earth Engine. It creates Regions of Interest (ROI), executes the NDWI algorithms, sums the pixel areas, queries elevation models, and processes the final risk logic.

2. **The Frontend (`/dashboard`) - Next.js / React**
    - A sleek, dark-themed geographic dashboard.
    - Captures `onClick` events on the 3D map, sending coordinates to the backend, and renders the live JSON response into predictive trend charts and critical alert panels.

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js v18+
- A Google Cloud Project with the **Earth Engine API** enabled.

### 1. Backend Setup (FastAPI & Earth Engine)

Navigate to the project root and install the Python dependencies:

```bash
# Create a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Authenticate your local machine with Google Earth Engine:
```bash
earthengine authenticate
```
Ensure your Google Cloud Project ID is configured inside `src/gee_analysis.py` on line 7:
`ee.Initialize(project="your-project-id")`

Run the FastAPI server:
```bash
uvicorn src.api:app --reload
```
*The backend API will start on `http://127.0.0.1:8000`*

### 2. Frontend Setup (Next.js)

Open a new terminal and navigate to the `dashboard` directory:

```bash
cd dashboard

# Install node modules
npm install

# Run the development server
npm run dev
```
*The interactive dashboard will start on `http://localhost:3000`*

## Usage
1. Open `http://localhost:3000` in your browser.
2. The initial loading screen will simulate fetching global connections.
3. Once the 3D globe loads, click on any coastal line, river basin, or city.
4. The dashboard will trigger the Python backend, process the satellite data live on GEE, and return the flood risk analysis within seconds.
