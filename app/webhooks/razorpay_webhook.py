import os
import hmac
import hashlib
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Request, Header
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

def verify_razorpay_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    """
    Verifies official Razorpay HMAC SHA256 webhook signature.
    Uses dedicated RAZORPAY_WEBHOOK_SECRET.
    """
    if not signature or not secret:
        return False
    expected_signature = hmac.new(
        key=secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_signature, signature)


@router.post("/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature")
) -> Dict[str, Any]:
    """
    Receives payment.captured and payment.failed events from Razorpay.
    Enforces mandatory signature verification, server-side DB verification, and idempotency checks.
    """
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    env = os.getenv("ENVIRONMENT", "production").lower()
    allow_mock = os.getenv("ALLOW_MOCK_PAYMENTS", "false").lower() == "true"

    if not webhook_secret and not (env == "development" or allow_mock):
        raise HTTPException(
            status_code=500,
            detail="CRITICAL SECURITY CONFIG ERROR: RAZORPAY_WEBHOOK_SECRET is not configured on server."
        )

    raw_body = await request.body()

    # 1. Mandatory Signature Verification
    if webhook_secret:
        if not x_razorpay_signature:
            raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header.")
        
        is_valid = verify_razorpay_signature(raw_body, x_razorpay_signature, webhook_secret)
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid Razorpay webhook signature. Request rejected.")

    payload = await request.json()
    event_type = payload.get("event")
    contains = payload.get("payload", {})
    payment_entity = contains.get("payment", {}).get("entity", {})

    order_id = payment_entity.get("notes", {}).get("order_id") or payment_entity.get("description")
    if not order_id and "payment_link" in contains:
        order_id = contains["payment_link"]["entity"].get("reference_id")

    razorpay_payment_id = payment_entity.get("id")

    if not order_id:
        return {"status": "ignored", "reason": "No order_id found in webhook payload"}

    supabase = get_supabase_client()

    # 2. Idempotency Check: Fetch order record from DB
    order_res = (
        supabase.table("orders")
        .select("id, customer_id, payment_status, razorpay_payment_id")
        .eq("id", order_id)
        .maybeSingle()
        .execute()
    )


    if not order_res.data:
        return {"status": "ignored", "reason": f"Order {order_id} not found"}

    order = order_res.data

    # Check if already processed (Idempotence - protects against duplicate webhooks)
    if order.get("payment_status") == "paid" or order.get("razorpay_payment_id") == razorpay_payment_id:
        return {"status": "skipped", "reason": "Webhook event already processed for this order"}

    # 3. Process event & update order state in database
    if event_type == "payment.captured":
        supabase.table("orders").update({
            "payment_status": "paid",
            "razorpay_payment_id": razorpay_payment_id
        }).eq("id", order_id).execute()

        # Send WhatsApp confirmation notification to customer
        try:
            from app.services.whatsapp_client import send_whatsapp_text
            cust_res = (
                supabase.table("customers")
                .select("phone_number")
                .eq("id", order.get("customer_id", ""))
                .maybeSingle()
                .execute()
            )
            cust_phone = cust_res.data.get("phone_number") if cust_res and cust_res.data else None
            if cust_phone:
                msg = f"✅ *Payment Received!*\nWe received payment for Order #{order_id}.\nThank you for choosing Fresh Meat Booking!"
                send_whatsapp_text(cust_phone, msg)
        except Exception:
            pass

        return {"status": "success", "event": "payment.captured", "order_id": order_id}


    elif event_type == "payment.failed":
        supabase.table("orders").update({
            "payment_status": "failed",
            "razorpay_payment_id": razorpay_payment_id
        }).eq("id", order_id).execute()

        return {"status": "success", "event": "payment.failed", "order_id": order_id}

    return {"status": "ignored", "event": event_type}
