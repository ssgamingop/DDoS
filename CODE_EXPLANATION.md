# Comprehensive Code Explanation: Flood Risk Intelligence Engine

This document is a complete, simple-English walkthrough of every single piece of the **Flood Risk Intelligence Engine** codebase. 

Whether you are a beginner, a non-technical stakeholder, or a developer joining the project, this guide will explain *what* the code does, *why* it does it, and *how* the different parts talk to each other.

---

## 1. The Big Picture: What Are We Building?

At its core, this project is designed to **detect and predict flood risks anywhere on Earth** using satellite imagery. 

Instead of waiting for news reports or relying on static maps, this application allows a user to click anywhere on a 3D digital globe. The moment they click:
1. The **Frontend (Dashboard)** sends the exact GPS coordinates (Latitude & Longitude) to the Backend.
2. The **Backend (Python)** takes those coordinates and asks **Google Earth Engine (GEE)**—a massive supercomputer in the cloud—to retrieve satellite photos of that exact spot from the past few years and the past few months.
3. The Backend runs complex math to detect **Water** in those images. It compares the "past" water to the "recent" water. If there is suddenly a lot more water, it means there is a **Flood Expansion**.
4. The Backend also checks how many people live there and the elevation.
5. Finally, the Backend sends all these calculations back to the Frontend, which draws a red warning shape directly on the 3D globe and creates charts explaining the danger level.

There are two main halves to this project:
- **The Python Backend (`/src`)**: The brain. It does the math, the Earth Engine communication, and the risk logic.
- **The Next.js Frontend (`/dashboard`)**: The face. It provides the beautiful dark-themed website, the interactive 3D globe, and the charts.

---

## 2. The Python Backend: The Brains (`/src`)

The backend is built using **FastAPI**, which is a modern, extremely fast web framework for building APIs in Python. 

### A. The API Server (`src/api.py`)
Think of `api.py` as a friendly receptionist at a building. 
- It stands at the front desk (running on `http://localhost:8000`).
- It has an endpoint called `POST /api/analyze-location`. When the frontend sends a message saying "Hey, look at Latitude 19.07, Longitude 72.87!", `api.py` accepts the message.
- It defines the structure of the data it receives (`LocationRequest`) and the structure of the response it will send back (`AnalysisResponse`).
- Once it gets a request, it calls the *real* worker behind the scenes: `gee_analysis.py`.
- After the heavy lifting is done, `api.py` saves a quick record of the event into a local SQLite database (using `src/database.py`) and returns the detailed risk data back to the frontend receptionist.

### B. The Google Earth Engine Analyst (`src/gee_analysis.py`)
This is where the magic happens. This file is the true core of the application. The code communicates with Google's satellite servers to calculate flood data *on the fly*.

Here is exactly what happens step-by-step inside `analyze_point_on_gee(lat, lng)`:

1. **Setting the Stage (ROI)**: 
   The code takes the `lat` and `lng` and draws a circle around it with a 10-kilometer radius. This is our `Region of Interest (ROI)`. We tell Google Earth Engine, "Only look at this 10km circle to save time and computer power."

2. **Fetching Satellite Images**: 
   The code looks for the `COPERNICUS/S2_SR_HARMONIZED` dataset, which represents the **Sentinel-2** satellite. It pulls two sets of images:
   - **Past Window**: Imagery from 1 to 5 years ago (to establish a "normal baseline").
   - **Recent Window**: Imagery from the last 12 months (to see the "current state").
   It applies strict filters to remove images that have too many clouds.

3. **Detecting the Water (MNDWI)**: 
   Satellites don't send "pictures of water." They send "Bands" of light, representing Red, Green, Blue, Near-Infrared, etc. 
   To find water, we use a mathematical formula called **MNDWI (Modified Normalized Difference Water Index)**. The formula is `(Green Band - SWIR Band) / (Green Band + SWIR Band)`. 
   Water absorbs Shortwave Infrared (SWIR) light but reflects Green light. So, if the math result is a high positive number, we are 100% sure the pixel is water, not a shadow or a dark building.

4. **Calculating the Expansion**:
   We now have a "Past Water Area" and a "Recent Water Area". The code subtracts the Past from the Recent. 
   - If Recent is much larger than Past, it flags an **expansion** (a flood).

5. **Who is in Danger? (Population & Infrastructure)**:
   - **Population Check**: It talks to another dataset (`CIESIN/GPWv411`) which is a map of global population. It overlays our new flood mask on top of the population map and counts exactly how many people live in the newly flooded area.
   - **Infrastructure Check**: It uses the `ESA/WorldCover` dataset, looking specifically for "Class 50" (which means Built-up/Urban environments like roads and houses). It calculates the square-kilometers of infrastructure swallowed by the flood.

6. **The Risk Engine (Elevation & Final Score)**:
   - It checks a topographical map (`USGS/SRTMGL1_003`) to find the average elevation. Water flows downhill. If the elevation is less than 30 meters above sea level, the risk is deemed much worse.
   - Finally, it assigns a Risk Level: **HIGH**, **MODERATE**, or **LOW**.

