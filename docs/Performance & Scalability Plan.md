### 🚀 Performance Plan & Scale Targets

As the simulation grows, maintaining a responsive UI (60fps) while handling complex state calculations is critical. This plan defines our scaling limits and the specific engineering tactics to support them.

#### 🎯 Scale Targets

We aim to support the following data volumes without UI degradation on an average consumer laptop:

| Entity | Target Volume | Constraints |
| :--- | :--- | :--- |
| **Worlds** | 5+ Active Worlds | Low impact (mostly storage). |
| **Cities** | 50+ per World | List rendering must remain instant (<100ms). |
| **Sectors** | 20+ per City | Total active nodes ~1,000. |
| **Simulation Ticks** | 1 Tick / Second | Background processing must not block UI interactions. |

**Responsiveness Goals:**
*   **Interaction to Paint:** < 100ms for all user actions (clicking, selecting).
*   **Tick Processing:** < 50ms per tick cycle to allow ample idle time for the main thread.
*   **Startup Time:** < 1.5s to interactive state (IndexedDB hydration).

#### 🛠️ Optimization Tactics

We will apply optimizations in phases based on complexity and necessity.

##### Phase 1: Core Efficiency (Current)
*   **Bulk IndexedDB Writes:**
    *   *Strategy:* Instead of saving every sector individually during a tick, accumulate changes in memory and commit to `idb` in a single transaction.
    *   *Why:* IndexedDB transactions have overhead. One transaction with 50 `put` operations is significantly faster than 50 transactions with 1 `put`.
*   **React Memoization:**
    *   *Strategy:* Aggressive use of `React.memo` for list items (`CityListItem`, `SectorCard`) and `useCallback` for event handlers passed to them.
    *   *Why:* Prevents re-rendering the entire list of 50 cities when only one city's data changes.

##### Phase 2: Heavy Lifting (Next Steps)
*   **Web Workers for Simulation:**
    *   *Strategy:* Move the core simulation loop (economy calculations, sector updates) off the main thread into a `Worker`.
    *   *Implementation:* The Worker calculates the new state and sends a serialized "diff" back to the UI thread.
    *   *Why:* Ensures that even if a tick takes 200ms due to complex math, the UI (buttons, scrolling) never freezes.
*   **Throttled Persistence:**
    *   *Strategy:* Decouple the simulation tick rate from the database save rate.
    *   *Implementation:* Tick every 1 second, but save to IndexedDB every 5 or 10 seconds (or on exit).

##### Phase 3: Extreme Scale (Future)
*   **Virtualization (Windowing):**
    *   *Strategy:* Use `react-window` or `react-virtualized` for the City and Sector lists.
    *   *Why:* If we exceed 100+ items, the DOM nodes themselves become the bottleneck. Virtualization only renders the items currently visible in the viewport.

#### 📚 Resources & References

For implementation details, refer to these standard patterns:

*   **Web Workers:**
    *   [MDN: Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) - The basics of offloading work.
    *   [Comlink](https://github.com/GoogleChromeLabs/comlink) - A library by Google to make Worker communication look like standard async functions (highly recommended for DX).

*   **IndexedDB Performance:**
    *   [idb](https://github.com/jakearchibald/idb) - A tiny wrapper around IndexedDB that uses Promises (likely already in use, but essential for bulk ops).
    *   *Tip:* Always use `readwrite` mode for bulk updates and try to reuse the transaction scope.

*   **React Optimization:**
    *   [React DevTools Profiler](https://react.dev/reference/react/profiler) - Use this to identify exactly which components are re-rendering unnecessarily.
    *   [Virtualization with react-window](https://github.com/bvaughn/react-window) - For handling long lists efficiently.
