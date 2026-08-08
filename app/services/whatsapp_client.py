import os
from typing import Dict, Any, List, Optional
import httpx

def send_whatsapp_text(to_phone_number: str, message_text: str) -> Dict[str, Any]:
    """
    Sends a plain text message using Meta's WhatsApp Cloud API.
    """
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    clean_phone = to_phone_number.replace("+", "").replace(" ", "").replace("-", "")

    if not (access_token and phone_number_id):
        return {
            "status": "simulated",
            "to": clean_phone,
            "message": message_text,
            "type": "text"
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
            return res.json() if res.status_code in (200, 201) else {"status": "error", "code": res.status_code}
    except Exception as e:
        return {"status": "error", "exception": str(e)}


def send_whatsapp_button_message(
    to_phone_number: str,
    body_text: str,
    buttons: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Sends an interactive quick-reply button message.
    
    Args:
        to_phone_number (str): Recipient phone number.
        body_text (str): Main message body text.
        buttons (List[Dict[str, str]]): List of buttons e.g. [{"id": "btn_en", "title": "English"}]
    """
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    clean_phone = to_phone_number.replace("+", "").replace(" ", "").replace("-", "")

    if not (access_token and phone_number_id):
        button_titles = [b["title"] for b in buttons]
        return {
            "status": "simulated",
            "to": clean_phone,
            "message": f"{body_text}\nOptions: [{', '.join(button_titles)}]",
            "type": "interactive_button"
        }

    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    formatted_buttons = []
    for btn in buttons[:3]: # Meta limits quick reply buttons to 3
        formatted_buttons.append({
            "type": "reply",
            "reply": {
                "id": btn["id"],
                "title": btn["title"][:20] # Max 20 chars
            }
        })

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_phone,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body_text},
            "action": {"buttons": formatted_buttons}
        }
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.post(url, json=payload, headers=headers)
            return res.json() if res.status_code in (200, 201) else {"status": "error", "code": res.status_code}
    except Exception as e:
        return {"status": "error", "exception": str(e)}
