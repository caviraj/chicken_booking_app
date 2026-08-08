import os
import hmac
import hashlib
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.services.conversation_service import handle_whatsapp_message

client = TestClient(app)

@patch("app.services.conversation_service.send_whatsapp_text")
@patch("app.services.conversation_service.get_or_create_customer")
@patch("app.services.conversation_service.create_order")
@patch("app.services.conversation_service.get_conversation_state")
@patch("app.services.conversation_service.update_conversation_state")
def test_whatsapp_confirm_yes_delivers_razorpay_link(
    mock_update, mock_get_state, mock_create_order, mock_get_cust, mock_send_text
):
    """Test CONFIRM step sending Razorpay payment link over WhatsApp for online orders."""
    mock_supabase = MagicMock()
    mock_get_state.return_value = {
        "current_step": "CONFIRM",
        "draft_order": {
            "meat_type": "chicken",
            "quantity_kg": 1.0,
            "cutting_type": "sirasa",
            "delivery_date": "2026-08-09",
            "delivery_time_slot": "6:00 AM - 7:00 AM",
            "fulfillment_type": "delivery",
            "payment_method": "online",
            "grand_total": 270.0
        }
    }
    mock_get_cust.return_value = "cust-1"
    mock_create_order.return_value = {
        "id": "ord-online-777",
        "grand_total": 270.0,
        "razorpay_payment_link": "https://razorpay.me/pay/mock_link_777"
    }

    res = handle_whatsapp_message(mock_supabase, "919876543210", "Yes")
    assert res["status"] == "ok"
    mock_send_text.assert_called_once()
    assert "https://razorpay.me/pay/mock_link_777" in mock_send_text.call_args[0][1]


@patch("app.services.whatsapp_client.send_whatsapp_text")
@patch("app.webhooks.razorpay_webhook.get_supabase_client")
def test_razorpay_webhook_triggers_whatsapp_notification(mock_get_client, mock_send_whatsapp):
    """Test Razorpay payment.captured event sending WhatsApp confirmation to customer."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase

    # Mock orders table response
    orders_table = MagicMock()
    orders_res = MagicMock()
    orders_res.data = {
        "id": "ord-888",
        "customer_id": "cust-888",
        "payment_status": "pending",
        "razorpay_payment_id": None
    }
    orders_table.select.return_value = orders_table
    orders_table.eq.return_value = orders_table
    orders_table.maybeSingle.return_value = orders_table
    orders_table.update.return_value = orders_table
    orders_table.execute.return_value = orders_res

    # Mock customers table response
    cust_table = MagicMock()
    cust_res = MagicMock()
    cust_res.data = {
        "phone_number": "919876543210"
    }
    cust_table.select.return_value = cust_table
    cust_table.eq.return_value = cust_table
    cust_table.maybeSingle.return_value = cust_table
    cust_table.execute.return_value = cust_res

    def table_router(name):
        if name == "orders":
            return orders_table
        if name == "customers":
            return cust_table
        return MagicMock()

    mock_supabase.table.side_effect = table_router

    secret = "test_secret_key"
    body = b'{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_111","description":"ord-888"}}}}'
    sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    with patch.dict(os.environ, {"RAZORPAY_WEBHOOK_SECRET": secret}, clear=True):
        response = client.post(
            "/webhooks/razorpay",
            content=body,
            headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        mock_send_whatsapp.assert_called_once_with(
            "919876543210",
            "✅ *Payment Received!*\nWe received payment for Order #ord-888.\nThank you for choosing Fresh Meat Booking!"
        )
