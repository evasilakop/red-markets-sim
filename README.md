# MVP scope and rules coverage

Overview
- Goal: A client-only React app that simulates Red Markets city economies locally per user. Users can create “worlds,” add cities, view per-sector supply/demand, apply actions, advance time, and import/export their world as JSON. No login or server.

MVP Scope (Phase 1)
- Worlds
  - Create/select/delete local worlds (IndexedDB storage).
  - Import/export a world as a single JSON file.
- Cities
  - Add/delete cities within a world.
  - Each city has 10 sectors: Food/Water, Shelter, Material, Products, Energy, Medicine, Speculative, Transportation, Data, HR.
- Sectors (per city)
  - Display supply (0–100), demand (0–100), equilibrium state, starting CHIPS, competition undercut dice, and a display-only price index.
  - User actions per sector with magnitude (0–10): Market, Increase/Decrease Demand, Price Low, Speculate, Increase Supply, Subcontract, Reduce Supply, Restrict Flow, Sabotage.
- Simulation
  - Apply actions and advance time (tick) to update sector state.
  - Ambient noise each update to simulate minor fluctuations.
- UX
  - Sector table with supply/demand bars and key stats.
  - Action selector + magnitude input.
  - Tick button (advance time).
  - Basic confirmations for destructive actions.

Implemented Rules (Phase 1)
- Equilibrium states (derived from supply/demand):
  - Flooded, Volatile, Subsidiary, Scarce.
- Derivations from equilibrium:
  - Starting CHIPS (standard sector): Flooded=2, Volatile=0, Subsidiary=3, Scarce=1.
  - Competition (undercut dice): Flooded=-2d10, Volatile=no competition, Subsidiary=-3d10, Scarce=-1d10.
- Action effects (simplified):
  - Supply modifiers: Increase Supply/Subcontract (+), Reduce Supply/Restrict Flow/Sabotage (-).
  - Demand modifiers: Market/Increase Demand/Price Low/Speculate (+), Decrease Demand (-).
- Ambient noise and tie-breakers:
  - Small random drift per update.
  - Tie-breaker to avoid jitter when supply/demand are “mid-range.”

Out of Scope (Phase 2)
- Equilibrium-gated actions (restricting which actions are valid per state).
- Macro events (e.g., crises, subsidies, logistics shocks) and inter-city effects.
- Deterministic RNG seed per world/city (reproducible ticks).
- Background scheduled ticks (global “tick all” cadence).
- Map view or geographic visualization.
- PWA offline caching (service worker).
- Authentication or cloud sync.
- Detailed pricing/negotiation mechanics beyond CHIPS/competition display.

Assumptions and Constraints
- Single-user, local-first app: data stored in IndexedDB per browser/profile.
- Desktop browsers (Chrome/Edge/Firefox) as primary target; mobile is secondary.
- Performance target: 50+ cities × 10 sectors remains responsive using a Web Worker and batched writes.
- House-rule price index is for display only; actual pricing/negotiation is out of scope.

Success Criteria (for MVP)
- User can create a world, add cities, and see sector stats.
- Actions and ticks update supply/demand and equilibrium, with CHIPS/competition derived correctly.
- World can be exported to JSON and imported back with identical state.
- No server required; data persists locally between sessions.

Acceptance (for Ticket 1)
- README contains the sections above and clearly delineates MVP vs Phase 2.
- The Implemented Rules list matches the simplified mechanics planned for Phase 1.

# Real-world seeding (future feature)

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
- OpenStreetMap: https://www.openstreetmap.org
- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
- OSM Boundaries: https://osm-boundaries.com/
- Nominatim (geocoding): https://nominatim.org/release-docs/latest/api/Search/
- World Bank Data API: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-api-documentation
- GeoNames: https://www.geonames.org/export/
