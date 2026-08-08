from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import HTTPException
import pytest

from app.main import app

client = TestClient(app)

@patch("app.admin_api.admin_routes.check_is_admin")
@patch("app.admin_api.admin_routes.get_supabase_client")
def test_verify_admin_endpoint(mock_get_client, mock_check_is_admin):
    """Test admin verification endpoint."""
    mock_get_client.return_value = MagicMock()
    mock_check_is_admin.return_value = {"id": "a1", "email": "admin@meatshop.com", "role": "admin"}

    response = client.post("/api/admin/verify", json={"email": "admin@meatshop.com"})
    assert response.status_code == 200
    assert response.json()["is_admin"] is True


@patch("app.admin_api.admin_routes.get_supabase_client")
def test_get_rates_history(mock_get_client):
    """Test fetching rate history."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase

    mock_res = MagicMock()
    mock_res.data = [
        {"id": "r1", "meat_type": "chicken", "rate_per_kg": 240.0, "effective_date": "2026-08-08"}
    ]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = mock_res

    response = client.get("/api/admin/rates?meat_type=chicken")
    assert response.status_code == 200
    assert "rates" in response.json()
    assert len(response.json()["rates"]) == 1


@patch("app.admin_api.admin_routes.check_is_admin")
@patch("app.admin_api.admin_routes.get_supabase_client")
def test_set_rate_unauthorized(mock_get_client, mock_check_is_admin):
    """Test POST /api/admin/rates rejects non-admin users with 403 Forbidden."""
    mock_get_client.return_value = MagicMock()
    mock_check_is_admin.side_effect = HTTPException(status_code=403, detail="Access denied")

    payload = {
        "admin_email": "user@gmail.com",
        "meat_type": "chicken",
        "rate_per_kg": 260.0
    }

    response = client.post("/api/admin/rates", json=payload)
    assert response.status_code == 403


@patch("app.admin_api.admin_routes.check_is_admin")
@patch("app.admin_api.admin_routes.get_supabase_client")
def test_set_rate_authorized(mock_get_client, mock_check_is_admin):
    """Test POST /api/admin/rates updates rates for authorized admin."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase
    mock_check_is_admin.return_value = {"id": "a1"}

    mock_inserted = MagicMock()
    mock_inserted.data = [{"id": "r2", "meat_type": "mutton", "rate_per_kg": 760.0, "effective_date": "2026-08-08"}]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.execute.return_value = mock_inserted

    payload = {
        "admin_email": "admin@meatshop.com",
        "meat_type": "mutton",
        "rate_per_kg": 760.0,
        "effective_date": "2026-08-08"
    }

    response = client.post("/api/admin/rates", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True


@patch("app.admin_api.admin_routes.get_supabase_client")
def test_admin_get_orders(mock_get_client):
    """Test admin fetching orders list with filters."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase

    mock_res = MagicMock()
    mock_res.data = [{"id": "ord-1", "source": "whatsapp", "order_status": "confirmed"}]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = mock_res

    response = client.get("/api/admin/orders?source=whatsapp")
    assert response.status_code == 200
    assert "orders" in response.json()
    assert len(response.json()["orders"]) == 1


@patch("app.admin_api.admin_routes.check_is_admin")
@patch("app.admin_api.admin_routes.get_supabase_client")
def test_admin_update_order_status(mock_get_client, mock_check_admin):
    """Test admin updating order status."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase

    mock_res = MagicMock()
    mock_res.data = [{"id": "ord-1", "order_status": "preparing"}]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = mock_res

    payload = {"admin_email": "admin@example.com", "order_status": "preparing"}
    response = client.patch("/api/admin/orders/ord-1/status", json=payload)
    assert response.status_code == 200
    assert response.json()["order"]["order_status"] == "preparing"


@patch("app.admin_api.admin_routes.check_is_admin")
@patch("app.admin_api.admin_routes.get_supabase_client")
def test_admin_delivery_zones_crud(mock_get_client, mock_check_admin):
    """Test admin delivery zones CRUD operations."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase

    mock_res = MagicMock()
    mock_res.data = [{"id": "zone-1", "zone_name": "Zone A (0-5 km)", "delivery_charge": 30.0}]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.execute.return_value = mock_res

    # GET delivery zones
    response = client.get("/api/admin/delivery-zones")
    assert response.status_code == 200
    assert len(response.json()["zones"]) == 1

    # POST create delivery zone
    payload = {
        "admin_email": "admin@example.com",
        "zone_name": "Zone A (0-5 km)",
        "max_distance_km": 5.0,
        "delivery_charge": 30.0,
        "is_active": True
    }
    response_post = client.post("/api/admin/delivery-zones", json=payload)
    assert response_post.status_code == 200
    assert response_post.json()["success"] is True
