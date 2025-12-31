This is the most "heavy" operation because it affects **every sector** in the city simultaneously and updates the city's timestamp.

### The Process Graph

```mermaid
sequenceDiagram
    participant User
    participant Dash as CityDashboard.tsx
    participant Worker as Web Worker
    participant Logic as sim.ts
    participant DB as IndexedDB

    User->>Dash: Clicks "Advance Time (Tick)"
    Dash->>Dash: Set Button Loading State

    Dash->>Worker: postMessage({ type: 'tick', sectors: [...] })

    rect rgb(255, 250, 240)
        note right of Worker: Simulation
        Worker->>Worker: Loop through ALL 10 sectors
        
        loop Every Sector
            Worker->>Logic: tickSector(sector)
            Logic->>Logic: Apply Ambient Noise (+/- random)
            Logic->>Logic: Re-derive Equilibrium
        end
        
        Worker-->>Dash: Return Updated Sectors
    end

    rect rgb(240, 255, 240)
        note right of Dash: Atomic Transaction
        Dash->>DB: db.transaction('rw', sectors, cities)
        
        par Writes
            DB->>DB: Bulk Put (10 Sectors)
            DB->>DB: Update City.lastTick (Timestamp)
        end
    end

    DB-->>Dash: Transaction Complete
    Dash->>Dash: Clear Loading State
    
    note over Dash: LiveQuery updates UI & Timestamp
```

---

### Step-by-Step Breakdown

#### 1. User Interaction
*   **Location:** `CityDashboard.tsx`
*   User clicks the **"Advance Time"** button.
*   The button immediately shows a spinner (`loading={busy}`) because `useSimWorker` sets `busy = true`.

#### 2. Worker Execution
*   **Location:** `sim.worker.ts`
*   The worker receives the `tick` command.
*   It iterates through the array of 10 sectors.
*   It calls `tickSector()` on each one.
    *   **Noise:** Adds random drift (e.g., Supply +1, Demand -2).
    *   **Equilibrium:** Checks if the drift pushed any sector into a new state.

#### 3. Database Transaction (Atomic Update)
*   **Location:** `CityDashboard.tsx` -> `db.transaction`
*   This is the critical difference from "Apply Action".
*   We open a transaction that writes **two things**:
    1.  The **Sectors** (The simulation result).
    2.  The **City** (We update `lastTick` to `Date.now()`).
*   *Why Transaction?* We don't want the timestamp to update if the sector write fails (or vice versa). They must happen together to represent a coherent "Turn."

#### 4. Reactivity
*   **Location:** `useCityData.ts`
*   Dexie detects changes in *both* tables.
*   React re-renders.
    *   The "Last Update" text in the header changes to the current time.
    *   The bars wiggle slightly due to the noise.