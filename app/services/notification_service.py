from typing import Dict, Any, Optional
from supabase import Client
from app.services.whatsapp_client import send_whatsapp_text

def send_order_status_notification(supabase: Client, order_id: str, new_status: str) -> Dict[str, Any]:
    """
    Fetches customer phone number for order_id and sends a WhatsApp status update message
    regardless of booking source (Website or WhatsApp).
    """
    try:
        # Fetch order details using .execute()
        order_res = (
            supabase.table("orders")
            .select("id, customer_id, meat_type, quantity_kg, delivery_date, delivery_time_slot, grand_total, order_status")
            .eq("id", order_id)
            .execute()
        )

        if not (order_res.data and len(order_res.data) > 0):
            return {"status": "error", "reason": "Order not found"}

        order = order_res.data[0]
        cust_id = order.get("customer_id")

        if not cust_id:
            return {"status": "error", "reason": "No customer associated with order"}

        # Fetch customer phone number
        cust_res = (
            supabase.table("customers")
            .select("phone_number")
            .eq("id", cust_id)
            .execute()
        )

        if not (cust_res.data and len(cust_res.data) > 0 and cust_res.data[0].get("phone_number")):
            return {"status": "error", "reason": "Customer phone number not found"}

        phone_number = cust_res.data[0]["phone_number"]
        status_norm = new_status.lower().strip()

        status_messages = {
            "preparing": f"👨‍🍳 *Order Update!*\nYour order #{order['id']} ({order['meat_type']} {order['quantity_kg']}kg) is now being freshly prepared!",
            "out_for_delivery": f"🛵 *Out for Delivery!*\nYour order #{order['id']} is out for delivery. Our driver will reach you during your slot: {order['delivery_time_slot']}.",
            "delivered": f"✅ *Order Delivered!*\nYour order #{order['id']} has been delivered successfully. Enjoy your fresh meat!",
            "cancelled": f"❌ *Order Cancelled*\nYour order #{order['id']} has been cancelled."
        }

        msg_body = status_messages.get(
            status_norm,
            f"📋 *Order Update*\nYour order #{order['id']} status is now: {new_status.upper()}"
        )

        whatsapp_res = send_whatsapp_text(to_phone_number=phone_number, message_text=msg_body)
        return {"status": "success", "response": whatsapp_res}
    except Exception as e:
        return {"status": "error", "exception": str(e)}
