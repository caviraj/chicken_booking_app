from datetime import date, datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel, Field

from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/api/admin", tags=["Admin API"])

# Pydantic Schemas
class VerifyAdminRequest(BaseModel):
    email: str

class UpdateRateRequest(BaseModel):
    admin_email: str
    meat_type: str
    rate_per_kg: float = Field(..., gt=0)
    effective_date: Optional[date] = None

class UpdateSettingsRequest(BaseModel):
    admin_email: str
    order_cutoff_time: str = Field("20:00")
    daily_stock_limit_kg: float = Field(100.0, gt=0)
    shop_latitude: float
    shop_longitude: float
    is_cleaning_day: bool = False

class UpdateOrderStatusRequest(BaseModel):
    admin_email: str
    order_status: str

class UpdatePaymentStatusRequest(BaseModel):
    admin_email: str
    payment_status: str

class DeliveryZoneRequest(BaseModel):
    admin_email: str
    zone_name: str
    max_distance_km: float = Field(..., gt=0)
    delivery_charge: float = Field(..., ge=0)
    is_active: bool = True


def check_is_admin(supabase, email: str):
    """Helper function to verify if email exists in admin_users table."""
    if not email:
        raise HTTPException(status_code=401, detail="Admin authorization email is required.")
    
    res = (
        supabase.table("admin_users")
        .select("id, email, role")
        .eq("email", email.strip().lower())
        .maybeSingle()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=403, detail="Access denied. Email is not an authorized admin.")
    return res.data


