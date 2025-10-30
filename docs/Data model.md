# Data model

Goals
- Keep entities simple, portable, and storage-agnostic (works with IndexedDB now; REST/GraphQL later).
- Use stable IDs and explicit relationships.
- Include a version for future migrations.

## Entities
- **World**
  - id: string (UUID v4)
  - name: string (1–80 chars)
  - createdAt: ISO 8601 string
  - notes/description: optional string (free-form)
- **City**
  - id: string (UUID v4)
  - worldId: string (FK → World.id)
  - name: string (1–120 chars)
  - lat?: number (WGS84 latitude), lon?: number (longitude)
  - boundary?: GeoJSON Polygon/Multipolygon serialized as JSON (future seeding)
  - lastTick: ISO 8601 string
  - metadata?: object (provider/source info; future seeding provenance)
- **Sector**
  - id: string (UUID v4)
  - cityId: string (FK → City.id)
  - type: SectorType (one per city; unique [cityId, type])
  - supply: integer (0–100)
  - demand: integer (0–100)
  - equilibrium: Equilibrium
  - startingChips: integer (derived from equilibrium)
  - competitionUndercutDice: integer (e.g., -3, -2, -1, 0; 0 means “no competition”)
  - priceIndex?: number (display-only multiplier; house rule)
  - updatedAt: ISO 8601

## Enumerations
- SectorType
  - FOOD_WATER, SHELTER, MATERIAL, PRODUCTS, ENERGY, MEDICINE, SPECULATIVE, TRANSPORTATION, DATA, HR
- Equilibrium
  - FLOODED, VOLATILE, SUBSIDIARY, SCARCE

## Actions
- INCREASE_SUPPLY, SUBCONTRACT
- REDUCE_SUPPLY, RESTRICT_FLOW, SABOTAGE
- INCREASE_DEMAND, MARKET, PRICE_LOW
- DECREASE_DEMAND
- SPECULATE
- Optional later: ELIMINATE_COMPETITION (affects competition dice rather than S/D directly)
- ROLLBACK World-level Undo restores the previous snapshot atomically across all cities/sectors

## Relationships and constraints
- World 1—N City
- City 1—N Sector
- Unique sector per city per type: unique(cityId, type)
- Sector fields supply/demand clamped to [0, 100]
- Derivations are not user-editable: equilibrium, startingChips, competitionUndercutDice, priceIndex
- City.lat/lon and boundary are optional, reserved for future real-world seeding

## Validation rules
- Names: trim; disallow empty; soft max lengths (World 80, City 120)
- Numbers: integers where applicable; clamp supply/demand to [0, 100]
- Enums: must be one of the defined values
- Referential integrity: worldId/cityId must exist when creating cities/sectors
- Import: validate bundle version; reject unknown enum values or missing required fields; default optional fields

## Versioning and migration
- Export bundle includes version: integer starting at 1
- If schema changes, bump version and add a simple migration note (e.g., derive new field on import if missing)
- Keep DTOs stable; add fields with defaults rather than renaming where possible

## Storage mapping
- IndexedDB (now)
  - Tables: worlds (id PK), cities (id PK, worldId index), sectors (id PK, cityId+type unique)
  - Bulk operations for sectors to keep writes efficient
- API (future)
  - DAL can mirror the same shapes; endpoints or resolvers operate on World/City/Sector DTOs
  - Keep the client-side model unchanged to swap storage backends

## Glossary
- Starting CHIPS: per Red Markets rules, derived from equilibrium; used for contract negotiation setup
- Competition undercut dice: negative dice representing market competition penalty; 0 means no competition
- Price index: display-only multiplier to visualize relative price pressure; not a rules artifact
- Or start scaffolding the project and implement the data layer exactly to this model, then the simulation engine.

If you want, I can draft the Simulation rules section next (short and precise, ready to paste).
