import ee
ee.Initialize(project="gen-lang-client-0997797287")

lat, lng = 19.0760, 72.8777
point = ee.Geometry.Point([lng, lat])
roi = point.buffer(10000)

POP_DATASET = "CIESIN/GPWv411/GPW_Population_Count"
# Filter to 2020 image
pop_2020 = ee.ImageCollection(POP_DATASET).filterDate('2020-01-01', '2020-12-31').first()

# Calculate total population
pop_val = pop_2020.reduceRegion(
    reducer=ee.Reducer.sum(),
    geometry=roi,
    scale=1000,
    maxPixels=1e9
).getNumber('population_count').getInfo()

print("Population:", pop_val)

worldcover = ee.ImageCollection("ESA/WorldCover/v200").first()
builtup_mask = worldcover.eq(50)
builtup_area_img = builtup_mask.multiply(ee.Image.pixelArea())
builtup_area = builtup_area_img.reduceRegion(
    reducer=ee.Reducer.sum(),
    geometry=roi,
    scale=30,
    maxPixels=1e9
).getNumber('Map').getInfo()

print("Builtup Area (m2):", builtup_area)