7. **Vectorizing the Flood for the Map**:
   The frontend needs precise coordinates to draw red warning shapes on the globe. Earth Engine processes the `reduceToVectors` command, which turns mathematical pixel masks into **GeoJSON MultiPolygons**. The backend sends these polygon coordinates safely back to the frontend.

### C. The Local State & Logging 
- **`src/database.py`**: A very simple SQLite file database. It just creates a table `risk_history` and logs every single scan's coordinates and final risk level. This is useful for auditing and keeping local history.
- **`src/logging_utils.py`**: A helper file that writes structured JSON logs into `output/logs.txt`. It gives developers a paper-trail of every step the API takes.

### D. The Offline Batch Pipeline (The Old/Alternative Way)
You will notice files like `run_pipeline.py`, `ingestion.py`, `preprocessing.py`, and `detection.py`. 
These represent a different, "offline" way of doing things. Instead of processing everything instantly on Google's cloud server, this pipeline actively downloads huge satellite image `.tif` files to your computer (`ingestion.py`), uses mathematical libraries like `numpy` and `scipy` to trace water on your local hardware (`detection.py`), and generates local TIFF maps. The dynamic API (`api.py`) is much faster and more modern, but this batch script is kept in the codebase as a structural foundation.

---

## 3. The Next.js Frontend: The Face (`/dashboard`)

The frontend is a web application written in **TypeScript** and **React**, built on top of the powerful **Next.js** framework. The styling is done with **Tailwind CSS**. It is designed to feel like a sci-fi hacker interface—dark, sleek, and highly interactive.

### A. The Master Controller (`dashboard/app/page.tsx`)
This is the main entry point to the webpage. 
- It holds the "State" of the application. It remembers where the user clicked (`selectedLocation`) and stores the risk data once it arrives from the backend (`data`).
- It has an initial animated loading screen of a wireframe globe.
- **`triggerScan()`**: This is the most important function here. When the user clicks the "Scan" button, this function uses JavaScript's `fetch()` to send an HTTP POST request to our FastAPI backend. When the backend replies 20 seconds later, this function catches the huge blob of JSON data, formats it into a neat TypeScript `FloodData` object, and sets it into the page's state. Once the state updates, React automatically redesigns all the panels to show the new data.

### B. The 3D Interactive Map (`dashboard/app/components/MapView.tsx`)
This handles the massive, spinning Earth.
- It uses a library called `maplibre-gl`.
- When the component loads, it literally renders a 3D Earth using ESRI satellite raster tiles.
- **Click Detection**: It listens for `map.on("click")`. If you click India, it grabs the latitude and longitude and passes it up to `page.tsx`.
- **Polygon Rendering**: Remember those complex GeoJSON `MultiPolygon` coordinates the backend sent us? This file intercepts them. It tells MapLibre to create a literal geometric shape (a `fill` layer) directly hugging the terrain of the Earth. If the risk is HIGH, it paints the polygon neon red.

### C. The Analytical Side Panels
To make the data understandable, `page.tsx` delegates rendering duties to three specific UI panels:
- **`LeftPanel.tsx`**: Displays the raw numbers (Total Area, Population, Elevation) and the "Risk Drivers" (The English sentences generated by the backend explaining why the AI chose that specific risk).
- **`RightPanel.tsx`**: Uses a charting library called `recharts`. It draws beautiful, interactive graphs. It includes an `AreaChart` showing how water has grown over time, a `BarChart` comparing Flood Area vs. Urban Exposure, and a complex `RadarChart` mapping out severity factors.
- **`TopBar.tsx`**: A simple navigation header containing a Geocoding search bar. If you type "Paris", it pings OpenStreetMap to convert "Paris" into numerical latitude/longitude coordinates instantly.
- **`BottomBar.tsx`**: The control console containing the big, pulsating "START SCANNING" button.

### D. CSS and Visuals (`dashboard/app/globals.css`)
This project uses **Glassmorphism**. You'll see classes like `glass-panel` which apply translucent black backgrounds blurred over the map (`backdrop-blur-md`). This guarantees that no matter where the spinning globe is, the user interface remains legible and stunning. It dynamically changes CSS variables (`--risk-low`, `--risk-high`) depending on the danger level to color-code the entire website seamlessly.

---

## Summary of the Full Lifecycle ♻️
1. You open the frontend (`localhost:3000`).
2. You click on a river on the 3D globe. The `MapView.tsx` catches the Lat/Lng.
3. You press `Start Scan`. The frontend `page.tsx` fires a network request to `localhost:8000/api/analyze-location`.
4. The Python backend's `api.py` receives it and triggers `gee_analysis.py`.
5. `gee_analysis.py` connects to Google servers, grabs 5 years of satellite multispectral imagery, calculates MNDWI, intercepts built-up city infrastructure, queries SRTM elevation, bounds the coordinates, and creates a risk profile.
6. The JSON payload rushes back to the Frontend.
7. The Frontend state updates. The `RightPanel` and `LeftPanel` animate their charts to life, displaying exactly how many thousands of people are in danger.
8. The `MapView` extracts the geographic vector shapes and paints terrifying, realistic red flood zones perfectly aligned onto the earth's terrain. 

You have now analyzed the live Earth from space in exactly 20 seconds.
