# Architecture

Stack and app type
- Framework: **React** + **TypeScript**
  - Rationale: Industry-standard, strong ecosystem; TS adds type safety and maintainability.
  - Sources: React docs (react.dev/learn), TypeScript docs (typescriptlang.org/docs)
- Build tool: **Vite**
  - Rationale: Fast dev server, great TS support, simple Web Worker bundling.
  - Sources: Vite guide (vitejs.dev/guide/)
- App type: **Client-only Single-Page Application (SPA), deployable as static files**
  - Rationale: No login or multi-user; all data local to the browser; easy hosting on CDN-backed static platforms.
  - Sources: SPA concept (developer.mozilla.org/en-US/docs/Glossary/SPA)

Persistence (local, per-user)
- Storage: **IndexedDB** via **Dexie**
  - Rationale: IndexedDB handles structured objects, indexes, and bulk operations better than localStorage; Dexie provides a simple Promise-based API with transactions.
  - Sources: IndexedDB (developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), Dexie (dexie.org/docs/Index)
- Data model (high-level): worlds, cities, sectors tables. Version in export bundles to allow future migrations.
- Alternatives considered:
  - localStorage: too limited and synchronous; not suitable for many records (developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
  - localForage: simpler API, but less schema control vs Dexie (localforage.github.io/localForage/)

Simulation execution
- **Web Worker** for the simulation engine (apply actions, tick)
  - Rationale: Offloads compute to a background thread, keeps UI responsive for many cities/sectors.
  - Sources: Web Workers (developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), Vite workers (vitejs.dev/guide/features.html#web-workers)
- **Design**: Keep the engine pure (no I/O). Worker receives sector data and actions, returns updated sector data.

Data flow (actions and ticks)

1. UI loads current sectors from IndexedDB (Dexie).
2. UI posts a message to the Worker:
   1. type: "applyActions" | "tick"
   2. payload: sectors array + actions (for applyActions)
4. Worker computes updated sectors and posts the result back.
5. UI bulk-writes updated sectors to IndexedDB and refreshes the view.
6. Sources: Structured clone for postMessage (developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)

Import/Export
- Export: Build a JSON bundle (world + cities + sectors + version). Create a Blob and download via URL.createObjectURL.
- Import: Read a JSON file from an input element, validate version, write to IndexedDB in a transaction.
- Sources: Blob (developer.mozilla.org/en-US/docs/Web/API/Blob), URL.createObjectURL (developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static), File input (developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)

State management in UI
- Use React local state (useState/useEffect) and simple data-fetching from Dexie.
- Rationale: The app is small; global state libraries are unnecessary for MVP.
- Future options if complexity grows: Zustand or Redux Toolkit.
  - Sources: Zustand (zustand-demo.pmnd.rs/), Redux Toolkit (redux-toolkit.js.org/)

Styling and accessibility
- Minimal CSS for tables/bars; prioritize contrast and readable fonts, may change later
- Accessibility baseline:
  - Labels for inputs, keyboard focus order, sufficient color contrast, clear text equivalents for visual indicators.
- Sources: WCAG color contrast (developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast), WAI-ARIA practices (w3.org/WAI/ARIA/apg/)

# Performance considerations
- Worker keeps compute off the main thread.
- Batch IndexedDB writes (bulk operations) to minimize overhead.
- Avoid unnecessary re-renders (memoize where helpful).
- If city lists grow large, consider list virtualization later (react-window).
- Sources: Dexie best practices (dexie.org/docs/Tutorial/Best-Practices), React performance (react.dev/learn/optimize-performance), React Window (github.com/bvaughn/react-window)

# Testing approach
- Unit tests (later): equilibrium derivation, CHIPS/competition mapping, action effects.
- Integration smoke tests: import/export roundtrip, CRUD operations for worlds/cities.
- Tooling: Vitest (fast TS-friendly test runner).
- Sources: Vitest (vitest.dev/guide/), Testing Library (testing-library.com/docs/react-testing-library/intro)

Offline/PWA (future)
- Optional: Add service worker using Vite Plugin PWA to cache static assets and enable offline use after first load.
- Sources: Vite PWA plugin (vite-pwa-org.netlify.app), Service Workers (developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

# Security and privacy
- No backend; all data stored locally in the user’s browser.
- Import validation: reject malformed or incompatible bundles (version mismatch).
- Guidance: In README/UI, advise users to Export regularly; clearing site data deletes local worlds.

# Risks and mitigations
- IndexedDB cleared by user → Provide clear Export guidance; add import/export buttons prominently.
- Worker communication errors → Simple error messages and retry; keep the worker stateless per request.
- Large worlds cause slow UI → Use Worker, batch writes; consider virtualization for large lists.

# Future evolution paths
- Replace Dexie with a DAL adapter targeting REST/GraphQL/tRPC for multi-user sync.
- Move simulation ticks to server jobs (BullMQ + Redis) if you add shared worlds.
- Add PWA caching and offline-first behaviors after MVP stabilizes.
- Integrate optional real-world seeding via OSM/World Bank (documented separately).
