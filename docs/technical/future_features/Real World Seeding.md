# Real-world seeding

Overview

- Goal: Quickly bootstrap a “starting world” using real cities and open data. Pick a city, and the app seeds sector supply/demand from public datasets so you can play in a recognizable setting.

Data sources

- OpenStreetMap (OSM): points of interest and infrastructure (e.g., hospitals, supermarkets, power stations, stations/airports).
  - Overpass API for querying features
- OSM Boundaries: administrative polygons (city/municipality shapes)
- World Bank API: country-level indicators (population, GDP per capita, urbanization, health) to shape macro demand/supply baselines

How it would work (high level)

- City discovery: Search by name and fetch coordinates/boundaries (Nominatim or GeoNames).
- Boundary and POIs: Get city polygon and count sector-relevant OSM features within it.
- Macro indicators: Pull World Bank metrics for the city’s country.
- Seeding heuristic: Convert population/density and POI counts into initial supply/demand (0–100) per sector, then derive equilibrium, CHIPS, and competition using the existing rules.

Why this helps

- Fast setup: Create playable, recognizable worlds in minutes.
- Replay variety: Different cities naturally seed different market conditions.
- Extensible: Keep logic behind a CitySeedService interface so we can swap providers or add a server pre-aggregator later.

Notes and constraints

- Rate limits: Nominatim/Overpass have usage policies; we’ll cache locally and throttle requests.
- Licensing and attribution: OSM data is ODbL 1.0; attribution required. World Bank/GeoNames require attribution; see Credits section.
- Fallbacks: If boundaries/POIs are sparse, we’ll default to population-based baselines.

References

- OpenStreetMap: <https://www.openstreetmap.org>
- Overpass API: <https://wiki.openstreetmap.org/wiki/Overpass_API>
- OSM Boundaries: <https://osm-boundaries.com/>
- Nominatim (geocoding): <https://nominatim.org/release-docs/latest/api/Search/>
- World Bank Data API: <https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-api-documentation>
- GeoNames: <https://www.geonames.org/export/>
