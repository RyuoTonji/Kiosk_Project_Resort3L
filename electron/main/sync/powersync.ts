import { getDatabase } from '../database/sqlite';
import { Logger } from '../logger';

export interface SyncStatus {
  isOnline: boolean;
  pendingOrdersCount: number;
  lastSyncTimestamp: string | null;
  isSyncing: boolean;
}

export class PowerSyncService {
  private static syncInterval: NodeJS.Timeout | null = null;
  private static isSyncing = false;
  private static backoffDelayMs = 5000;
  private static maxBackoffMs = 60000;

  static startBackgroundSync(intervalMs = 15000): void {
    if (this.syncInterval) return;

    Logger.info('PowerSyncService', 'Starting background cloud synchronization worker...');

    // Run initial sync check
    this.syncPendingOrders();

    this.syncInterval = setInterval(() => {
      this.syncPendingOrders();
    }, intervalMs);
  }

  static stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      Logger.info('PowerSyncService', 'Background synchronization worker stopped.');
    }
  }

  static getPendingOrdersCount(): number {
    try {
      const db = getDatabase();
      const row = db.prepare(`SELECT COUNT(*) as count FROM kiosk_orders WHERE sync_status = 'pending'`).get() as { count: number };
      return row ? row.count : 0;
    } catch {
      return 0;
    }
  }

  static getLastSyncTimestamp(): string | null {
    try {
      const db = getDatabase();
      const row = db.prepare(`SELECT value FROM kiosk_settings WHERE key = 'last_sync_timestamp'`).get() as { value: string } | undefined;
      return row ? row.value : null;
    } catch {
      return null;
    }
  }

  static async syncPendingOrders(): Promise<{ syncedCount: number; errors: number }> {
    if (this.isSyncing) {
      return { syncedCount: 0, errors: 0 };
    }

    this.isSyncing = true;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      const db = getDatabase();

      // Find all pending orders (oldest first)
      const pendingOrders = db.prepare(`
        SELECT * FROM kiosk_orders
        WHERE sync_status = 'pending'
        ORDER BY created_at ASC
        LIMIT 50
      `).all() as Array<{
        id: string;
        order_number: number;
        dining_mode: string;
        payment_method: string;
        subtotal: number;
        vat: number;
        total_amount: number;
        items_recipe_json: string;
        created_at: string;
      }>;

      if (pendingOrders.length === 0) {
        this.isSyncing = false;
        return { syncedCount: 0, errors: 0 };
      }

      Logger.info('PowerSyncService', `Found ${pendingOrders.length} pending orders to synchronize to cloud.`);

      // Process batch idempotently
      const updateStmt = db.prepare(`
        UPDATE kiosk_orders
        SET sync_status = 'synced', synced_at = datetime('now')
        WHERE id = ?
      `);

      for (const order of pendingOrders) {
        try {
          // Idempotent Cloud Upload Simulation (or PowerSync / Supabase connector)
          await this.uploadOrderToCloud(order);

          // Update local status upon successful cloud confirmation
          updateStmt.run(order.id);
          syncedCount++;

          Logger.info('PowerSyncService', `Successfully synced Order #${order.order_number} (${order.id}) to cloud.`);
        } catch (err: any) {
          errorCount++;
          Logger.warn('PowerSyncService', `Failed to sync Order #${order.order_number}: ${err.message}. Retaining in local pending queue.`);
          break; // Stop batch on network/cloud error and retry next interval with backoff
        }
      }

      if (syncedCount > 0) {
        // Record last successful sync timestamp in settings
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO kiosk_settings (key, value, updated_at)
          VALUES ('last_sync_timestamp', ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).run(now);

        // Reset backoff on success
        this.backoffDelayMs = 5000;
      }

    } catch (err: any) {
      Logger.error('PowerSyncService', 'Unexpected error during sync routine', err);
      // Exponential backoff
      this.backoffDelayMs = Math.min(this.backoffDelayMs * 2, this.maxBackoffMs);
    } finally {
      this.isSyncing = false;
    }

    return { syncedCount, errors: errorCount };
  }

  private static async uploadOrderToCloud(order: any): Promise<void> {
    // In production, PowerSync / Supabase REST client executes:
    // INSERT INTO kiosk_orders ... ON CONFLICT (id) DO NOTHING;
    // For local mock / offline safety verification, we simulate network turnaround:
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
}
