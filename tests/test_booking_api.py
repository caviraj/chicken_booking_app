from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import pytest

from app.main import app

client = TestClient(app)

def test_read_root():
    """Test health check root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@patch("app.api.booking.get_today_rate")
@patch("app.api.booking.get_supabase_client")
def test_get_meat_rates(mock_get_client, mock_get_today_rate):
    """Test GET /api/booking/rates endpoint."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase
    
    mock_get_today_rate.side_effect = [
        {"meat_type": "chicken", "rate_per_kg": 240.0, "effective_date": "2026-08-08"},
        {"meat_type": "mutton", "rate_per_kg": 750.0, "effective_date": "2026-08-08"},
        None # duck uses fallback
    ]

    response = client.get("/api/booking/rates")
    assert response.status_code == 200
    data = response.json()
    assert "rates" in data
    assert data["rates"]["chicken"]["rate_per_kg"] == 240.0
    assert data["rates"]["mutton"]["rate_per_kg"] == 750.0
    assert data["rates"]["duck"]["rate_per_kg"] == 380.0


@patch("app.api.booking.validate_draft_order")
@patch("app.api.booking.get_supabase_client")
def test_validate_booking_endpoint(mock_get_client, mock_validate):
    """Test POST /api/booking/validate endpoint."""
    mock_get_client.return_value = MagicMock()
    mock_validate.return_value = {"valid": True, "errors": []}

    payload = {
        "meat_type": "chicken",
        "quantity_kg": 2.0,
        "delivery_date": "2026-08-09"
    }

    response = client.post("/api/booking/validate", json=payload)
    assert response.status_code == 200
    assert response.json()["valid"] is True


@patch("app.api.booking.calculate_delivery_charge")
@patch("app.api.booking.get_supabase_client")
def test_calculate_delivery_endpoint(mock_get_client, mock_calc):
    """Test POST /api/booking/calculate-delivery endpoint."""
    mock_get_client.return_value = MagicMock()
    mock_calc.return_value = {
        "delivery_charge": 30.0,
        "distance_km": 2.5,
        "delivery_zone": "Zone 1",
        "source": "google_routes"
    }

    payload = {
        "customer_address": "123 Gandhi Road, Chennai"
    }

    response = client.post("/api/booking/calculate-delivery", json=payload)
    assert response.status_code == 200
    assert response.json()["delivery_charge"] == 30.0


@patch("app.api.booking.get_supabase_client")
def test_get_customer_orders_endpoint(mock_get_client):
    """Test fetching customer order history."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase

    mock_res = MagicMock()
    mock_res.data = [
        {"id": "o-1", "customer_id": "cust-123", "meat_type": "chicken", "grand_total": 270.0}
    ]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.execute.return_value = mock_res

    response = client.get("/api/booking/orders/customer/cust-123")
    assert response.status_code == 200
    assert "orders" in response.json()
    assert len(response.json()["orders"]) == 1


@patch("app.api.booking.get_supabase_client")
def test_cancel_order_endpoint_pre_cutoff(mock_get_client):
    """Test pre-cutoff order cancellation."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase

    # Mock order for tomorrow (future date -> cancellation allowed)
    mock_order = MagicMock()
    mock_order.data = {
        "id": "o-99",
        "customer_id": "cust-123",
        "delivery_date": "2026-12-31",
        "order_status": "confirmed"
    }

    mock_updated = MagicMock()
    mock_updated.data = [{
        "id": "o-99",
        "order_status": "cancelled"
    }]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.single.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.execute.side_effect = [mock_order, mock_updated]

    payload = {"order_id": "o-99", "customer_id": "cust-123"}
    response = client.post("/api/booking/orders/cancel", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True

