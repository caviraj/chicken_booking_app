from datetime import date, datetime
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
    meat_type: str = Field(..., example="chicken")
    quantity_kg: float = Field(..., gt=0, example=1.5)
    delivery_date: date = Field(..., example="2026-08-09")

class CalculateDeliveryRequest(BaseModel):
    customer_address: str = Field(..., example="123 Main Street, Chennai")
    shop_lat: Optional[float] = None
    shop_lng: Optional[float] = None

class CreateOrderRequest(BaseModel):
    customer_id: str
    meat_type: str
    quantity_kg: float = Field(..., gt=0)
    cutting_type: str
    delivery_date: date
    delivery_time_slot: str
    fulfillment_type: str = Field("delivery", example="delivery")
    delivery_address: Optional[str] = None
    payment_method: str = Field("online", example="online")
    source: str = Field("website", example="website")


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
        # Fallback for dev/mock mode when SUPABASE_URL environment variables are not set
        raise HTTPException(status_code=500, detail=str(e))

    meat_types = ["chicken", "mutton", "duck"]
    rates: Dict[str, Any] = {}

    for meat in meat_types:
        rate_record = get_today_rate(supabase, meat_type=meat, target_date=target_date)
        if rate_record:
            rates[meat] = rate_record
        else:
            # Default fallbacks if rates table hasn't been populated yet
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
