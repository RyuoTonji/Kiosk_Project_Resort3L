import { getDatabase } from '../sqlite';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number; // Integer centavos
  image_url: string | null;
  base_ingredients_json: string;
  active: number;
  updated_at: string;
}

export class MenuRepository {
  static getCategories(): string[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT DISTINCT category FROM menu_items
      WHERE active = 1
      ORDER BY category
    `).all() as { category: string }[];

    return rows.map((r) => r.category);
  }

  static getMenuItems(category?: string): MenuItem[] {
    const db = getDatabase();
    if (category && category !== 'all') {
      return db.prepare(`
        SELECT * FROM menu_items
        WHERE category = ? AND active = 1
        ORDER BY price ASC
      `).all(category) as MenuItem[];
    }

    return db.prepare(`
      SELECT * FROM menu_items
      WHERE active = 1
      ORDER BY category, price ASC
    `).all() as MenuItem[];
  }

  static getMenuItemById(id: string): MenuItem | undefined {
    const db = getDatabase();
    return db.prepare(`SELECT * FROM menu_items WHERE id = ?`).get(id) as MenuItem | undefined;
  }
}
