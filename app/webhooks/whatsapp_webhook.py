import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse

from app.core.supabase import get_supabase_client
from app.services.conversation_service import handle_whatsapp_message

router = APIRouter(prefix="/webhooks", tags=["WhatsApp Webhook"])

@router.get("/whatsapp")
def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge")
):
    """
    Handles Meta's Webhook verification GET request.
    Validates hub.verify_token against WHATSAPP_VERIFY_TOKEN env var.
    """
    expected_verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "meat_booking_secret_token_123")

    if hub_mode == "subscribe" and hub_verify_token == expected_verify_token:
        if hub_challenge:
            return PlainTextResponse(content=hub_challenge, status_code=200)

    raise HTTPException(status_code=403, detail="Forbidden. Verification token mismatch.")


@router.post("/whatsapp")
async def process_whatsapp_webhook(request: Request) -> Dict[str, Any]:
    """
    Handles incoming POST messages from WhatsApp Cloud API and routes to conversation_service.
    """
    try:
        body = await request.json()
        supabase = get_supabase_client()

        entries = body.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])

                for msg in messages:
                    sender_phone = msg.get("from")
                    msg_id = msg.get("id")
                    msg_type = msg.get("type")

                    message_text = ""
                    if msg_type == "text":
                        message_text = msg.get("text", {}).get("body", "")
                    elif msg_type == "interactive":
                        # Support interactive button replies
                        interactive = msg.get("interactive", {})
                        reply = interactive.get("button_reply", {}) or interactive.get("list_reply", {})
                        message_text = reply.get("title", "") or reply.get("id", "")

                    if sender_phone and message_text:
                        handle_whatsapp_message(
                            supabase=supabase,
                            sender_phone=sender_phone,
                            message_text=message_text,
                            message_id=msg_id
                        )

        return {"status": "ok"}
    except Exception as e:
        return {"status": "ok", "error": str(e)}
