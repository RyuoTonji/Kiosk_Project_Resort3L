/**
 * Application Entry Point
 * Boots the 3L's Beach Resort Self-Service Kiosk Terminal.
 */
import { KioskApp } from './controllers/kiosk-app.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = new KioskApp();
  app.init().catch((err) => {
    console.error('[Kiosk Bootstrap Error]:', err);
  });
});
