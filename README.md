# MVP scope and rules coverage

### Overview
- Goal: A client-only React app that simulates Red Markets city economies locally per user. Users can create “worlds,” add cities, view per-sector supply/demand, apply actions, advance time, and import/export their world as JSON. No login or server.

## MVP Scope (Phase 1)
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

### Implemented Rules (Phase 1)
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

## Out of Scope (Phase 2)
- Equilibrium-gated actions (restricting which actions are valid per state).
- Macro events (e.g., crises, subsidies, logistics shocks) and inter-city effects.
- Deterministic RNG seed per world/city (reproducible ticks).
- Background scheduled ticks (global “tick all” cadence).
- Map view or geographic visualization.
- PWA offline caching (service worker).
- Authentication or cloud sync.
- Detailed pricing/negotiation mechanics beyond CHIPS/competition display.

## Assumptions and Constraints
- Single-user, local-first app: data stored in IndexedDB per browser/profile.
- Desktop browsers (Chrome/Edge/Firefox) as primary target; mobile is secondary.
- Performance target: 50+ cities × 10 sectors remains responsive using a Web Worker and batched writes.
- House-rule price index is for display only; actual pricing/negotiation is out of scope.

# Success Criteria (for MVP)
- User can create a world, add cities, and see sector stats.
- Actions and ticks update supply/demand and equilibrium, with CHIPS/competition derived correctly.
- World can be exported to JSON and imported back with identical state.
- No server required; data persists locally between sessions.


# Persistence (IndexedDB via Dexie)

### Storage approach
- Local, per-browser storage using IndexedDB (wrapped by Dexie for a simpler API and transactions).
- Scope: data is private to the user’s device/profile. Export/Import bundles move worlds across machines.
- Sources: MDN IndexedDB, Dexie docs

### Schema summary (tables, keys, indexes)
- Worlds
    - Fields: id (PK), name, createdAt, notes
    - Indexes: id (primary)
- Cities
    - Fields: id (PK), worldId (FK), name, lat?, lon?, boundary?, lastTick, metadata?
    - Indexes: id (primary), worldId (to query by world), name (optional for sorting)
- Sectors
    - Fields: id (PK), cityId (FK), type (enum), supply (0–100), demand (0–100), equilibrium (enum), startingChips, competitionUndercutDice, priceIndex, priceIndexSource ('user' | 'inferred'), updatedAt
    - Indexes: id (primary), cityId (to query by city), unique composite [cityId, type] (one sector of each type per city)

### Optional (future) tables
- WorldSnapshots (for per-world undo/rollback timeline)
    - Fields: id (PK), worldId, timestamp, label, payloadJSON (compact bundle of cities and sectors)
    - Indexes: worldId (query snapshots per world), timestamp
- Settings
    - Fields: id (PK), worldId, feature flags (e.g., “inferPriceIndex”), retention limits (e.g., snapshot count)

### Transactions (create/delete/bulk updates)
- Create world:
    - Transaction: add world → commit
- Add city:
    - Transaction: add city, add its 10 sectors (bulk) → commit
- Delete city:
    - Transaction: delete all sectors for city, delete city → commit
- Delete world:
    - Transaction: delete all sectors for all cities in world, delete cities, delete world → commit
- Bulk sector updates (actions/tick):
    - Transaction: update many sectors (bulk), update city.lastTick → commit
- Restore world snapshot (if using timeline):
    - Transaction: replace all cities/sectors for the world with snapshot payload; record “after restore” snapshot → commit

## Operational policies
- Clamping and validation:
    - Enforce sector uniqueness per [cityId, type]
    - Clamp supply/demand to [0, 100] before writes
    - Derived fields (equilibrium, startingChips, competition) updated by the simulation layer; not user-editable
- Retention:
    - Keep only the last N snapshots per world (e.g., 20–50); prune FIFO
- Performance:
    - Prefer bulk operations for sector writes (apply actions/ticks, restores)
    - Query by worldId/cityId indexes to avoid full scans
- Import/Export:
    - Export bundle: { version, world, cities[], sectors[] } (no history by default)
    - Import validates version and required fields; writes in a transaction

### Migration and versioning strategy
- Bundle version
    - Include a version integer in export bundles (start at 1)
    - On import: check version; if older/newer, run migration steps or reject with a clear message
- Schema evolution
    - Prefer additive changes (add new optional fields with defaults)
    - Avoid renaming/removing fields; if needed, migrate on read/import
- Migration examples
    - Adding priceIndexSource:
        - If missing, set to 'user' when priceIndex exists, else null
    - Introducing visited semantics (explicit flag later):
        - If City.visited missing, derive visited=false by default; visited=true if any sector has user-set priceIndex
    - Normalizing timestamps:
        - If lastTick format changes, convert to epoch ms on import
- Documentation and tracking
    - Record schema changes and migration steps in README (Changelog or “Data versioning” section)
    - Bump bundle version when the import/export structure changes

### Attribution and privacy
- IndexedDB data lives on the user’s device; clearing site data deletes it
- Provide Export guidance in the UI; Import restores worlds from JSON files
- If real-world seeding is used later, store source metadata in City.metadata and include it in exports for transparency