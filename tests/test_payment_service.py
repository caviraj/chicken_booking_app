import os
import hmac
import hashlib
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import pytest

from app.services.payment_service import verify_razorpay_credentials, create_razorpay_payment_link
from app.webhooks.razorpay_webhook import verify_razorpay_signature
from app.main import app

client = TestClient(app)

def test_verify_credentials_fails_without_keys():
    """Test strict credentials check raising ValueError if credentials missing in production."""
    with patch.dict(os.environ, {"RAZORPAY_KEY_ID": "", "RAZORPAY_KEY_SECRET": "", "ENVIRONMENT": "production"}, clear=True):
        with pytest.raises(ValueError) as exc_info:
            verify_razorpay_credentials()
        assert "CRITICAL SECURITY CONFIG ERROR" in str(exc_info.value)


def test_verify_credentials_dev_fallback():
    """Test explicit development mode returning False for mock link activation."""
    with patch.dict(os.environ, {"RAZORPAY_KEY_ID": "", "RAZORPAY_KEY_SECRET": "", "ENVIRONMENT": "development"}, clear=True):
        assert verify_razorpay_credentials() is False


def test_create_payment_link_fetches_grand_total_from_db():
    """Test payment_service pulling grand_total directly from DB table."""
    mock_supabase = MagicMock()
    mock_order_res = MagicMock()
    mock_order_res.data = {
        "id": "ord-101",
        "grand_total": 450.00,
        "payment_status": "pending",
        "customer_id": "c-1"
    }

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.single.return_value = mock_table
    mock_table.execute.return_value = mock_order_res

    with patch.dict(os.environ, {"ENVIRONMENT": "development"}, clear=True):
        link_data = create_razorpay_payment_link(mock_supabase, order_id="ord-101")
        assert link_data["short_url"] == "https://razorpay.me/pay/mock_order_ord-101"
        assert link_data["is_mock"] is True


def test_verify_signature_hmac():
    """Test HMAC SHA256 signature calculation and comparison."""
    secret = "webhook_secret_key_123"
    body = b'{"event":"payment.captured"}'
    valid_sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    assert verify_razorpay_signature(body, valid_sig, secret) is True
    assert verify_razorpay_signature(body, "invalid_signature", secret) is False


@patch("app.webhooks.razorpay_webhook.get_supabase_client")
def test_webhook_unauthorized_signature(mock_get_client):
    """Test webhook rejecting requests failing signature verification with 401."""
    with patch.dict(os.environ, {"RAZORPAY_WEBHOOK_SECRET": "test_secret"}, clear=True):
        response = client.post(
            "/webhooks/razorpay",
            json={"event": "payment.captured"},
            headers={"X-Razorpay-Signature": "wrong_signature"}
        )
        assert response.status_code == 401
        assert "Invalid Razorpay webhook signature" in response.json()["detail"]


@patch("app.webhooks.razorpay_webhook.get_supabase_client")
def test_webhook_idempotent_skip(mock_get_client):
    """Test webhook skipping processing when order is already paid."""
    mock_supabase = MagicMock()
    mock_get_client.return_value = mock_supabase

    mock_order_res = MagicMock()
    mock_order_res.data = {
        "id": "ord-202",
        "payment_status": "paid",
        "razorpay_payment_id": "pay_999"
    }

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.maybeSingle.return_value = mock_table
    mock_table.execute.return_value = mock_order_res

    secret = "test_secret"
    body = b'{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_999","description":"ord-202"}}}}'
    sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    with patch.dict(os.environ, {"RAZORPAY_WEBHOOK_SECRET": secret}, clear=True):
        response = client.post(
            "/webhooks/razorpay",
            content=body,
            headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "skipped"
