from datetime import date
from typing import Dict, Any, Union
from supabase import Client

def get_booked_stock_kg(
    supabase: Client,
    meat_type: str,
    delivery_date: Union[date, str]
) -> float:
    """
    Sums quantity_kg already booked for a given meat_type and delivery_date.
    Excludes cancelled orders.

    Args:
        supabase (Client): Initialized Supabase client.
        meat_type (str): Meat type ('chicken', 'mutton', 'duck', etc.).
        delivery_date (Union[date, str]): Target delivery date.

    Returns:
        float: Total quantity in kg already booked for that date.
    """
    date_str = delivery_date.isoformat() if isinstance(delivery_date, date) else str(delivery_date)
    normalized_meat_type = meat_type.strip().lower()

    orders_res = (
        supabase.table("orders")
        .select("quantity_kg, order_status")
        .eq("meat_type", normalized_meat_type)
        .eq("delivery_date", date_str)
        .neq("order_status", "cancelled")
        .execute()
    )

    if not orders_res.data:
        return 0.0

    total_booked = sum(float(order.get("quantity_kg", 0.0)) for order in orders_res.data)
    return round(total_booked, 2)


def check_stock_limit(
    supabase: Client,
    meat_type: str,
    delivery_date: Union[date, str],
    requested_kg: float
) -> Dict[str, Any]:
    """
    Compares already-booked stock + requested quantity against admin_settings.daily_stock_limit_kg.

    Args:
        supabase (Client): Initialized Supabase client.
        meat_type (str): Meat type.
        delivery_date (Union[date, str]): Delivery date.
        requested_kg (float): Quantity requested in kg.

    Returns:
        Dict[str, Any]: Available status, booked quantity, requested quantity, limit, and remaining stock.
    """
    booked_kg = get_booked_stock_kg(supabase, meat_type, delivery_date)

    settings_res = (
        supabase.table("admin_settings")
        .select("daily_stock_limit_kg")
        .limit(1)
        .execute()
    )

    limit_kg: Union[float, None] = None
    if settings_res.data and len(settings_res.data) > 0:
        val = settings_res.data[0].get("daily_stock_limit_kg")
        if val is not None:
            limit_kg = float(val)

    if limit_kg is None:
        return {
            "available": True,
            "booked_kg": booked_kg,
            "requested_kg": requested_kg,
            "limit_kg": None,
            "remaining_kg": None
        }

    remaining_kg = max(0.0, limit_kg - booked_kg)
    available = (booked_kg + requested_kg) <= limit_kg

    return {
        "available": available,
        "booked_kg": booked_kg,
        "requested_kg": requested_kg,
        "limit_kg": limit_kg,
        "remaining_kg": round(remaining_kg, 2)
    }
