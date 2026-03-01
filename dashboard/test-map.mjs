import maplibregl from "maplibre-gl";

const map = new maplibregl.Map({
    container: document.createElement('div'),
    style: { version: 8, sources: {}, layers: [] },
});
try {
    map.setProjection({ type: 'mercator' });
    console.log("mercator accepted");
} catch (e) {
    console.log("mercator failed:", e.message);
}
