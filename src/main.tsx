import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@infrastructure/i18n/config';
import { App } from '@presentation/app/App';

/**
 * Recover from stale deploys. When a new version ships, the assets this page
 * references (hashed chunk filenames) are replaced on the server, so a
 * still-open old page fails to lazily import them ("Failed to fetch dynamically
 * imported module"). Vite fires `vite:preloadError` in that case — reload once
 * to fetch the fresh build. The timestamp guard prevents a reload loop if the
 * failure is something other than a stale chunk.
 */
window.addEventListener('vite:preloadError', () => {
  const now = Date.now();
  const last = Number(sessionStorage.getItem('chunkReloadAt') || 0);
  if (now - last > 10_000) {
    sessionStorage.setItem('chunkReloadAt', String(now));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
