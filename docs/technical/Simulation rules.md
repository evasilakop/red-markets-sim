# Simulation rules

## Objectives

- Convert per-sector supply and demand into a stable market state (equilibrium) for each city.
- Derive starting CHIPS and competition undercut dice from the equilibrium (for negotiation setup).
- Apply user actions and minor ambient noise to evolve markets over time.

## State per sector

- Inputs: supply (0–100), demand (0–100)
- Derived:
  - equilibrium: FLOODED | VOLATILE | SUBSIDIARY | SCARCE
  - startingChips: integer (Flooded=2, Volatile=0, Subsidiary=3, Scarce=1)
  - competitionUndercutDice: integer (Flooded=-2, Volatile=0, Subsidiary=-3, Scarce=-1; 0 means “no competition”)
- priceIndex (user defined; display-only; not part of rules)
  
## Equilibrium derivation (Threshold Model)

Since the official *Red Markets* rules present states via a Supply/Demand chart rather than explicit mathematical formulas, the engine uses a **Threshold Model** to map continuous Supply/Demand values (0–100) to the four discrete equilibrium states.

- **Normalization:** Convert inputs to scale $[0, 1]$ where $S = \text{supply}/100$ and $D = \text{demand}/100$.
- **Core Thresholds:**
  - **HIGH band:** $\ge 0.60$
  - **LOW band:** $< 0.40$
  - **MID band:** $0.40 \le \text{value} < 0.60$

### Primary State Mapping
The primary state is determined by the intersection of supply and demand bands:

| State          | Supply Condition    | Demand Condition    | PDF Alignment             |
|:---------------|:--------------------|:--------------------|:--------------------------|
| **FLOODED**    | $S \ge \text{HIGH}$ | $D < \text{LOW}$    | High Supply / Low Demand  |
| **VOLATILE**   | $S \ge \text{HIGH}$ | $D \ge \text{HIGH}$ | High Supply / High Demand |
| **SUBSIDIARY** | $S < \text{LOW}$    | $D < \text{LOW}$    | Low Supply / Low Demand   |
| **SCARCE**     | $S < \text{LOW}$    | $D \ge \text{HIGH}$ | Low Supply / High Demand  |

### Tie-breaker (Mid-range Stabilization)
To prevent "state jitter" when values hover near thresholds, a tie-breaker applies when values fall into the **MID band** or don't meet primary conditions:

1. **Calculate Difference:** $\text{diff} = S - D$.
2. **Significant Drift:**
   - If $\text{diff} > +0.10 \rightarrow$ **FLOODED**
   - If $\text{diff} < -0.10 \rightarrow$ **SCARCE**
3. **Fallback (Stagnation/Activity):** If the difference is minimal ($|\text{diff}| \le 0.10$):
   - **Keep Previous State:** To maintain stability during minor fluctuations.
   - **Initial State Bias:** If no previous state exists:
     - If $(S + D)/2 \ge 0.50 \rightarrow$ **VOLATILE** (Active market)
     - Else $\rightarrow$ **SUBSIDIARY** (Stagnant market)

## Action effects

- Supply-focused
  - INCREASE_SUPPLY, SUBCONTRACT: increase supply (moderate)
  - REDUCE_SUPPLY, RESTRICT_FLOW, SABOTAGE: decrease supply (stronger)
- Demand-focused
  - INCREASE_DEMAND, MARKET: increase demand (moderate)
  - PRICE_LOW: increase demand (small)
  - DECREASE_DEMAND: decrease demand (moderate)
  - SPECULATE: increase demand (strong; may snap back later)
- Competition (optional in MVP)
  - ELIMINATE_COMPETITION: moves competitionUndercutDice toward 0 (no competition) in small steps; does not change supply/demand directly
- Magnitude: user sets 0–10; effects scale linearly (tunable constants below)

## Ambient noise and shocks

- Per update: add small random drift to both supply and demand (e.g., −2..+2 absolute points; clamp to [0,100])
- Speculation snapback: optional 10% chance to reduce demand by a fixed amount after SPECULATE
- Macro shocks (Phase 2): occasional city-wide events (e.g., logistics strain → supply −8 across sectors)

## Update cycle (per user action or tick)

1. Read current sector state (supply, demand, equilibrium)
2. Apply all user actions (clamp supply/demand to [0,100])
3. Apply ambient noise (and any event-driven shocks)
4. Derive new equilibrium (using the threshold model and tie-breaker)
5. Update derived fields:
    - startingChips based on equilibrium
    - competitionUndercutDice based on equilibrium (and adjust per ELIMINATE_COMPETITION if used)
6. Persist sector updates; record lastTick on the city

### Parameters

Tunable constants; choose initial values and document changes.

- Thresholds:
  - HIGH = 0.60
  - LOW = 0.40
  - Mid diff bands: ±0.10
- Action deltas (example scales per magnitude “m”):
  - Increase supply: +3 × m
  - Decrease supply: −4 × m
  - Increase demand (market): +3 × m
  - Decrease demand: −3 × m
  - Price low: +2 × m
  - Speculate: +4 × m; snapback −10 (10% chance)
- Ambient noise: random integer drift −2..+2 each for supply and demand
- Competition adjustment (if ELIMINATE_COMPETITION): +1 die toward zero per 5 magnitude (capped at 0)

## Validation and constraints

- Clamp supply and demand after every operation to [0, 100]
- Ensure sector uniqueness per city: one sector of each type
- Price index is not derived; users set it manually. The engine only derives equilibrium, CHIPS, and competition.
- Document any parameter changes (versioned in README or a config file)

## Design notes

- **Stability first**: tie-breaker keeps sectors from flipping states when values hover mid-range
- **Sim engine purity**: treat the engine as a pure function over sector inputs; no direct I/O
- **Display-only price index**: clarify it’s a visualization aid, not a game rule

## Roadmap hooks (Phase 2)

- Equilibrium-gated actions: restrict available actions based on current state (e.g., encourage scarcity tactics in FLOODED)
- Macro events: city-wide shocks that modulate supply/demand per sector
- Deterministic RNG: seedable PRNG for reproducible ticks; persist seed per world/city
- Inter-city effects: couple transport/energy/material sectors between nearby cities for advanced scenarios