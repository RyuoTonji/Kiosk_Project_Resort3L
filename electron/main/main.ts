import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { getDatabase, closeDatabase } from './database/sqlite';
import { registerIpcHandlers } from './ipc/handlers';
import { PowerSyncService } from './sync/powersync';
import { Logger } from './logger';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Portrait orientation matching vertical touchscreen kiosk terminals (9:16 aspect ratio)
  mainWindow = new BrowserWindow({
    width: 620,
    height: 980,
    minWidth: 480,
    minHeight: 760,
    title: 'Self-Service Touchscreen Kiosk',
    backgroundColor: '#1E1B18',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: process.env.NODE_ENV !== 'production',
    },
  });

  const indexPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  Logger.info('Application', 'Fast-Food Kiosk starting up...');

  try {
    // 1. Initialize SQLite Database & Schema Migrations
    getDatabase();
    Logger.info('Database', 'SQLite database initialized with WAL mode.');

    // 2. Register Secure IPC Bridge Handlers
    registerIpcHandlers();
    Logger.info('IPC', 'IPC Handlers registered.');

    // 3. Start Background PowerSync / Supabase Cloud Worker
    PowerSyncService.startBackgroundSync(15000);

    // 4. Create Window
    createWindow();
  } catch (err: any) {
    Logger.error('Application', 'Fatal error during startup sequence', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  Logger.info('Application', 'Kiosk terminal shutting down cleanly.');
  PowerSyncService.stopBackgroundSync();
  closeDatabase();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
