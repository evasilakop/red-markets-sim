# Architecture

## Stack and app type

- **Framework**: **React** + **TypeScript**

  - Rationale: Industry-standard, strong ecosystem; TS adds type safety and maintainability.
  - Sources: React docs (react.dev/learn), TypeScript docs (typescriptlang.org/docs)
- **Build tool**: **Vite**
  - Rationale: Fast dev server, great TS support, simple Web Worker bundling.
  - Sources: Vite guide (vitejs.dev/guide/)
- **App type**: **Client-only Single-Page Application (SPA), deployable as static files**
  - Rationale: No login or multi-user; all data local to the browser; easy hosting on CDN-backed static platforms.
  - Sources: SPA concept (developer.mozilla.org/en-US/docs/Glossary/SPA)

### Persistence (local, per-user)

- Storage: **IndexedDB** via **Dexie**
  - Rationale: IndexedDB handles structured objects, indexes, and bulk operations better than localStorage; Dexie provides a simple Promise-based API with transactions.
  - Sources: IndexedDB (developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), Dexie (dexie.org/docs/Index)
- Data model (high-level): worlds, cities, sectors tables. Version in export bundles to allow future migrations.
- Alternatives considered:
  - localStorage: too limited and synchronous; not suitable for many records (developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
  - localForage: simpler API, but less schema control vs Dexie (localforage.github.io/localForage/)

### Simulation execution

- **Simulation Engine**: Inline within UI components
  - Rationale: Given the current size of the app, running simulations inline keeps the setup simple and avoids unnecessary complexity.
  - Sources: None needed for inline logic.

## Data flow (actions and ticks)

1. UI loads current data using local state hooks.
2. UI triggers actions that update local state.
3. UI refreshes the view based on updated state.

## Import/Export

- Export: Build a JSON bundle (worlds + cities + version). Create a Blob and download via URL.createObjectURL.
- Import: Read a JSON file from an input element, validate version, write to local state in a transaction.
- Sources: Blob (developer.mozilla.org/en-US/docs/Web/API/Blob), URL.createObjectURL (developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static), File input (developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)

## State management in UI

- Use React local state (`useState`/`useEffect`) for managing `viewMode`, `selectedWorld`, and `selectedCity`.
- Rationale: The app is small; global state libraries are unnecessary for MVP.
- Future options if complexity grows: Zustand or Redux Toolkit.
  - Sources: Zustand (zustand-demo.pmnd.rs/), Redux Toolkit (redux-toolkit.js.org/)

## Styling and accessibility

- Minimal CSS for tables/bars; prioritize contrast and readable fonts, may change later
- Accessibility baseline:
  - Labels for inputs, keyboard focus order, sufficient color contrast, clear text equivalents for visual indicators.
- Sources: WCAG color contrast (developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast), WAI-ARIA practices (w3.org/WAI/ARIA/apg/)

## Performance considerations

- Avoid unnecessary re-renders (memoize where helpful).
  - Sources: React performance (react.dev/learn/optimize-performance)
- If city lists grow large, consider list virtualization later (react-window).
  - Sources: React Window (github.com/bvaughn/react-window)

## Testing approach

- Unit tests: Equilibrium derivation, CHIPS/competition mapping, action effects.
- Integration smoke tests: Import/export roundtrip, CRUD operations for worlds/cities.
- Tooling: Vitest (fast TS-friendly test runner).
  - Sources: Vitest (vitest.dev/guide/), Testing Library (testing-library.com/docs/react-testing-library/intro)

## Security and privacy

- No backend; all data stored locally in the user’s browser via React local state.
- Import validation: reject malformed or incompatible bundles (version mismatch).
- Guidance: In README/UI, advise users to Export regularly; clearing site data deletes local worlds.

## Risks and mitigations

- Local state cleared by user → Provide clear Export guidance; add import/export buttons prominently.
- Large worlds cause slow UI → Consider virtualization for large lists.

## Future evolution paths

- Replace React local state with a global state management solution (Zustand/Redux Toolkit) as complexity grows.
- Add PWA caching and offline-first behaviors after MVP stabilizes.
- Integrate optional real-world seeding via OSM/World Bank (documented separately).