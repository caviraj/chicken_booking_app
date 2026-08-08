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
