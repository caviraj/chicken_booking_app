from datetime import date, datetime
from unittest.mock import MagicMock, patch
import pytest

from app.services.order_service import validate_draft_order, create_order

def test_validate_draft_order_cutoff_passed():
    """Test order validation failing when order cutoff time has passed for today."""
    mock_supabase = MagicMock()

    # Settings mock returning 20:00 cutoff
    mock_settings_res = MagicMock()
    mock_settings_res.data = [{"order_cutoff_time": "20:00"}]

    # Stock mock returning no orders
    mock_orders_res = MagicMock()
    mock_orders_res.data = []

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.neq.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.execute.side_effect = [mock_settings_res, mock_orders_res, mock_settings_res]

    # Reference time is 20:30 on 2026-08-08 (cutoff is 20:00)
    ref_time = datetime(2026, 8, 8, 20, 30)

    with pytest.raises(ValueError) as exc_info:
        validate_draft_order(
            supabase=mock_supabase,
            meat_type="chicken",
            quantity_kg=2.0,
            delivery_date=date(2026, 8, 8),
            now_datetime=ref_time
        )

    assert "cutoff time" in str(exc_info.value).lower()



@patch("app.services.order_service.calculate_delivery_charge")
@patch("app.services.order_service.get_today_rate")
@patch("app.services.order_service.validate_draft_order")
def test_create_order_success(mock_validate, mock_get_rate, mock_calc_delivery):
    """Test creating an order successfully with correct totals calculation."""
    mock_supabase = MagicMock()

    mock_validate.return_value = {"valid": True, "errors": []}
    mock_get_rate.return_value = {
        "id": "rate-1",
        "meat_type": "chicken",
        "rate_per_kg": 250.0,
        "effective_date": "2026-08-08"
    }
    mock_calc_delivery.return_value = {
        "delivery_charge": 40.0,
        "distance_km": 3.5,
        "delivery_zone": "Zone A",
        "source": "google_routes"
    }

    mock_insert_res = MagicMock()
    mock_insert_res.data = [{
        "id": "order-123",
        "customer_id": "cust-1",
        "meat_type": "chicken",
        "quantity_kg": 2.0,
        "item_total": 500.0,
        "delivery_charge": 40.0,
        "grand_total": 540.0,
        "order_status": "confirmed"
    }]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.execute.return_value = mock_insert_res

    created = create_order(
        supabase=mock_supabase,
        customer_id="cust-1",
        meat_type="chicken",
        quantity_kg=2.0,
        cutting_type="Sirasa",
        delivery_date="2026-08-08",
        delivery_time_slot="6AM",
        fulfillment_type="delivery",
        delivery_address="123 Main St"
    )

    assert created["id"] == "order-123"
    assert created["item_total"] == 500.0
    assert created["delivery_charge"] == 40.0
    assert created["grand_total"] == 540.0
