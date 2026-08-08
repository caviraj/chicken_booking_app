-- Migration: Per-Meat-Type Stock Limits & Atomic Order Creation Function (Phase 13)

CREATE TABLE IF NOT EXISTS public.stock_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meat_type TEXT NOT NULL,
    limit_kg NUMERIC(10, 2) NOT NULL DEFAULT 100.0,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_meat_date UNIQUE(meat_type, effective_date)
);

-- Default stock limits per meat type
INSERT INTO public.stock_limits (meat_type, limit_kg, effective_date)
VALUES 
    ('chicken', 100.0, CURRENT_DATE),
    ('mutton', 50.0, CURRENT_DATE),
    ('duck', 30.0, CURRENT_DATE)
ON CONFLICT (meat_type, effective_date) DO NOTHING;

-- Atomic Postgres RPC function with row-level transaction advisory lock (SELECT pg_advisory_xact_lock)
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_customer_id UUID,
    p_source TEXT,
    p_meat_type TEXT,
    p_quantity_kg NUMERIC,
    p_cutting_type TEXT,
    p_delivery_date DATE,
    p_delivery_time_slot TEXT,
    p_fulfillment_type TEXT,
    p_delivery_address TEXT,
    p_delivery_zone TEXT,
    p_delivery_charge NUMERIC,
    p_item_total NUMERIC,
    p_grand_total NUMERIC,
    p_payment_method TEXT,
    p_payment_status TEXT,
    p_stock_limit_kg NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_lock_key BIGINT;
    v_current_booked NUMERIC;
    v_new_total NUMERIC;
    v_order_id UUID;
    v_created_order JSONB;
BEGIN
    -- 1. Acquire exclusive transaction-level advisory lock per (meat_type + delivery_date)
    v_lock_key := hashtext(p_meat_type || ':' || p_delivery_date::text);
    PERFORM pg_advisory_xact_lock(v_lock_key);

    -- 2. Sum current booked stock for this meat_type and delivery_date
    SELECT COALESCE(SUM(quantity_kg), 0)
    INTO v_current_booked
    FROM public.orders
    WHERE meat_type = p_meat_type
      AND delivery_date = p_delivery_date
      AND order_status != 'cancelled';

    -- 3. Check if new quantity exceeds stock limit
    v_new_total := v_current_booked + p_quantity_kg;
    IF v_new_total > p_stock_limit_kg THEN
        RAISE EXCEPTION 'STOCK_LIMIT_EXCEEDED: Only % kg left for % on %. Requested: % kg.',
            (p_stock_limit_kg - v_current_booked), p_meat_type, p_delivery_date, p_quantity_kg;
    END IF;

    -- 4. Insert order atomically
    INSERT INTO public.orders (
        customer_id, source, meat_type, quantity_kg, cutting_type,
        delivery_date, delivery_time_slot, fulfillment_type, delivery_address,
        delivery_zone, delivery_charge, item_total, grand_total,
        payment_method, payment_status, order_status
    ) VALUES (
        p_customer_id, p_source, p_meat_type, p_quantity_kg, p_cutting_type,
        p_delivery_date, p_delivery_time_slot, p_fulfillment_type, p_delivery_address,
        p_delivery_zone, p_delivery_charge, p_item_total, p_grand_total,
        p_payment_method, p_payment_status, 'confirmed'
    ) RETURNING id INTO v_order_id;

    SELECT row_to_json(o)::jsonb INTO v_created_order
    FROM public.orders o
    WHERE o.id = v_order_id;

    RETURN v_created_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
