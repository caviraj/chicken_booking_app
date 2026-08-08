from unittest.mock import patch, MagicMock
import pytest

from app.services.conversation_service import (
    handle_whatsapp_message,
    get_or_create_customer,
    get_conversation_state
)

@patch("app.services.conversation_service.send_whatsapp_button_message")
@patch("app.services.conversation_service.get_conversation_state")
@patch("app.services.conversation_service.update_conversation_state")
def test_conversation_start_and_restart(mock_update, mock_get_state, mock_send_btn):
    """Test start and restart keyword handling."""
    mock_supabase = MagicMock()
    mock_get_state.return_value = {"current_step": "START", "draft_order": {}}

    res = handle_whatsapp_message(mock_supabase, "919876543210", "restart")
    assert res["status"] == "ok"
    assert res["step"] == "LANG"
    mock_send_btn.assert_called_once()


@patch("app.services.conversation_service.send_whatsapp_button_message")
@patch("app.services.conversation_service.get_conversation_state")
@patch("app.services.conversation_service.update_conversation_state")
def test_conversation_step_lang_to_meat(mock_update, mock_get_state, mock_send_btn):
    """Test LANG step transitioning to MEAT_TYPE."""
    mock_supabase = MagicMock()
    mock_get_state.return_value = {"current_step": "LANG", "draft_order": {}}

    res = handle_whatsapp_message(mock_supabase, "919876543210", "English")
    assert res["status"] == "ok"
    assert res["step"] == "MEAT_TYPE"
    mock_update.assert_called_once()


@patch("app.services.conversation_service.send_whatsapp_text")
@patch("app.services.conversation_service.get_conversation_state")
@patch("app.services.conversation_service.update_conversation_state")
def test_conversation_invalid_qty_input(mock_update, mock_get_state, mock_send_text):
    """Test QTY step invalid input re-prompting user."""
    mock_supabase = MagicMock()
    mock_get_state.return_value = {"current_step": "QTY", "draft_order": {"meat_type": "chicken"}}

    res = handle_whatsapp_message(mock_supabase, "919876543210", "invalid_weight")
    assert res["status"] == "invalid_input"
    mock_send_text.assert_called_once()


@patch("app.services.conversation_service.create_order")
@patch("app.services.conversation_service.get_or_create_customer")
@patch("app.services.conversation_service.send_whatsapp_text")
@patch("app.services.conversation_service.get_conversation_state")
@patch("app.services.conversation_service.update_conversation_state")
def test_conversation_confirm_yes_creates_order(
    mock_update, mock_get_state, mock_send_text, mock_get_cust, mock_create_order
):
    """Test CONFIRM step creating order via order_service with source='whatsapp'."""
    mock_supabase = MagicMock()
    mock_get_state.return_value = {
        "current_step": "CONFIRM",
        "draft_order": {
            "meat_type": "chicken",
            "quantity_kg": 2.0,
            "cutting_type": "sirasa",
            "delivery_date": "2026-08-09",
            "delivery_time_slot": "6:00 AM - 7:00 AM",
            "fulfillment_type": "delivery",
            "delivery_address": "123 Main St",
            "payment_method": "online",
            "grand_total": 510.0
        }
    }

    mock_get_cust.return_value = "cust-wa-123"
    mock_create_order.return_value = {
        "id": "wa-ord-1",
        "grand_total": 510.0
    }

    res = handle_whatsapp_message(mock_supabase, "919876543210", "Yes")
    assert res["status"] == "ok"
    assert res["step"] == "CONFIRM_YES"
    mock_create_order.assert_called_once()
    assert mock_create_order.call_args[1]["source"] == "whatsapp"
