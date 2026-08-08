from datetime import date
from unittest.mock import patch, MagicMock
import pytest

from app.services.notification_service import send_order_status_notification
from app.services.order_service import create_order

@patch("app.services.notification_service.send_whatsapp_text")
def test_send_order_status_notification(mock_send_whatsapp):
    """Test WhatsApp status update notification delivered to customer."""
    mock_supabase = MagicMock()

    mock_order_res = MagicMock()
    mock_order_res.data = [{
        "id": "ord-status-123",
        "customer_id": "cust-status-123",
        "meat_type": "chicken",
        "quantity_kg": 2.0,
        "delivery_time_slot": "6:00 AM - 7:00 AM"
    }]

    mock_cust_res = MagicMock()
    mock_cust_res.data = [{
        "phone_number": "919876543210"
    }]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.side_effect = [mock_order_res, mock_cust_res]

    res = send_order_status_notification(mock_supabase, "ord-status-123", "out_for_delivery")
    assert res["status"] == "success"
    mock_send_whatsapp.assert_called_once_with(
        to_phone_number="919876543210",
        message_text="🛵 *Out for Delivery!*\nYour order #ord-status-123 is out for delivery. Our driver will reach you during your slot: 6:00 AM - 7:00 AM."
    )


@patch("app.services.order_service.check_stock_limit")
@patch("app.services.order_service.get_today_rate")
def test_concurrent_order_stock_limit_rejection(mock_get_rate, mock_check_stock):
    """
    Test near-simultaneous order creations near stock limit.
    Ensures that an order that pushes total over limit is rejected with a clear message,
    and total stock never exceeds limit_kg.
    """
    mock_get_rate.return_value = {"rate_per_kg": 240.0}
    mock_check_stock.return_value = {
        "is_available": False,
        "remaining_kg": 2.0,
        "booked_kg": 8.0,
        "limit_kg": 10.0
    }

    mock_supabase = MagicMock()
    target_date = date.fromordinal(date.today().toordinal() + 1)

    with pytest.raises(ValueError) as exc_info:
        create_order(
            supabase=mock_supabase,
            customer_id="cust-1",
            meat_type="chicken",
            quantity_kg=3.0, # 8 + 3 = 11 > 10
            cutting_type="sirasa",
            delivery_date=target_date,
            delivery_time_slot="6:00 AM - 7:00 AM",
            fulfillment_type="pickup",
            payment_method="cod"
        )

    assert "Stock limit exceeded" in str(exc_info.value)
    assert "Only 2.0 kg left for chicken" in str(exc_info.value)
