import os
import hmac
import hashlib
from typing import Dict, Any, Optional
import httpx
from supabase import Client

def verify_razorpay_credentials() -> bool:
    """
    Validates Razorpay environment keys on backend startup.
    Fails fast with ValueError if credentials are missing, unless explicitly
    overridden by ENVIRONMENT=development or ALLOW_MOCK_PAYMENTS=true.
    """
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    env = os.getenv("ENVIRONMENT", "production").lower()
    allow_mock = os.getenv("ALLOW_MOCK_PAYMENTS", "false").lower() == "true"

    if not (key_id and key_secret):
        if env == "development" or allow_mock:
            return False  # Explicit development mock mode active
        raise ValueError(
            "CRITICAL SECURITY CONFIG ERROR: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables must be configured. "
            "Set ENVIRONMENT=development or ALLOW_MOCK_PAYMENTS=true to explicitly enable testing mode."
        )
    return True


def create_razorpay_payment_link(
    supabase: Client,
    order_id: str,
    customer_name: Optional[str] = None,
    customer_phone: Optional[str] = None,
    customer_email: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a Razorpay payment link for an order.
    
    SECURITY RULE: Always queries `grand_total` directly from `orders` database table using order_id.
    Never accepts client-supplied payment amounts.
    """
    has_creds = verify_razorpay_credentials()

    # 1. Fetch order directly from DB (never trust frontend amount)
    order_res = (
        supabase.table("orders")
        .select("id, grand_total, payment_status, customer_id")
        .eq("id", order_id)
        .single()
        .execute()
    )

    if not order_res.data:
        raise ValueError(f"Order '{order_id}' not found in database.")

    order = order_res.data
    grand_total = float(order["grand_total"])

    if grand_total <= 0:
        raise ValueError(f"Invalid order total: ₹{grand_total}")

    # Convert to paise for Razorpay API (e.g. ₹250.50 -> 25050 paise)
    amount_in_paise = int(round(grand_total * 100))

    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")

    # Explicit development mode fallback if keys are missing and ENVIRONMENT=development
    if not has_creds:
        return {
            "payment_link_id": f"plink_mock_{order_id[:8]}",
            "short_url": f"https://razorpay.me/pay/mock_order_{order_id[:8]}",
            "status": "created",
            "is_mock": True
        }

    # Call Razorpay API v1/payment_links
    url = "https://api.razorpay.com/v1/payment_links"
    payload = {
        "amount": amount_in_paise,
        "currency": "INR",
        "accept_partial": False,
        "reference_id": order_id,
        "description": f"Payment for Order #{order_id[:8]}",
        "customer": {
            "name": customer_name or "Customer",
            "contact": customer_phone or "",
            "email": customer_email or ""
        },
        "notify": {
            "sms": True,
            "email": True
        },
        "callback_url": f"{os.getenv('APP_BASE_URL', 'http://localhost:3000')}/order-confirmation/{order_id}",
        "callback_method": "get"
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.post(url, json=payload, auth=(key_id, key_secret))
            if res.status_code not in (200, 201):
                raise RuntimeError(f"Razorpay API Error ({res.status_code}): {res.text}")
            
            data = res.json()
            return {
                "payment_link_id": data.get("id"),
                "short_url": data.get("short_url"),
                "status": data.get("status"),
                "is_mock": False
            }
    except Exception as e:
        raise RuntimeError(f"Failed to generate Razorpay Payment Link: {str(e)}")
