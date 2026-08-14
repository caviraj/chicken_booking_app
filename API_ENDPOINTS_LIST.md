# 📡 Fresh Meat Booking & Delivery Application — Required API List

Comprehensive specification of all **Internal Backend REST APIs**, **Webhook Handlers**, and **Third-Party Integrations** required to run the Fresh Meat Booking & Delivery Application.

---

## 🛒 1. Customer Surface APIs (`/api/booking`)

| Endpoint | Method | Request Payload / Params | Response Structure | Description |
|---|---|---|---|---|
| `/api/booking/rates` | `GET` | *None* | `{ "rates": { "chicken": {...}, "mutton": {...}, "duck": {...} } }` | Fetches active daily per-kg meat rates for Chicken, Mutton, and Duck. |
| `/api/booking/validate` | `POST` | `{ "meat_type": string, "quantity_kg": number, "delivery_date": string }` | `{ "valid": boolean, "errors": string[] }` | Validates cutoff time rules, minimum quantity, and daily stock availability. |
| `/api/booking/calculate-delivery` | `POST` | `{ "customer_address": string }` | `{ "delivery_charge": number, "distance_km": number, "delivery_zone": string, "source": string }` | Geocodes customer address and calculates distance-based delivery fee. |
| `/api/booking/orders` | `POST` | `{ "customer_id": string, "meat_type": string, "quantity_kg": number, "cutting_type": string, "delivery_date": string, "delivery_time_slot": string, "fulfillment_type": "delivery" \| "pickup", "delivery_address"?: string, "payment_method": "online" \| "cod", "source": "website" }` | `{ "message": string, "order": { "id": string, "grand_total": number, "razorpay_payment_link"?: string, ... } }` | Creates atomic order in database, locks stock, and generates Razorpay payment link. |
| `/api/booking/orders/customer/{customer_id}` | `GET` | Path param: `customer_id` | `{ "orders": [ { "id": string, "order_status": string, "payment_status": string, ... } ] }` | Retrieves customer active and historical order records. |
| `/api/booking/orders/cancel` | `POST` | `{ "order_id": string, "customer_id": string }` | `{ "message": string, "order_id": string }` | Cancels an active customer order prior to the daily cutoff time limit. |

---

## 🛡️ 2. Admin Management APIs (`/api/admin`)

| Endpoint | Method | Request Payload / Params | Response Structure | Description |
|---|---|---|---|---|
| `/api/admin/verify` | `POST` | `{ "email": string }` | `{ "is_admin": boolean, "email": string }` | Verifies whether a signed-in user's email exists in the `admin_users` table. |
| `/api/admin/rates` | `GET` | Query param: `meat_type?` | `{ "rates": [ { "id": string, "meat_type": string, "rate_per_kg": number, "effective_date": string } ] }` | Fetches historical meat rate logs for audit and reporting. |
| `/api/admin/rates` | `POST` | `{ "admin_email": string, "meat_type": string, "rate_per_kg": number, "effective_date"?: string }` | `{ "message": string, "rate": object }` | Updates and publishes daily per-kg rate for a specific meat type. |
| `/api/admin/orders` | `GET` | Query params: `delivery_date?`, `source?`, `order_status?`, `payment_method?` | `{ "orders": [ { "id": string, "source": "website" \| "whatsapp", "order_status": string, "payment_status": string, ... } ] }` | Retrieves filtered list of orders across web and WhatsApp sources. |
| `/api/admin/orders/{order_id}/status` | `PATCH` | `{ "admin_email": string, "order_status": string }` | `{ "message": string, "order_id": string, "order_status": string }` | Advances order workflow status (`confirmed` → `preparing` → `out_for_delivery` → `delivered`). |
| `/api/admin/orders/{order_id}/payment-status` | `PATCH` | `{ "admin_email": string, "payment_status": string }` | `{ "message": string, "order_id": string, "payment_status": string }` | Updates order payment status (e.g. marking COD as `paid`). |
| `/api/admin/delivery-zones` | `GET` | *None* | `{ "zones": [ { "id": string, "zone_name": string, "max_distance_km": number, "delivery_charge": number, "is_active": boolean } ] }` | Lists all configured distance delivery fee bands. |
| `/api/admin/delivery-zones` | `POST` | `{ "admin_email": string, "zone_name": string, "max_distance_km": number, "delivery_charge": number, "is_active": boolean }` | `{ "message": string, "zone": object }` | Creates a new distance delivery fee band. |
| `/api/admin/delivery-zones/{zone_id}` | `PUT` | `{ "admin_email": string, "zone_name": string, "max_distance_km": number, "delivery_charge": number, "is_active": boolean }` | `{ "message": string, "zone": object }` | Edits an existing delivery distance zone. |
| `/api/admin/delivery-zones/{zone_id}` | `DELETE` | Query param: `admin_email` | `{ "message": string, "zone_id": string }` | Deletes a delivery distance zone. |
| `/api/admin/settings` | `GET` | *None* | `{ "settings": { "order_cutoff_time": "20:00", "daily_stock_limit_kg": 100, "shop_latitude": number, "shop_longitude": number } }` | Fetches shop operational parameters. |
| `/api/admin/settings` | `PUT` | `{ "admin_email": string, "order_cutoff_time": string, "daily_stock_limit_kg": number, "shop_latitude": number, "shop_longitude": number, "is_cleaning_day": boolean }` | `{ "message": string, "settings": object }` | Updates shop operational parameters and stock limits. |

