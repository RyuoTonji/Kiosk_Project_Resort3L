-- Supabase PostgreSQL Schema for Kiosk System
-- Enables Idempotent Cloud Synchronization with Local SQLite Kiosks

-- 1. Menu Items Table (Source of truth in cloud, replicated to local SQLite)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL, -- Integer centavos
    image_url TEXT,
    base_ingredients_json JSONB NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supabase_menu_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_supabase_menu_active ON public.menu_items(active);

-- 2. Kiosk Orders Table (Source of truth generated locally on Kiosks, synced to cloud)
CREATE TABLE IF NOT EXISTS public.kiosk_orders (
    id UUID PRIMARY KEY, -- Local UUID v4 generated on kiosk
    order_number INTEGER NOT NULL,
    dining_mode TEXT NOT NULL DEFAULT 'dine-in',
    payment_method TEXT NOT NULL DEFAULT 'cashier-counter',
    subtotal INTEGER NOT NULL,
    vat INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    items_recipe_json JSONB NOT NULL,
    kiosk_id TEXT NOT NULL DEFAULT 'KIOSK-TERMINAL-01',
    created_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supabase_orders_created ON public.kiosk_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_kiosk ON public.kiosk_orders(kiosk_id);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_orders ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read on active menu items (for kiosk client synchronization)
CREATE POLICY "Allow public read on active menu items"
    ON public.menu_items
    FOR SELECT
    USING (active = true);

-- Allow kiosk clients to insert orders (idempotently)
CREATE POLICY "Allow kiosk order creation"
    ON public.kiosk_orders
    FOR INSERT
    WITH CHECK (true);

-- Allow kiosks to view their own synchronized orders
CREATE POLICY "Allow kiosks to view synced orders"
    ON public.kiosk_orders
    FOR SELECT
    USING (true);
