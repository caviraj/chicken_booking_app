import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import PlainTextResponse

from app.services.whatsapp_client import send_whatsapp_text

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
            # Return raw challenge string with 200 OK as required by Meta
            return PlainTextResponse(content=hub_challenge, status_code=200)

    raise HTTPException(status_code=403, detail="Forbidden. Verification token mismatch.")


@router.post("/whatsapp")
async def process_whatsapp_webhook(request: Request) -> Dict[str, Any]:
    """
    Handles incoming POST messages from WhatsApp Cloud API.
    Extracts user's text message and echoes back text for test verification.
    """
    try:
        body = await request.json()

        # Check if incoming payload contains a WhatsApp message entry
        entries = body.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])

                for msg in messages:
                    sender_phone = msg.get("from")
                    msg_type = msg.get("type")

                    if msg_type == "text" and sender_phone:
                        text_body = msg.get("text", {}).get("body", "")

                        # Echo test logic: Send back whatever text user sent
                        echo_message = f"Echo: {text_body}"
                        send_whatsapp_text(to_phone_number=sender_phone, message_text=echo_message)

        # Meta expects 200 OK response quickly
        return {"status": "ok"}
    except Exception as e:
        # Always return 200 OK to Meta to avoid retry loop on unexpected payload structures
        return {"status": "ok", "error": str(e)}
