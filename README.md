# Flood Risk Intelligence Engine 🌍 🌊

An interactive, software-based climate intelligence engine that transforms open satellite data into structured, decision-ready climate risk insights. Built in response to **COSMEON Problem Statement 6**.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)

---

## 📖 Overview

This platform ingests live public satellite imagery (Sentinel-2 Harmonized) via the **Google Earth Engine (GEE)** API and processes it utilizing massive server-side spatial computing power. 

Rather than relying on static, pre-downloaded batches of heavy `.tif` files, this system operates **dynamically**. When a user clicks a geographic coordinate on the Next.js interactive 3D dashboard, the Python backend instantly:
1. Calculates historical water baselines (MNDWI).
2. Detects recent flood expansions using temporal change detection.
3. Computes intersection against built-up/urban infrastructure (ESA WorldCover).
4. Computes human population exposure (CIESIN Data).
5. Cross-references geographical elevation (SRTM Digital Elevation Model).
6. Formulates an on-demand, explainable risk assessment.

---

## ✨ Key Features

- 🛰️ **Live GEE Integration**: No downloading gigabytes of satellite files. All heavy spatial computations happen server-side on Google Cloud.
- 🌊 **Automated Water Detection**: Dynamically computes Modified Normalized Difference Water Index (MNDWI) to separate water from land and urban noise.
- 📉 **Change Detection**: Temporal analysis comparing historical baselines (Past 5 Years) against recent observations (Past Year).
- 🏔️ **Topographical Context**: Ingests SRTM elevation data to identify low-lying, vulnerable basins.
- 🏘️ **Exposure Analytics**: Computes the exact population count and urban infrastructure square-kilometer exposure intersecting with the newly flooded zones.
- 💬 **Explainable AI Insights**: Explains to the end-user *exactly why* an area is classified as HIGH or LOW risk based on the physical data.
- 🗺️ **Interactive 3D Dashboard**: A premium Next.js UI using `react-globe.gl` and `recharts` to fetch, render polygons, and plot predictive trend charts natively.
- 🧭 **Geometries Returned**: Backend emits flood polygon coordinates for direct rendering on the globe (no synthetic shapes).

---

## 🏗️ Architecture Stack

The application uses an **On-Demand API Architecture** split into two heavily interconnected layers:

### 1. The Backend (`/src`) - Python / FastAPI
- **`api.py`**: The high-speed controller logic. Handles CORS, receives coordinate points from the frontend, manages the local SQLite history state, and formats the extensive JSON risk response.
- **`gee_analysis.py`**: The core geospatial intelligence module. It governs Earth Engine, creates 10km radius Regions of Interest (ROI), executes the MNDWI algorithms over `ImageCollections`, reduces pixels to sums, builds `FeatureCollection` vector polygons over the expansion masks, and classifies the final Risk logic.

### 2. The Frontend (`/dashboard`) - Next.js / React / Tailwind
- Features heavily customized premium glassmorphism aesthetics.
- Features an interactive 3D Globe with MapLibre to intercept vector coordinates.
- Decodes backend bounding boxes and draws multi-polygons directly over the 3D terrain to visualize impacted areas.

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.9+**
- **Node.js v18+**
- A **Google Cloud Project** with the **Earth Engine API** enabled. Ensure your Google account is registered for Earth Engine access.

### 1. Backend Setup 

Navigate to the project root and install the dependencies:

```bash
# Create a virtual environment
python -m venv .venv

# Activate it
source .venv/bin/activate  # on Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Authenticate your local machine with Google Earth Engine:
```bash
earthengine authenticate
```
Export environment variables (recommended):
```bash
export GEE_PROJECT=your-gcp-project
export ALLOWED_ORIGINS=http://localhost:3000
```

Run the FastAPI server:
```bash
uvicorn src.api:app --reload
```
*The backend API will start on `http://127.0.0.1:8000`*

### 2. Frontend Setup 

Open a new terminal and navigate to the `/dashboard` directory:

```bash
cd dashboard

# Install necessary node packages
npm install

# Run the development server
npm run dev
```
*The interactive dashboard will start on `http://localhost:3000`*

---

## 🎯 Usage Instructions
1. Open `http://localhost:3000` in your browser.
2. The initial loading screen will simulate fetching global connections before fading into the interactive UI.
3. Once the 3D globe loads, click on any coastal line, river basin, or city worldwide. 
4. Press **"START SCANNING"** on the bottom navigation control bar.
5. The dashboard will trigger the Python backend, forcing Earth Engine to process gigabytes of raw satellite memory live in the cloud. It will return the full analysis arrays (Areas, Risks, Polygons, Elevation, Trends) natively back to the screen within ~20 seconds.

---

## 📡 API Reference

### `POST /api/analyze-location`

Triggers the dynamic GEE pipeline for a specific coordinate.

**Request Body:**
```json
{
  "lat": 19.076,
  "lng": 72.877
}
```

**Response Example:**
```json
{
  "risk_level": "HIGH",
  "past_water_km2": 29.222,
  "recent_water_km2": 43.252,
  "water_expansion_km2": 14.030,
  "expansion_percentage": 48.01,
  "reasons": [
    "Large water expansion detected (+48.0%).",
    "Water surface increased by 14.03 km² across the 314.16 km² analysis zone.",
    "The location is low-lying (Avg Elevation: 14.7m), exacerbating flood risk."
  ],
  "elevation_m": 14.7,
  "exposed_population": 412500,
  "exposed_builtup_km2": 8.42,
  "coordinates": [
    [[72.81, 19.01], [72.82, 19.01], [72.82, 19.02], [72.81, 19.02], [72.81, 19.01]]
  ]
}
```
