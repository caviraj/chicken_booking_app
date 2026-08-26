import os
from typing import Dict, Any, List, Optional
import httpx

def send_whatsapp_text(to_phone_number: str, message_text: str) -> Dict[str, Any]:
    """
    WhatsApp integration disabled per configuration.
    """
    return {
        "status": "disabled",
        "message": "WhatsApp integration is disabled"
    }


def send_whatsapp_button_message(
    to_phone_number: str,
    body_text: str,
    buttons: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    WhatsApp integration disabled per configuration.
    """
    return {
        "status": "disabled",
        "message": "WhatsApp integration is disabled"
    }
