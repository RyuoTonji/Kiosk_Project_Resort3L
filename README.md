# Local-First Self-Service Kiosk Terminal

A production-grade, local-first self-service touchscreen ordering terminal built with Electron, SQLite, and Tailwind CSS.

## Architecture
- **Desktop Runtime:** Electron (portrait touchscreen configuration, 1080x1920 scalable)
- **Security:** `contextIsolation: true`, `nodeIntegration: false`, sandboxed renderer
- **Preload Bridge:** Typed `window.kioskAPI`
- **Styling:** Tailwind CSS with custom fast-food color palette and touchscreen optimizations
- **Database:** Local SQLite (`better-sqlite3` in Electron main process, zero-latency offline source of truth)

## Quick Start (Development)

### 1. Install Dependencies
```powershell
npm install
```

### 2. Build Assets
```powershell
npm run build
```

### 3. Run in Development Mode
```powershell
npm run dev
```

Or run the compiled app:
```powershell
npm start
```
