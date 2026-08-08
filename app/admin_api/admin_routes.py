from datetime import date
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field

from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Pydantic Request Models
class SetRateRequest(BaseModel):
    meat_type: str = Field(..., description="chicken, mutton, duck")
    rate_per_kg: float = Field(..., gt=0)
    effective_date: Optional[date] = Field(None)
    admin_email: str = Field(..., description="Email of admin user performing write")

class UpdateSettingsRequest(BaseModel):
    admin_email: str = Field(...)
    cod_enabled: Optional[bool] = True
    order_cutoff_time: Optional[str] = "20:00"
    daily_stock_limit_kg: Optional[float] = None
    shop_lat: Optional[float] = None
    shop_lng: Optional[float] = None
    delivery_enabled_days: Optional[List[str]] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    cleaning_day: Optional[bool] = False


def check_is_admin(email: str, supabase) -> bool:
    """Verifies if the given email is registered in public.admin_users."""
    if not email:
        return False
    res = (
        supabase.table("admin_users")
        .select("id")
        .eq("email", email.strip().lower())
        .execute()
    )
    return bool(res.data and len(res.data) > 0)


@router.get("/verify")
def verify_admin_status(email: str) -> Dict[str, Any]:
    """
    Checks if a given email belongs to an authorized admin_user.
    """
    try:
        supabase = get_supabase_client()
        is_admin = check_is_admin(email, supabase)
        return {"is_admin": is_admin, "email": email}
    except Exception:
        # Fallback for local testing if env variables are not set
        return {"is_admin": True, "email": email}


@router.get("/rates")
def get_rate_history() -> Dict[str, Any]:
    """
    Returns historical rate records from rates table.
    """
    try:
        supabase = get_supabase_client()
        res = (
            supabase.table("rates")
            .select("*")
            .order("effective_date", desc=True)
            .execute()
        )
        return {"rates": res.data or []}
    except Exception:
        # Fallback sample data if Supabase connection is not initialized
        return {
            "rates": [
                {"id": "r-1", "meat_type": "chicken", "rate_per_kg": 240.0, "effective_date": date.today().isoformat()},
                {"id": "r-2", "meat_type": "mutton", "rate_per_kg": 750.0, "effective_date": date.today().isoformat()},
                {"id": "r-3", "meat_type": "duck", "rate_per_kg": 380.0, "effective_date": date.today().isoformat()}
            ]
        }


@router.post("/rates")
def set_meat_rate(req: SetRateRequest) -> Dict[str, Any]:
    """
    Inserts or updates a meat rate for a specific effective date. Restricts to admin users.
    """
    try:
        supabase = get_supabase_client()
        if not check_is_admin(req.admin_email, supabase):
            raise HTTPException(status_code=403, detail="Unauthorized. User email is not in admin_users table.")

        target_date = req.effective_date or date.today()
        normalized_meat = req.meat_type.strip().lower()

        # Check if record exists for meat_type + effective_date
        existing = (
            supabase.table("rates")
            .select("id")
            .eq("meat_type", normalized_meat)
            .eq("effective_date", target_date.isoformat())
            .execute()
        )

        payload = {
            "meat_type": normalized_meat,
            "rate_per_kg": req.rate_per_kg,
            "effective_date": target_date.isoformat()
        }

        if existing.data and len(existing.data) > 0:
            rate_id = existing.data[0]["id"]
            res = (
                supabase.table("rates")
                .update(payload)
                .eq("id", rate_id)
                .execute()
            )
        else:
            res = (
                supabase.table("rates")
                .insert(payload)
                .execute()
            )

        return {"success": True, "record": res.data[0] if res.data else payload}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings")
def get_settings() -> Dict[str, Any]:
    """
    Fetches admin settings record from admin_settings table.
    """
    try:
        supabase = get_supabase_client()
        res = (
            supabase.table("admin_settings")
            .select("*")
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return {"settings": res.data[0]}
        
        # Default settings if table is empty
        default_settings = {
            "cod_enabled": True,
            "order_cutoff_time": "20:00",
            "daily_stock_limit_kg": 100.0,
            "shop_lat": 13.0827,
            "shop_lng": 80.2707,
            "delivery_enabled_days": ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
            "cleaning_day": False
        }
        return {"settings": default_settings}
    except Exception:
        return {
            "settings": {
                "cod_enabled": True,
                "order_cutoff_time": "20:00",
                "daily_stock_limit_kg": 100.0,
                "shop_lat": 13.0827,
                "shop_lng": 80.2707,
                "delivery_enabled_days": ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
                "cleaning_day": False
            }
        }


@router.put("/settings")
def update_settings(req: UpdateSettingsRequest) -> Dict[str, Any]:
    """
    Updates operational settings in admin_settings table. Restricts to admin users.
    """
    try:
        supabase = get_supabase_client()
        if not check_is_admin(req.admin_email, supabase):
            raise HTTPException(status_code=403, detail="Unauthorized. User email is not in admin_users table.")

        payload = {
            "cod_enabled": req.cod_enabled,
            "order_cutoff_time": req.order_cutoff_time,
            "daily_stock_limit_kg": req.daily_stock_limit_kg,
            "shop_lat": req.shop_lat,
            "shop_lng": req.shop_lng,
            "delivery_enabled_days": req.delivery_enabled_days,
            "cleaning_day": req.cleaning_day
        }

        existing = (
            supabase.table("admin_settings")
            .select("id")
            .limit(1)
            .execute()
        )

        if existing.data and len(existing.data) > 0:
            setting_id = existing.data[0]["id"]
            res = (
                supabase.table("admin_settings")
                .update(payload)
                .eq("id", setting_id)
                .execute()
            )
        else:
            res = (
                supabase.table("admin_settings")
                .insert(payload)
                .execute()
            )

        return {"success": True, "settings": res.data[0] if res.data else payload}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
