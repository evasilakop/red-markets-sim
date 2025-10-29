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
