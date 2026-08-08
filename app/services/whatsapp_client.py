import os
from typing import Dict, Any, Optional
import httpx

def send_whatsapp_text(to_phone_number: str, message_text: str) -> Dict[str, Any]:
    """
    Sends a text message using Meta's WhatsApp Cloud API.
    
    Environment variables needed:
    - WHATSAPP_ACCESS_TOKEN
    - WHATSAPP_PHONE_NUMBER_ID
    """
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    env = os.getenv("ENVIRONMENT", "development").lower()

    # Normalize phone number (strip + or spaces)
    clean_phone = to_phone_number.replace("+", "").replace(" ", "").replace("-", "")

    # Fallback simulation mode if token/phone_number_id are missing in development
    if not (access_token and phone_number_id):
        return {
            "status": "simulated",
            "to": clean_phone,
            "message": message_text,
            "note": "Mock WhatsApp Cloud API client (WHATSAPP_ACCESS_TOKEN not set)"
        }

    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message_text
        }
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.post(url, json=payload, headers=headers)
            if res.status_code not in (200, 201):
                return {
                    "status": "error",
                    "http_code": res.status_code,
                    "response": res.text
                }
            return res.json()
    except Exception as e:
        return {
            "status": "error",
            "exception": str(e)
        }
