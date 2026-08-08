from datetime import date, datetime, time
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from app.core.supabase import get_supabase_client
from app.services.rate_service import get_today_rate
from app.services.delivery_service import calculate_delivery_charge
from app.services.stock_service import check_stock_limit
from app.services.order_service import validate_draft_order, create_order

router = APIRouter(prefix="/api/booking", tags=["Booking"])

# Pydantic Schemas
class ValidateOrderRequest(BaseModel):
    meat_type: str = Field(..., description="chicken, mutton, duck")
    quantity_kg: float = Field(..., gt=0)
    delivery_date: date = Field(...)

class CalculateDeliveryRequest(BaseModel):
    customer_address: str = Field(...)
    shop_lat: Optional[float] = None
    shop_lng: Optional[float] = None

class CreateOrderRequest(BaseModel):
    customer_id: str
    meat_type: str
    quantity_kg: float = Field(..., gt=0)
    cutting_type: str
    delivery_date: date
    delivery_time_slot: str
    fulfillment_type: str = Field("delivery")
    delivery_address: Optional[str] = None
    payment_method: str = Field("online")
    source: str = Field("website")

class CancelOrderRequest(BaseModel):
    order_id: str
    customer_id: str


@router.get("/rates")
def get_meat_rates(
    target_date: Optional[date] = Query(None, description="Optional rate effective date")
) -> Dict[str, Any]:
    """
    Fetches available daily meat rates (chicken, mutton, duck/vaathu) calling rate_service.
    """
    try:
        supabase = get_supabase_client()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    meat_types = ["chicken", "mutton", "duck"]
    rates: Dict[str, Any] = {}

    for meat in meat_types:
        rate_record = get_today_rate(supabase, meat_type=meat, target_date=target_date)
        if rate_record:
            rates[meat] = rate_record
        else:
            default_rates = {"chicken": 240.0, "mutton": 750.0, "duck": 380.0}
            rates[meat] = {
                "meat_type": meat,
                "rate_per_kg": default_rates.get(meat, 250.0),
                "effective_date": (target_date or date.today()).isoformat(),
                "is_fallback": True
            }

    return {"rates": rates}


@router.post("/validate")
def validate_booking(req: ValidateOrderRequest) -> Dict[str, Any]:
    """
    Validates a draft booking against cutoff time and daily stock limit calling order_service.
    """
    try:
        supabase = get_supabase_client()
        result = validate_draft_order(
            supabase=supabase,
            meat_type=req.meat_type,
            quantity_kg=req.quantity_kg,
            delivery_date=req.delivery_date
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/calculate-delivery")
def get_delivery_fee(req: CalculateDeliveryRequest) -> Dict[str, Any]:
    """
    Calculates delivery fee and zone calling delivery_service.
    """
    try:
        supabase = get_supabase_client()
        result = calculate_delivery_charge(
            supabase=supabase,
            customer_address=req.customer_address,
            shop_lat=req.shop_lat,
            shop_lng=req.shop_lng
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders")
def create_new_order(req: CreateOrderRequest) -> Dict[str, Any]:
    """
    Validates draft order, calculates totals, and inserts into orders table calling order_service.
    """
    try:
        supabase = get_supabase_client()
        order = create_order(
            supabase=supabase,
            customer_id=req.customer_id,
            meat_type=req.meat_type,
            quantity_kg=req.quantity_kg,
            cutting_type=req.cutting_type,
            delivery_date=req.delivery_date,
            delivery_time_slot=req.delivery_time_slot,
            fulfillment_type=req.fulfillment_type,
            delivery_address=req.delivery_address,
            payment_method=req.payment_method,
            source=req.source
        )
        return {"success": True, "order": order}
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/customer/{customer_id}")
def get_customer_orders(customer_id: str) -> Dict[str, Any]:
    """
    Fetches all orders belonging to customer_id ordered by created_at DESC.
    """
    try:
        supabase = get_supabase_client()
        res = (
            supabase.table("orders")
            .select("*")
            .eq("customer_id", customer_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"orders": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/cancel")
def cancel_order(req: CancelOrderRequest) -> Dict[str, Any]:
    """
    Cancels an order if the daily booking cutoff time has not passed for that delivery date.
    """
    try:
        supabase = get_supabase_client()

        # 1. Fetch target order
        order_res = (
            supabase.table("orders")
            .select("*")
            .eq("id", req.order_id)
            .eq("customer_id", req.customer_id)
            .single()
            .execute()
        )

        if not order_res.data:
            raise HTTPException(status_code=404, detail="Order not found")

        order = order_res.data

        if order.get("order_status") == "cancelled":
            return {"success": True, "message": "Order is already cancelled", "order": order}

        if order.get("order_status") in ("delivered", "completed"):
            raise HTTPException(status_code=400, detail="Completed or delivered orders cannot be cancelled.")

        # 2. Check cutoff time if delivery date is today
        deliv_date = date.fromisoformat(str(order["delivery_date"]))
        today = date.today()

        if deliv_date == today:
            settings_res = (
                supabase.table("admin_settings")
                .select("order_cutoff_time")
                .limit(1)
                .execute()
            )
            cutoff_str = "20:00"
            if settings_res.data and len(settings_res.data) > 0:
                cutoff_str = settings_res.data[0].get("order_cutoff_time") or "20:00"

            h, m = map(int, cutoff_str.split(":")[:2])
            cutoff_t = time(h, m)

            if datetime.now().time() >= cutoff_t:
                raise HTTPException(
                    status_code=400,
                    detail=f"Order cannot be cancelled after the daily cutoff time ({cutoff_str})."
                )
        elif deliv_date < today:
            raise HTTPException(status_code=400, detail="Cannot cancel past orders.")

        # 3. Update order_status to cancelled
        updated_res = (
            supabase.table("orders")
            .update({"order_status": "cancelled"})
            .eq("id", req.order_id)
            .execute()
        )

        return {
            "success": True,
            "message": "Order cancelled successfully",
            "order": updated_res.data[0] if updated_res.data else order
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
