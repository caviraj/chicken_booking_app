from datetime import date
from typing import Dict, Any, Optional, Union
from supabase import Client

def _ensure_date(d: Union[date, str]) -> date:
    if isinstance(d, str):
        return date.fromisoformat(d.strip())
    return d


def get_stock_limit_for_meat(
    supabase: Client,
    meat_type: str,
    target_date: Optional[Union[date, str]] = None
) -> float:
    """
    Fetches the per-meat_type daily stock limit in kg.
    """
    target = _ensure_date(target_date or date.today())
    norm_meat = meat_type.lower().strip()

    try:
        res = (
            supabase.table("stock_limits")
            .select("limit_kg")
            .eq("meat_type", norm_meat)
            .eq("effective_date", target.isoformat())
            .maybeSingle()
            .execute()
        )
        if res.data and "limit_kg" in res.data and res.data["limit_kg"] is not None:
            return float(res.data["limit_kg"])

        past_res = (
            supabase.table("stock_limits")
            .select("limit_kg")
            .eq("meat_type", norm_meat)
            .lte("effective_date", target.isoformat())
            .order("effective_date", desc=True)
            .limit(1)
            .execute()
        )
        if past_res.data and len(past_res.data) > 0 and past_res.data[0].get("limit_kg") is not None:
            return float(past_res.data[0]["limit_kg"])
    except Exception:
        pass

    try:
        settings_res = (
            supabase.table("admin_settings")
            .select("daily_stock_limit_kg")
            .limit(1)
            .execute()
        )
        if settings_res.data and len(settings_res.data) > 0:
            val = settings_res.data[0].get("daily_stock_limit_kg")
            if val is not None:
                return float(val)
    except Exception:
        pass

    default_limits = {"chicken": 100.0, "mutton": 50.0, "duck": 30.0}
    return default_limits.get(norm_meat, 100.0)


def get_booked_stock_kg(
    supabase: Client,
    meat_type: str,
    delivery_date: Union[date, str]
) -> float:
    """
    Returns total booked quantity in kg for meat_type and delivery_date
    excluding cancelled orders.
    """
    target = _ensure_date(delivery_date)
    norm_meat = meat_type.lower().strip()
    try:
        res = (
            supabase.table("orders")
            .select("quantity_kg")
            .eq("meat_type", norm_meat)
            .eq("delivery_date", target.isoformat())
            .neq("order_status", "cancelled")
            .execute()
        )
        if res.data:
            return sum(float(row["quantity_kg"]) for row in res.data if row.get("quantity_kg") is not None)
    except Exception:
        pass
    return 0.0


def check_stock_limit(
    supabase: Client,
    meat_type: str,
    quantity_kg: Optional[Union[float, int, date, str]] = None,
    delivery_date: Optional[Union[date, str, float, int]] = None,
    requested_kg: Optional[float] = None
) -> Dict[str, Any]:
    """
    Checks stock limit availability supporting positional and keyword parameters.
    """
    req_kg: float = 0.0
    deliv_d: date = date.today()

    if requested_kg is not None:
        req_kg = float(requested_kg)
    elif isinstance(quantity_kg, (int, float)):
        req_kg = float(quantity_kg)

    if isinstance(delivery_date, (date, str)):
        deliv_d = _ensure_date(delivery_date)
    elif isinstance(quantity_kg, (date, str)):
        deliv_d = _ensure_date(quantity_kg)

    limit_kg = get_stock_limit_for_meat(supabase, meat_type, deliv_d)
    booked_kg = get_booked_stock_kg(supabase, meat_type, deliv_d)
    remaining_kg = max(0.0, round(limit_kg - booked_kg, 2))
    is_avail = (booked_kg + req_kg) <= limit_kg

    return {
        "available": is_avail,
        "is_available": is_avail,
        "remaining_kg": remaining_kg,
        "booked_kg": booked_kg,
        "limit_kg": limit_kg
    }
