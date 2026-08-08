import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import pytest

from app.main import app

client = TestClient(app)

def test_whatsapp_verification_success():
    """Test Meta GET webhook verification challenge succeeds with matching token."""
    with patch.dict(os.environ, {"WHATSAPP_VERIFY_TOKEN": "secret_token_abc"}, clear=True):
        params = {
            "hub.mode": "subscribe",
            "hub.verify_token": "secret_token_abc",
            "hub.challenge": "115820120"
        }
        response = client.get("/webhooks/whatsapp", params=params)
        assert response.status_code == 200
        assert response.text == "115820120"


def test_whatsapp_verification_failure():
    """Test Meta GET webhook verification challenge fails with HTTP 403 when token mismatches."""
    with patch.dict(os.environ, {"WHATSAPP_VERIFY_TOKEN": "secret_token_abc"}, clear=True):
        params = {
            "hub.mode": "subscribe",
            "hub.verify_token": "wrong_token",
            "hub.challenge": "115820120"
        }
        response = client.get("/webhooks/whatsapp", params=params)
        assert response.status_code == 403
        assert "Verification token mismatch" in response.json()["detail"]


@patch("app.webhooks.whatsapp_webhook.send_whatsapp_text")
def test_whatsapp_post_echo_message(mock_send_text):
    """Test POST webhook receives incoming text message and echoes it back."""
    mock_send_text.return_value = {"status": "simulated"}

    payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "100200300",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {"display_phone_number": "1555000", "phone_number_id": "999"},
                            "messages": [
                                {
                                    "from": "919876543210",
                                    "id": "wamid.HBgL",
                                    "timestamp": "1700000000",
                                    "text": {"body": "Hello Chicken Shop!"},
                                    "type": "text"
                                }
                            ]
                        },
                        "field": "messages"
                    }
                ]
            }
        ]
    }

    response = client.post("/webhooks/whatsapp", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    mock_send_text.assert_called_once_with(
        to_phone_number="919876543210",
        message_text="Echo: Hello Chicken Shop!"
    )