@router.post("/verify")
def verify_admin_status(req: VerifyAdminRequest) -> Dict[str, Any]:
    """Verifies whether an email belongs to an authorized admin."""
    try:
        supabase = get_supabase_client()
        admin_data = check_is_admin(supabase, req.email)
        return {"is_admin": True, "admin": admin_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rates")
def get_rates_history(
    meat_type: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Fetches full rates history from rates table."""
    try:
        supabase = get_supabase_client()
        query = supabase.table("rates").select("*").order("effective_date", desc=True)
        if meat_type:
            query = query.eq("meat_type", meat_type.lower())
        res = query.execute()
        return {"rates": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rates")
def update_meat_rate(req: UpdateRateRequest) -> Dict[str, Any]:
    """Inserts a new daily rate for a meat type into rates table."""
    try:
        supabase = get_supabase_client()
        check_is_admin(supabase, req.admin_email)

        eff_date = req.effective_date or date.today()

        payload = {
            "meat_type": req.meat_type.lower(),
            "rate_per_kg": req.rate_per_kg,
            "effective_date": eff_date.isoformat(),
            "created_by": req.admin_email.strip().lower()
        }

        res = supabase.table("rates").insert(payload).execute()
        if not res.data:
            raise RuntimeError("Failed to insert new rate")

        return {"success": True, "rate": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings")
def get_admin_settings() -> Dict[str, Any]:
    """Fetches operational admin settings."""
    try:
        supabase = get_supabase_client()
        res = supabase.table("admin_settings").select("*").limit(1).execute()
        if res.data and len(res.data) > 0:
            return {"settings": res.data[0]}
        
        default_settings = {
            "order_cutoff_time": "20:00",
            "daily_stock_limit_kg": 100.0,
            "shop_latitude": 13.0827,
            "shop_longitude": 80.2707,
            "is_cleaning_day": False
        }
        return {"settings": default_settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/settings")
def update_admin_settings(req: UpdateSettingsRequest) -> Dict[str, Any]:
    """Updates global shop settings."""
    try:
        supabase = get_supabase_client()
        check_is_admin(supabase, req.admin_email)

        existing = supabase.table("admin_settings").select("id").limit(1).execute()
        payload = {
            "order_cutoff_time": req.order_cutoff_time,
            "daily_stock_limit_kg": req.daily_stock_limit_kg,
            "shop_latitude": req.shop_latitude,
            "shop_longitude": req.shop_longitude,
            "is_cleaning_day": req.is_cleaning_day,
            "updated_at": datetime.now().isoformat()
        }

        if existing.data and len(existing.data) > 0:
            rec_id = existing.data[0]["id"]
            res = supabase.table("admin_settings").update(payload).eq("id", rec_id).execute()
        else:
            res = supabase.table("admin_settings").insert(payload).execute()

        return {"success": True, "settings": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Phase 11: Orders Management Endpoints ---

@router.get("/orders")
def get_admin_orders(
    delivery_date: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    order_status: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Fetches all orders with optional filter query parameters."""
    try:
        supabase = get_supabase_client()
        query = supabase.table("orders").select("*").order("created_at", desc=True)

        if delivery_date:
            query = query.eq("delivery_date", delivery_date)
        if source:
            query = query.eq("source", source.lower())
        if order_status:
            query = query.eq("order_status", order_status.lower())
        if payment_method:
            query = query.eq("payment_method", payment_method.lower())

        res = query.execute()
        return {"orders": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/orders/{order_id}/status")
def update_order_status(order_id: str, req: UpdateOrderStatusRequest) -> Dict[str, Any]:
    """Updates order status e.g. confirmed -> preparing -> out_for_delivery -> delivered."""
    try:
        supabase = get_supabase_client()
        check_is_admin(supabase, req.admin_email)

        res = (
            supabase.table("orders")
            .update({"order_status": req.order_status.lower()})
            .eq("id", order_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Order not found")

        # Dispatch WhatsApp status notification to customer
        try:
            from app.services.notification_service import send_order_status_notification
            send_order_status_notification(supabase, order_id=order_id, new_status=req.order_status)
        except Exception:
            pass

        return {"success": True, "order": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.patch("/orders/{order_id}/payment-status")
def update_order_payment_status(order_id: str, req: UpdatePaymentStatusRequest) -> Dict[str, Any]:
    """Updates payment status e.g. mark COD as paid."""
    try:
        supabase = get_supabase_client()
        check_is_admin(supabase, req.admin_email)

        res = (
            supabase.table("orders")
            .update({"payment_status": req.payment_status.lower()})
            .eq("id", order_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Order not found")

        return {"success": True, "order": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Phase 11: Delivery Zones CRUD Endpoints ---

@router.get("/delivery-zones")
def get_admin_delivery_zones() -> Dict[str, Any]:
    """Fetches all delivery zones ordered by max_distance_km ASC."""
    try:
        supabase = get_supabase_client()
        res = supabase.table("delivery_zones").select("*").order("max_distance_km", desc=False).execute()
        return {"zones": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delivery-zones")
def create_delivery_zone(req: DeliveryZoneRequest) -> Dict[str, Any]:
    """Creates a new delivery zone band."""
    try:
        supabase = get_supabase_client()
        check_is_admin(supabase, req.admin_email)

        payload = {
            "zone_name": req.zone_name.strip(),
            "max_distance_km": req.max_distance_km,
            "delivery_charge": req.delivery_charge,
            "is_active": req.is_active
        }
        res = supabase.table("delivery_zones").insert(payload).execute()
        if not res.data:
            raise RuntimeError("Failed to insert delivery zone")

        return {"success": True, "zone": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/delivery-zones/{zone_id}")
def update_delivery_zone(zone_id: str, req: DeliveryZoneRequest) -> Dict[str, Any]:
    """Updates an existing delivery zone band."""
    try:
        supabase = get_supabase_client()
        check_is_admin(supabase, req.admin_email)

        payload = {
            "zone_name": req.zone_name.strip(),
            "max_distance_km": req.max_distance_km,
            "delivery_charge": req.delivery_charge,
            "is_active": req.is_active
        }
        res = supabase.table("delivery_zones").update(payload).eq("id", zone_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Delivery zone not found")

        return {"success": True, "zone": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delivery-zones/{zone_id}")
def delete_delivery_zone(zone_id: str, admin_email: str = Query(...)) -> Dict[str, Any]:
    """Deletes a delivery zone band."""
    try:
        supabase = get_supabase_client()
        check_is_admin(supabase, admin_email)

        res = supabase.table("delivery_zones").delete().eq("id", zone_id).execute()
        return {"success": True, "deleted_id": zone_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
