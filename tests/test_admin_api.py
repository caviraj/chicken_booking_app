from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import pytest

from app.main import app

client = TestClient(app)

@patch("app.admin_api.admin_routes.check_is_admin")
@patch("app.admin_api.admin_routes.get_supabase_client")
def test_verify_admin_endpoint(mock_get_client, mock_check_is_admin):
    """Test admin verification endpoint."""
    mock_get_client.return_value = MagicMock()
    mock_check_is_admin.return_value = True

    response = client.get("/api/admin/verify?email=admin@meatshop.com")
    assert response.status_code == 200
    assert response.json()["is_admin"] is True


@patch("app.admin_api.admin_routes.get_supabase_client")
def test_get_rate_history_endpoint(mock_get_client):
    """Test GET /api/admin/rates endpoint."""
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
    mock_table.execute.return_value = mock_res

    response = client.get("/api/admin/rates")
    assert response.status_code == 200
    assert "rates" in response.json()
    assert response.json()["rates"][0]["meat_type"] == "chicken"


@patch("app.admin_api.admin_routes.check_is_admin")
@patch("app.admin_api.admin_routes.get_supabase_client")
def test_set_rate_unauthorized(mock_get_client, mock_check_is_admin):
    """Test POST /api/admin/rates rejects non-admin users with 403 Forbidden."""
    mock_get_client.return_value = MagicMock()
    mock_check_is_admin.return_value = False

    payload = {
        "admin_email": "user@gmail.com",
        "meat_type": "chicken",
        "rate_per_kg": 260.0
    }

    response = client.post("/api/admin/rates", json=payload)
    assert response.status_code == 403
    assert "Unauthorized" in response.json()["detail"]


@patch("app.admin_api.admin_routes.check_is_admin")
@patch("app.admin_api.admin_routes.get_supabase_client")
def test_set_rate_authorized(mock_get_client, mock_check_is_admin):
    """Test POST /api/admin/rates updates rates for authorized admin."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase
    mock_check_is_admin.return_value = True

    mock_empty_existing = MagicMock()
    mock_empty_existing.data = []

    mock_inserted = MagicMock()
    mock_inserted.data = [{"id": "r2", "meat_type": "mutton", "rate_per_kg": 760.0, "effective_date": "2026-08-08"}]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.execute.side_effect = [mock_empty_existing, mock_inserted]

    payload = {
        "admin_email": "admin@meatshop.com",
        "meat_type": "mutton",
        "rate_per_kg": 760.0,
        "effective_date": "2026-08-08"
    }

    response = client.post("/api/admin/rates", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True
