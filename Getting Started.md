# Getting started

## Prerequisites
- Node.js 18 or later and npm
- A modern browser (Chrome/Edge/Firefox)

## Quickstart (local)
1. Install dependencies


```bash
npm install
```
2. Run the dev server


```bash
npm run dev
```
3. Open the app in your browser at the URL shown (typically http://localhost:5173)

4. Build and preview production


```bash
npm run build
npm run preview
```

Notes
- Data is stored locally in your browser via IndexedDB (Dexie). Clearing site data will remove worlds; use Export to back up.
- Architecture, Persistence, and Simulation Rules are documented in the README.
- This is a client-only SPA; no backend required.

Troubleshooting
- If the dev server doesn’t start, ensure Node 18+ is installed: node -v
- If imports fail after cloning, run npm install
- IndexedDB might be disabled in private/incognito modes; test in a normal browser window