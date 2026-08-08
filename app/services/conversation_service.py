from datetime import date, datetime
from typing import Dict, Any, Optional
from supabase import Client

from app.services.whatsapp_client import send_whatsapp_text, send_whatsapp_button_message
from app.services.rate_service import get_today_rate
from app.services.delivery_service import calculate_delivery_charge
from app.services.stock_service import check_stock_limit
from app.services.order_service import validate_draft_order, create_order

# Message ID deduplication set
_processed_message_ids = set()

def get_or_create_customer(supabase: Client, phone_number: str) -> str:
    """Finds or creates a customer record matching the WhatsApp phone number."""
    clean_phone = phone_number.replace("+", "").replace(" ", "").strip()

    res = (
        supabase.table("customers")
        .select("id")
        .eq("phone_number", clean_phone)
        .maybeSingle()
        .execute()
    )

    if res.data:
        return res.data["id"]

    new_cust = (
        supabase.table("customers")
        .insert({
            "phone_number": clean_phone,
            "full_name": f"WhatsApp Customer ({clean_phone[-4:]})",
            "preferred_language": "ta"
        })
        .execute()
    )
    return new_cust.data[0]["id"] if new_cust.data else "wa_cust_fallback"


def get_conversation_state(supabase: Client, phone_number: str) -> Dict[str, Any]:
    """Fetches or initializes the conversation state for a phone number."""
    res = (
        supabase.table("conversation_state")
        .select("*")
        .eq("phone_number", phone_number)
        .maybeSingle()
        .execute()
    )

    if res.data:
        return res.data

    init_state = {
        "phone_number": phone_number,
        "current_step": "START",
        "draft_order": {}
    }
    try:
        supabase.table("conversation_state").insert(init_state).execute()
    except Exception:
        pass
    return init_state


def update_conversation_state(supabase: Client, phone_number: str, next_step: str, draft_order: Dict[str, Any]):
    """Updates the conversation state in Supabase."""
    supabase.table("conversation_state").upsert({
        "phone_number": phone_number,
        "current_step": next_step,
        "draft_order": draft_order,
        "updated_at": datetime.now().isoformat()
    }).execute()


