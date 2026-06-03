# System Architecture: Red Markets Companion

## 1. High-Level Overview
The application is a market simulation based on a hierarchical data model: **World $\rightarrow$ City $\rightarrow$ Sector**. The architecture follows a strict layered approach to separate data persistence, business logic (simulation), and the reactive UI.

## 2. Layered Architecture

### 2.1 Data Layer (Persistence)
- **Technology:** Dexie.js (IndexedDB wrapper).
- **Schema:**
  - `worlds`: Top-level containers.
  - `cities`: Linked to a world via `worldId`.
  - `sectors`: Linked to a city via `cityId`.
- **Responsibility:** Pure CRUD operations and transactional integrity.

### 2.2 Service Layer (Business Logic)
To prevent "God Objects," the business logic is split by responsibility:

#### **WorldService (The Orchestrator)**
- **Scope:** Macro-level lifecycle.
- **Responsibilities:**
  - World creation, listing, and deletion.
  - World import/export (JSON bundles).
  - Orchestrating cascading deletes (calling `CityService` to wipe a world's cities).

#### **CityService (The Manager)**
- **Scope:** Micro-level city and sector operations.
- **Responsibilities:**
  - City creation and sector initialization.
  - City-level data retrieval (e.g., `getCityData` for hooks).
  - Persisting simulation updates (ticks and user actions).

#### **Simulation Engine (`sim.ts`)**
- **Scope:** Pure functional logic.
- **Responsibilities:**
  - Calculating supply/demand shifts based on `UserAction` and coefficients.
  - Deriving market equilibrium (FLOODED, VOLATILE, etc.).
  - Generating ambient market noise.
- **Constraint:** Must remain pure; it does not touch the DB directly.

### 2.3 Interface Layer (UI/Hooks)
- **State Management:** Reactive queries via `dexie-react-hooks`.
- **Hooks:** Specialized hooks (e.g., `useCityData`) act as a bridge between the UI and `CityService`, ensuring the UI never interacts with the DB instance directly.
- **Components:** Divided into World management, City management, and the Simulation Dashboard.

## 3. Key Design Decisions

### 3.1 Dependency Flow
To avoid circular dependencies, the system follows a one-way flow:
`UI Components` $\rightarrow$ `Hooks` $\rightarrow$ `World/City Services` $\rightarrow$ `Simulation Engine` $\rightarrow$ `DB`.

### 3.2 Transactional Integrity
Operations that touch multiple tables (e.g., adding a city and its 10 sectors) are wrapped in `db.transaction` blocks. The `WorldService` typically owns the transaction boundary for world-level deletions to ensure atomicity.

### 3.3 Centralized Constants
All system limits (e.g., `MAX_SUPPLY`, `MAX_MAGNITUDE`) are housed in `common/constants.ts`. The simulation engine strictly consumes these constants to ensure rulebook consistency across the application.

## 4. Future evolution paths

- Replace React local state with a global state management solution (Zustand/Redux Toolkit) as complexity grows.
- Integrate optional real-world seeding via OSM/World Bank (documented separately).