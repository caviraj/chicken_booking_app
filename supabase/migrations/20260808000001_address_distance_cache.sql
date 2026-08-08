-- Migration: Address Distance Cache (Phase 12)
-- Stores persistent distance computation results with a 30-day TTL

CREATE TABLE IF NOT EXISTS public.address_distance_cache (
    address_normalized TEXT PRIMARY KEY,
    distance_km NUMERIC(10, 2) NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cache maintenance
CREATE INDEX IF NOT EXISTS idx_address_distance_cache_computed ON public.address_distance_cache(computed_at);