---

## ⚡ 3. Webhook APIs (`/webhooks`)

| Endpoint | Method | Request Source / Header | Description |
|---|---|---|---|
| `/webhooks/razorpay` | `POST` | Header: `X-Razorpay-Signature` | Verifies HMAC SHA256 signature and automatically marks order `payment_status` as `paid` upon payment link completion. |
| `/webhooks/whatsapp` | `GET` | Meta Verification Token | Handles Meta WhatsApp Cloud API Webhook Challenge verification (`hub.verify_token`). |
| `/webhooks/whatsapp` | `POST` | Meta WhatsApp Cloud API Payloads | Automated WhatsApp state-machine booking bot flow (`START` → `LANG` → `MEAT_TYPE` → `QTY` → `CUTTING` → `DATE` → `TIME` → `PAYMENT`). |

---

## 🔌 4. External Services & Third-Party APIs Required

### A. **Supabase (PostgreSQL & Auth)**
- **Auth Endpoints**: Email/Password Sign In, Google OAuth, Magic Links.
- **Database REST API / RPC**: Executes stored procedure `create_order_atomic` with `pg_advisory_xact_lock` for concurrency safety.

### B. **Razorpay Payment Gateway API**
- **Payment Links API**: `POST https://api.razorpay.com/v1/payment_links` (Generates clickable checkout link for Web & WhatsApp).
- **Signature Verification**: Server-side HMAC SHA256 hash comparison.

### C. **Meta WhatsApp Cloud API (v18.0)**
- **Messages API**: `POST https://graph.facebook.com/v18.0/{phone_number_id}/messages` (Sends interactive quick-reply buttons and status update templates).

### D. **4-Tier Distance Calculation Matrix**
1. **Google Routes API**: Primary matrix endpoint (`https://routes.googleapis.com/directions/v2:computeRoutes`).
2. **OpenRouteService API**: Secondary fallback endpoint (`https://api.openrouteservice.org/v2/directions/driving-car`).
3. **OSM Nominatim + Haversine**: Tertiary fallback (`https://nominatim.openstreetmap.org/search` with `1.35` road factor multiplier).
4. **Delivery Zones DB**: Final fallback database zone lookup.

---

## 📝 Environment Variables Summary

```ini
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Razorpay
ENVIRONMENT=development
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxx

# Meta WhatsApp Cloud API
WHATSAPP_VERIFY_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# Optional Geocoding APIs
GOOGLE_MAPS_API_KEY=your_google_key
OPENROUTESERVICE_API_KEY=your_openroute_key
```
