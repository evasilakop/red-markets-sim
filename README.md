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

## Implemented Rules (Phase 1)
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

## Success Criteria (for MVP)
- User can create a world, add cities, and see sector stats.
- Actions and ticks update supply/demand and equilibrium, with CHIPS/competition derived correctly.
- World can be exported to JSON and imported back with identical state.
- No server required; data persists locally between sessions.


## Persistence (IndexedDB via Dexie)

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

# Import/Export (world JSON format)

## Purpose
- Move a world (and all its cities/sectors) between devices or back it up.
- Keep data local-first while providing a portable bundle.

## Bundle structure
- Top-level JSON object:
    - version: integer (starts at 1)
    - world: { id, name, createdAt, notes? }
    - cities: array of city objects
        - City fields: { id, worldId, name, lat?, lon?, boundary?, lastTick, metadata? }
    - sectors: array of sector objects
        - Sector fields: { id, cityId, type, supply, demand, equilibrium, startingChips, competitionUndercutDice, priceIndex?, priceIndexSource?, updatedAt }
- Notes:
    - IDs are preserved to maintain relationships (worldId/cityId).
    - Sector uniqueness: one per [cityId, type].
    - History snapshots are excluded by default to keep bundles small (optional setting later).
    - Optional fields may be absent; defaults apply on import.

### Example shape (abbreviated)
{
"version": 1,
"world": { "id": "uuid", "name": "My World", "createdAt": 1720000000000 },
"cities": [
{ "id": "uuid", "worldId": "uuid", "name": "Kansas City", "lastTick": 1720000000000 }
],
"sectors": [
{ "id": "uuid", "cityId": "uuid", "type": "FOOD & WATER", "supply": 52, "demand": 47, "equilibrium": "SUBSIDIARY", "startingChips": 3, "competitionUndercutDice": -3, "updatedAt": 1720000000000 }
]
}

## User flow

### Export
- In the app, open a world and click “Export World.”
- A .json file is downloaded containing version, world, cities, sectors.
- Store it safely; you can later import it to restore your world.
- Optional (future): “Export with history” includes snapshots and may be large.

### Import
- Click “Import World,” select a .json bundle.
- The app validates the bundle (version, required fields) and writes it to local storage.
- If a world with the same id exists, it is updated/overwritten (document policy here).
- After import, select the world from the list to continue.

### Warnings and privacy
- Local storage: Worlds live in your browser’s IndexedDB. Clearing site data or using private/incognito modes may erase them.
- Backups: Export regularly if you care about your data.
- Privacy: Bundles contain only your simulation data; no external accounts or secrets.

### Versioning and future migration
- The bundle includes a version field (starting at 1).
- On import:
    - If version == current: import as-is.
    - If version < current: run migration steps (fill defaults for new fields, normalize formats).
    - If version > current: reject or prompt to update the app (document behavior).
- Schema evolution policy:
    - Prefer additive changes (new optional fields with defaults).
    - Document migration steps in README (Changelog or Data versioning section) and bump bundle version when structure changes.

## Web Worker integration plan

### Purpose
Move simulation compute (apply actions, tick sectors) to a background Web Worker thread to keep the UI responsive, especially when processing many cities or sectors simultaneously.

### Message contract
The worker uses a simple request/response pattern via postMessage:

**Request messages (main thread → worker):**
```ts
type ApplyActionsMsg = {
  type: 'applyActions';
  sectors: Sector[];
  actions: Record<SectorType, UserAction[]>; // actions grouped by sector type
};

type TickMsg = {
  type: 'tick';
  sectors: Sector[];
};

type Msg = ApplyActionsMsg | TickMsg;
```

**Response messages (worker → main thread):**
```ts
type ResultMsg = {
  type: 'result';
  sectors: Sector[]; // updated sectors with new supply/demand/equilibrium/derived fields
};

type ErrorMsg = {
  type: 'error';
  message: string;
};

type WorkerResponse = ResultMsg | ErrorMsg;
```

### Data flow
1. UI collects current sectors from IndexedDB
2. UI posts message to worker with sectors + requested operations
3. Worker applies pure simulation functions (applyActionToSector, tickSector)
4. Worker posts back updated sectors
5. UI bulk-writes updated sectors to IndexedDB and refreshes display

### UI/UX during worker operations
**Busy state indication:**
- Disable action buttons and tick button during worker operations
- Show "Simulating..." text or spinner next to disabled controls
- Prevent multiple concurrent worker requests per city

**Error handling:**
- Worker communication timeout (5-10 seconds max)
- Display user-friendly error message: "Simulation failed. Please try again."
- Log detailed errors to console for debugging
- Fallback: retry once, then disable worker and show error state

**Loading states:**
- Per-city busy state (if tickAll is added later, can tick some cities while others are busy)
- Visual feedback: button text changes to "Processing..." and gets disabled
- Preserve user input (selected action, magnitude) during processing

### Worker implementation notes
- Keep simulation functions pure: no IndexedDB access, no DOM manipulation
- Worker imports types.ts and sim.ts functions directly
- Use structured cloning for message payloads (sectors serialize cleanly)
- Worker is stateless between requests (no persistent data)

### Phase 2 extensions
- **tickAll message**: tick multiple cities atomically
- **Batch operations**: apply actions to multiple sectors in one worker call
- **Progress updates**: for long-running operations, send intermediate progress messages

### Browser compatibility
- Modern browsers support Web Workers and structured cloning
- Vite bundles workers correctly using `new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' })`
- Graceful degradation: if worker fails to load, fall back to main-thread simulation

### Testing approach
- Unit test worker message handling separately from UI
- Integration test: compare worker results vs direct function calls (should be identical)
- Error simulation: test worker timeout and communication failure scenarios