def handle_whatsapp_message(
    supabase: Client,
    sender_phone: str,
    message_text: str,
    message_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main state machine router handling WhatsApp messages.
    """
    # Deduplicate webhook events
    if message_id:
        if message_id in _processed_message_ids:
            return {"status": "skipped", "reason": "Duplicate message ID"}
        _processed_message_ids.add(message_id)

    raw_text = message_text.strip()
    lowered = raw_text.lower()

    # Reset keywords check
    if lowered in ("restart", "cancel", "reset", "start"):
        update_conversation_state(supabase, sender_phone, "LANG", {})
        send_whatsapp_button_message(
            to_phone_number=sender_phone,
            body_text="🙏 Welcome to Fresh Meat Booking!\nChoose your preferred language / மொழியைத் தேர்ந்தெடுக்கவும்:",
            buttons=[
                {"id": "lang_ta", "title": "தமிழ் (Tamil)"},
                {"id": "lang_en", "title": "English"}
            ]
        )
        return {"status": "ok", "step": "LANG"}

    state = get_conversation_state(supabase, sender_phone)
    current_step = state.get("current_step", "START")
    draft = state.get("draft_order", {}) or {}

    # State Machine Transitions
    if current_step == "START":
        update_conversation_state(supabase, sender_phone, "LANG", {})
        send_whatsapp_button_message(
            to_phone_number=sender_phone,
            body_text="🙏 Welcome to Fresh Meat Booking!\nChoose your preferred language / மொழியைத் தேர்ந்தெடுக்கவும்:",
            buttons=[
                {"id": "lang_ta", "title": "தமிழ் (Tamil)"},
                {"id": "lang_en", "title": "English"}
            ]
        )
        return {"status": "ok", "step": "LANG"}

    elif current_step == "LANG":
        lang = "ta" if "ta" in lowered or "தமிழ்" in lowered else "en"
        draft["lang"] = lang
        update_conversation_state(supabase, sender_phone, "MEAT_TYPE", draft)

        msg = "கறி வகையைத் தேர்ந்தெடுக்கவும்:" if lang == "ta" else "Select Meat Type:"
        send_whatsapp_button_message(
            to_phone_number=sender_phone,
            body_text=msg,
            buttons=[
                {"id": "meat_chicken", "title": "Chicken (கோழி)"},
                {"id": "meat_mutton", "title": "Mutton (ஆடு)"},
                {"id": "meat_duck", "title": "Duck (வாத்து)"}
            ]
        )
        return {"status": "ok", "step": "MEAT_TYPE"}

    elif current_step == "MEAT_TYPE":
        if "mutton" in lowered or "ஆடு" in lowered:
            meat = "mutton"
        elif "duck" in lowered or "வாத்து" in lowered:
            meat = "duck"
        else:
            meat = "chicken"
        
        draft["meat_type"] = meat
        update_conversation_state(supabase, sender_phone, "QTY", draft)

        lang = draft.get("lang", "en")
        msg = f"தேர்ந்தெடுக்கப்பட்ட கறி: {meat.upper()}.\nதேவையான அளவை (கிலோவில்) தட்டச்சு செய்க (எ.கா: 1, 2, 0.5):" if lang == "ta" else f"Selected: {meat.upper()}.\nEnter quantity in kg (e.g. 1, 2, 0.5):"
        send_whatsapp_text(sender_phone, msg)
        return {"status": "ok", "step": "QTY"}

    elif current_step == "QTY":
        try:
            qty = float(raw_text.replace("kg", "").strip())
            if qty <= 0:
                raise ValueError()
        except Exception:
            send_whatsapp_text(sender_phone, "⚠️ Please enter a valid quantity in kg (e.g., 1 or 0.5):")
            return {"status": "invalid_input", "step": "QTY"}

        draft["quantity_kg"] = qty
        update_conversation_state(supabase, sender_phone, "CUTTING", draft)

        lang = draft.get("lang", "en")
        msg = "வெட்டும் முறையைத் தேர்ந்தெடுக்கவும்:" if lang == "ta" else "Select Cutting Preference:"
        send_whatsapp_button_message(
            to_phone_number=sender_phone,
            body_text=msg,
            buttons=[
                {"id": "cut_sirasa", "title": "Sirasa (Small)"},
                {"id": "cut_perusa", "title": "Perusa (Large)"},
                {"id": "cut_leg", "title": "Leg Piece"}
            ]
        )
        return {"status": "ok", "step": "CUTTING"}

    elif current_step == "CUTTING":
        if "perusa" in lowered or "large" in lowered:
            cut = "perusa"
        elif "leg" in lowered:
            cut = "legPiece"
        elif "whole" in lowered:
            cut = "whole"
        else:
            cut = "sirasa"

        draft["cutting_type"] = cut
        update_conversation_state(supabase, sender_phone, "DATE", draft)

        today_str = date.today().isoformat()
        tomorrow_str = date.fromordinal(date.today().toordinal() + 1).isoformat()

        lang = draft.get("lang", "en")
        msg = "டெலிவரி தேதியைத் தேர்ந்தெடுக்கவும்:" if lang == "ta" else "Select Delivery Date:"
        send_whatsapp_button_message(
            to_phone_number=sender_phone,
            body_text=msg,
            buttons=[
                {"id": f"date_{today_str}", "title": f"Today ({today_str})"},
                {"id": f"date_{tomorrow_str}", "title": f"Tomorrow ({tomorrow_str})"}
            ]
        )
        return {"status": "ok", "step": "DATE"}

    elif current_step == "DATE":
        if "tomorrow" in lowered or date.fromordinal(date.today().toordinal() + 1).isoformat() in lowered:
            deliv_date = date.fromordinal(date.today().toordinal() + 1).isoformat()
        else:
            deliv_date = date.today().isoformat()

        draft["delivery_date"] = deliv_date
        update_conversation_state(supabase, sender_phone, "TIME", draft)

        lang = draft.get("lang", "en")
        msg = "டெலிவரி நேரத்தைத் தேர்ந்தெடுக்கவும்:" if lang == "ta" else "Select Delivery Time Slot:"
        send_whatsapp_button_message(
            to_phone_number=sender_phone,
            body_text=msg,
            buttons=[
                {"id": "slot_5am", "title": "5:00 AM - 6:00 AM"},
                {"id": "slot_6am", "title": "6:00 AM - 7:00 AM"},
                {"id": "slot_7am", "title": "7:00 AM - 8:00 AM"}
            ]
        )
        return {"status": "ok", "step": "TIME"}

    elif current_step == "TIME":
        if "5" in lowered:
            slot = "5:00 AM - 6:00 AM"
        elif "7" in lowered:
            slot = "7:00 AM - 8:00 AM"
        else:
            slot = "6:00 AM - 7:00 AM"

        draft["delivery_time_slot"] = slot
        update_conversation_state(supabase, sender_phone, "FULFILLMENT", draft)

        lang = draft.get("lang", "en")
        msg = "டெலிவரி முறையைத் தேர்ந்தெடுக்கவும்:" if lang == "ta" else "Select Fulfillment Option:"
        send_whatsapp_button_message(
            to_phone_number=sender_phone,
            body_text=msg,
            buttons=[
                {"id": "ful_delivery", "title": "Home Delivery"},
                {"id": "ful_pickup", "title": "Store Pickup"}
            ]
        )
        return {"status": "ok", "step": "FULFILLMENT"}

    elif current_step == "FULFILLMENT":
        if "pickup" in lowered or "கடையில்" in lowered:
            draft["fulfillment_type"] = "pickup"
            draft["delivery_address"] = None
            draft["delivery_charge"] = 0.0
            update_conversation_state(supabase, sender_phone, "PAYMENT_METHOD", draft)

            send_whatsapp_button_message(
                to_phone_number=sender_phone,
                body_text="Select Payment Method:",
                buttons=[
                    {"id": "pay_online", "title": "Online Payment"},
                    {"id": "pay_cod", "title": "Cash on Delivery"}
                ]
            )
            return {"status": "ok", "step": "PAYMENT_METHOD"}
        else:
            draft["fulfillment_type"] = "delivery"
            update_conversation_state(supabase, sender_phone, "DELIVERY_ADDRESS", draft)
            send_whatsapp_text(sender_phone, "📍 Please type your full Delivery Address:")
            return {"status": "ok", "step": "DELIVERY_ADDRESS"}

    elif current_step == "DELIVERY_ADDRESS":
        draft["delivery_address"] = raw_text
        deliv_info = calculate_delivery_charge(supabase, customer_address=raw_text)
        draft["delivery_charge"] = deliv_info["delivery_charge"]

        update_conversation_state(supabase, sender_phone, "PAYMENT_METHOD", draft)
        send_whatsapp_button_message(
            to_phone_number=sender_phone,
            body_text=f"Delivery Fee ({deliv_info['delivery_zone']}): ₹{deliv_info['delivery_charge']}.\nSelect Payment Method:",
            buttons=[
                {"id": "pay_online", "title": "Online Payment"},
                {"id": "pay_cod", "title": "Cash on Delivery"}
            ]
        )
        return {"status": "ok", "step": "PAYMENT_METHOD"}

    elif current_step == "PAYMENT_METHOD":
        pay_method = "cod" if "cod" in lowered or "cash" in lowered else "online"
        draft["payment_method"] = pay_method

        # Calculate totals for confirmation
        rate_record = get_today_rate(supabase, meat_type=draft["meat_type"])
        rate = float(rate_record["rate_per_kg"]) if rate_record else 240.0
        item_total = round(rate * draft["quantity_kg"], 2)
        deliv_fee = float(draft.get("delivery_charge", 0.0))
        grand_total = round(item_total + deliv_fee, 2)

        draft["item_total"] = item_total
        draft["grand_total"] = grand_total

        update_conversation_state(supabase, sender_phone, "CONFIRM", draft)

        summary = (
            f"📋 *ORDER SUMMARY*\n"
            f"• Meat: {draft['meat_type'].upper()} ({draft['quantity_kg']} kg)\n"
            f"• Cutting: {draft['cutting_type']}\n"
            f"• Date/Slot: {draft['delivery_date']} ({draft['delivery_time_slot']})\n"
            f"• Total Amount: ₹{grand_total}\n"
            f"• Payment Method: {pay_method.upper()}\n\n"
            f"Confirm your order?"
        )

        send_whatsapp_button_message(
            to_phone_number=sender_phone,
            body_text=summary,
            buttons=[
                {"id": "confirm_yes", "title": "✅ Yes, Confirm"},
                {"id": "confirm_no", "title": "❌ Cancel"}
            ]
        )
        return {"status": "ok", "step": "CONFIRM"}

    elif current_step == "CONFIRM":
        if "yes" in lowered or "confirm" in lowered or "✅" in lowered:
            # Get or create customer ID
            cust_id = get_or_create_customer(supabase, sender_phone)

            # Create order using order_service
            created_order = create_order(
                supabase=supabase,
                customer_id=cust_id,
                meat_type=draft["meat_type"],
                quantity_kg=draft["quantity_kg"],
                cutting_type=draft["cutting_type"],
                delivery_date=draft["delivery_date"],
                delivery_time_slot=draft["delivery_time_slot"],
                fulfillment_type=draft["fulfillment_type"],
                delivery_address=draft.get("delivery_address"),
                payment_method=draft["payment_method"],
                source="whatsapp"
            )

            # Reset conversation state
            update_conversation_state(supabase, sender_phone, "START", {})

            payment_link = created_order.get("razorpay_payment_link")
            if draft["payment_method"] == "online" and payment_link:
                success_msg = (
                    f"🎉 *ORDER CREATED!*\n"
                    f"Order ID: `{created_order['id']}`\n"
                    f"Grand Total: ₹{created_order['grand_total']}\n\n"
                    f"🔗 *Complete your payment via Razorpay*:\n{payment_link}\n\n"
                    f"Your order will be processed once payment is confirmed!"
                )
            elif draft["payment_method"] == "online":
                success_msg = (
                    f"🎉 *ORDER CREATED!*\n"
                    f"Order ID: `{created_order['id']}`\n"
                    f"Grand Total: ₹{created_order['grand_total']}\n\n"
                    f"Please complete payment to confirm your booking."
                )
            else:
                success_msg = (
                    f"🎉 *ORDER CONFIRMED (COD)!*\n"
                    f"Order ID: `{created_order['id']}`\n"
                    f"Grand Total: ₹{created_order['grand_total']}\n\n"
                    f"Please pay cash upon delivery. Thank you!"
                )

            send_whatsapp_text(sender_phone, success_msg)
            return {"status": "ok", "step": "CONFIRM_YES", "order": created_order}

        else:
            update_conversation_state(supabase, sender_phone, "START", {})
            send_whatsapp_text(sender_phone, "Order cancelled. Type 'hi' to start a new booking anytime!")
            return {"status": "ok", "step": "CANCELLED"}

    return {"status": "ok"}
