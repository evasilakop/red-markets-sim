### Implement PWA (Offline & Installable)
**Title:** Configure PWA for Offline Support and Installation **Description:** Turn the web application into a Progressive Web App (PWA). This will allow users to install it on their desktop/mobile devices and ensure it loads even without an internet connection.
**Scope:**
1.  **Install Plugin:** Add `vite-plugin-pwa` to the project.
2.  **Generate Assets:** Create the required `manifest.json` and icon files (I can help you generate placeholders).
3.  **Configure Service Worker:** Set up the "Cache First" strategy so the app loads instantly.
4.  **Update UI:** (Optional) Add a reload prompt when a new version is available ("New content available, click to reload").
    **Tasks:**
*    `npm install vite-plugin-pwa -D`
*    Configure `vite.config.ts` with the PWA settings.
*    Add `favicon.svg` (or png) to `/public`.
*    Add `<meta>` tags for theme color in `index.html`.
*    Test "Install" button in Chrome.
*    Test "Offline Mode" (Disconnect WiFi and refresh).
     **Why this is safe:** The plugin handles 99% of the complexity. If it messes up, you just delete the plugin from `vite.config.ts` and you are back to a normal website instantly.