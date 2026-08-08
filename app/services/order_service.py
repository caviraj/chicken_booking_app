from datetime import date, datetime, time
from typing import Dict, Any, Union, Optional, List
from supabase import Client

from app.services.rate_service import get_today_rate
from app.services.stock_service import check_stock_limit
from app.services.delivery_service import calculate_delivery_charge

def validate_draft_order(
    supabase: Client,
    meat_type: str,
    quantity_kg: float,
    delivery_date: Union[date, str],
    now_datetime: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Validates a draft order against cutoff time and daily stock limits.

    Args:
        supabase (Client): Initialized Supabase client.
        meat_type (str): Meat type.
        quantity_kg (float): Order quantity in kg.
        delivery_date (Union[date, str]): Intended delivery date.
        now_datetime (Optional[datetime]): Reference datetime (defaults to current local time).

    Returns:
        Dict[str, Any]: Validation result {"valid": bool, "errors": List[str]}
    """
    errors: List[str] = []
    
    if quantity_kg <= 0:
        errors.append("Quantity must be greater than zero.")

    date_obj = delivery_date if isinstance(delivery_date, date) else date.fromisoformat(str(delivery_date))
    ref_dt = now_datetime or datetime.now()

    # 1. Check cutoff time if delivery is for today
    if date_obj == ref_dt.date():
        settings_res = (
            supabase.table("admin_settings")
            .select("order_cutoff_time")
            .limit(1)
            .execute()
        )
        if settings_res.data and len(settings_res.data) > 0:
            cutoff_val = settings_res.data[0].get("order_cutoff_time")
            if cutoff_val:
                if isinstance(cutoff_val, str):
                    h, m = map(int, cutoff_val.split(":")[:2])
                    cutoff_time = time(h, m)
                else:
                    cutoff_time = cutoff_val

                if ref_dt.time() >= cutoff_time:
                    errors.append(f"Order cutoff time ({cutoff_val}) has passed for today.")

    # 2. Check daily stock limit
    stock_check = check_stock_limit(
        supabase=supabase,
        meat_type=meat_type,
        delivery_date=date_obj,
        requested_kg=quantity_kg
    )

    if not stock_check["available"]:
        remaining = stock_check.get("remaining_kg", 0.0)
        errors.append(
            f"Daily stock limit exceeded for {meat_type} on {date_obj}. "
            f"Remaining available: {remaining} kg."
        )

    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


def create_order(
    supabase: Client,
    customer_id: str,
    meat_type: str,
    quantity_kg: float,
    cutting_type: str,
    delivery_date: Union[date, str],
    delivery_time_slot: str,
    fulfillment_type: str = "delivery",
    delivery_address: Optional[str] = None,
    payment_method: str = "online",
    source: str = "website",
    now_datetime: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Validates, calculates item total and grand total, and inserts a new order into `orders` table.

    Args:
        supabase (Client): Initialized Supabase client.
        customer_id (str): ID of customer placing the order.
        meat_type (str): Meat type ('chicken', 'mutton', 'duck', etc.).
        quantity_kg (float): Order weight in kg.
        cutting_type (str): Preferred cutting style.
        delivery_date (Union[date, str]): Delivery date.
        delivery_time_slot (str): Time slot string (e.g. '6AM').
        fulfillment_type (str): 'delivery' or 'pickup'.
        delivery_address (Optional[str]): Street address for delivery.
        payment_method (str): 'online' or 'cod'.
        source (str): 'website' or 'whatsapp'.
        now_datetime (Optional[datetime]): Optional reference time for cutoff check.

    Returns:
        Dict[str, Any]: The newly created order record from Supabase.
    """
    normalized_meat_type = meat_type.strip().lower()
    date_str = delivery_date.isoformat() if isinstance(delivery_date, date) else str(delivery_date)

    # 1. Validate order
    validation = validate_draft_order(
        supabase=supabase,
        meat_type=normalized_meat_type,
        quantity_kg=quantity_kg,
        delivery_date=date_str,
        now_datetime=now_datetime
    )

    if not validation["valid"]:
        raise ValueError(f"Order validation failed: {'; '.join(validation['errors'])}")

    # 2. Get applicable meat rate
    rate_record = get_today_rate(
        supabase=supabase,
        meat_type=normalized_meat_type,
        target_date=date.fromisoformat(date_str)
    )

    if not rate_record:
        raise ValueError(f"No rate available for meat type '{normalized_meat_type}' on {date_str}.")

    rate_per_kg = float(rate_record["rate_per_kg"])
    item_total = round(rate_per_kg * quantity_kg, 2)

    # 3. Calculate delivery charge
    delivery_charge = 0.0
    delivery_zone_name: Optional[str] = None

    if fulfillment_type.lower() == "delivery":
        if not delivery_address:
            raise ValueError("Delivery address is required for fulfillment type 'delivery'.")
        
        delivery_info = calculate_delivery_charge(
            supabase=supabase,
            customer_address=delivery_address
        )
        delivery_charge = float(delivery_info["delivery_charge"])
        delivery_zone_name = delivery_info.get("delivery_zone")

    grand_total = round(item_total + delivery_charge, 2)

    # 4. Insert into orders table
    order_payload = {
        "customer_id": customer_id,
        "source": source,
        "meat_type": normalized_meat_type,
        "quantity_kg": quantity_kg,
        "cutting_type": cutting_type,
        "delivery_date": date_str,
        "delivery_time_slot": delivery_time_slot,
        "fulfillment_type": fulfillment_type.lower(),
        "delivery_address": delivery_address if fulfillment_type.lower() == "delivery" else None,
        "delivery_zone": delivery_zone_name,
        "delivery_charge": delivery_charge,
        "item_total": item_total,
        "grand_total": grand_total,
        "payment_method": payment_method.lower(),
        "payment_status": "pending",
        "order_status": "confirmed"
    }

    insert_res = (
        supabase.table("orders")
        .insert(order_payload)
        .execute()
    )

    if not insert_res.data:
        raise RuntimeError("Failed to create order in database.")

    return insert_res.data[0]
