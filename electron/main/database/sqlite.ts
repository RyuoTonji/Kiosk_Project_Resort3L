import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import { runMigrations } from './migrations';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  // Place local.sqlite in user data or project directory
  const dbPath = app ? path.join(app.getPath('userData'), 'kiosk_local.sqlite') : path.join(process.cwd(), 'kiosk_local.sqlite');
  console.log(`[Database] Initializing SQLite database at: ${dbPath}`);

  dbInstance = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[SQL] ${msg}`) : undefined,
  });

  runMigrations(dbInstance);

  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[Database] SQLite database closed.');
  }
}
