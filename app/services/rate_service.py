from datetime import date
from typing import Optional, Dict, Any
from supabase import Client

def get_today_rate(
    supabase: Client,
    meat_type: str,
    target_date: Optional[date] = None
) -> Optional[Dict[str, Any]]:
    """
    Fetch the rate for a given meat_type on a target date (defaults to today).
    If today's rate is not explicitly set, falls back to the most recent past rate.

    Args:
        supabase (Client): Initialized Supabase client.
        meat_type (str): Type of meat ('chicken', 'mutton', 'duck', etc.).
        target_date (Optional[date]): Target date for rate lookup. Defaults to today's date.

    Returns:
        Optional[Dict[str, Any]]: Dictionary containing rate details (id, meat_type, rate_per_kg, effective_date)
                                 or None if no rate is available.
    """
    if target_date is None:
        target_date = date.today()
    
    date_str = target_date.isoformat()
    normalized_meat_type = meat_type.strip().lower()

    # 1. Attempt exact match for target date
    exact_res = (
        supabase.table("rates")
        .select("*")
        .eq("meat_type", normalized_meat_type)
        .eq("effective_date", date_str)
        .execute()
    )

    if exact_res.data and len(exact_res.data) > 0:
        rate_record = exact_res.data[0]
        rate_record["rate_per_kg"] = float(rate_record["rate_per_kg"])
        return rate_record

    # 2. Fallback to most recent past rate (effective_date <= target_date)
    fallback_res = (
        supabase.table("rates")
        .select("*")
        .eq("meat_type", normalized_meat_type)
        .lte("effective_date", date_str)
        .order("effective_date", desc=True)
        .limit(1)
        .execute()
    )

    if fallback_res.data and len(fallback_res.data) > 0:
        rate_record = fallback_res.data[0]
        rate_record["rate_per_kg"] = float(rate_record["rate_per_kg"])
        return rate_record

    return None
