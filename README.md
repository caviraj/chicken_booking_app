# 🍗 Fresh Meat Booking & Delivery Application

A full-stack, enterprise-grade dual-channel Fresh Meat Booking & Delivery Application built with **FastAPI**, **React + TypeScript + Tailwind CSS**, **Supabase (PostgreSQL)**, **Razorpay Payment Gateway**, and **Meta WhatsApp Cloud API**.

---

## 🌟 Key Features

### 🛒 Website Customer Surface
- **Google & Email Authentication**: Instant single-tap Google OAuth and Email magic link sign-in powered by Supabase Auth.
- **Dynamic Booking Wizard**: Interactive 4-step wizard with meat rate calculation, cutting style selection, delivery slot picker, and address geocoding.
- **Razorpay Online Payments & COD**: Secure payment link checkout with HMAC SHA256 signature verification.
- **Customer Order History**: View active and past orders with pre-cutoff time cancellation support.
- **Bilingual Interface**: Full English & Tamil (தமிழ்) language toggle.

### 💬 WhatsApp Booking Surface
- **Interactive State Machine Flow**: Automated WhatsApp booking flow using interactive quick-reply buttons (`START` → `LANG` → `MEAT_TYPE` → `QTY` → `CUTTING` → `DATE` → `TIME` → `FULFILLMENT` → `PAYMENT`).
- **Instant Payment Links**: Generates and sends clickable Razorpay payment links directly in WhatsApp chat.
- **Automated WhatsApp Status Updates**: Sends immediate status updates (`Preparing`, `Out for Delivery`, `Delivered`, `Cancelled`) to the customer's phone number.

### 🛡️ Security & Enterprise Architecture
- **Fail-Fast Payment Configuration**: App refuses startup if `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` are missing unless explicitly in development mode (`ENVIRONMENT=development`).
- **Separate Webhook HMAC Verification**: Dedicated `RAZORPAY_WEBHOOK_SECRET` verification.
- **Server-Side Amount Calculation**: Payment amounts are recomputed server-side from `orders.grand_total`.
- **Webhook Idempotency**: Prevents duplicate webhook events via `processed_webhook_events` tracking table.
- **Atomic Stock Concurrency Locks**: Uses Postgres transaction-level advisory locks (`pg_advisory_xact_lock`) to prevent simultaneous overbooking beyond `daily_stock_limit_kg`.
- **4-Tier Distance Calculation**: Primary Google Routes API, Secondary OpenRouteService API, Tertiary Nominatim + Haversine (with 1.35 road correction factor), and Final DB Zone fallback.
- **Persistent Distance Caching**: `address_distance_cache` table with 30-day TTL to minimize external API calls.

### 📊 Admin Management Panel
- **Daily Meat Rate Manager**: Edit daily rates for Chicken, Mutton, Duck with historical audit logs.
- **Operational Settings**: Configurable daily order cutoff time, stock limits, and shop coordinates.
- **Orders Dashboard**: Filter orders by date, source (Website / WhatsApp), status, and payment method with workflow status advance actions.
- **Delivery Zones CRUD**: Create, edit, and delete distance delivery fee bands.
- **Printable Thermal Package Labels**: One-click printable package sticker with embedded **QR Code** for thermal label printers.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | FastAPI (Python 3.10+) |
| **Database** | Supabase (PostgreSQL 15+) |
| **Frontend Framework** | React 18 + TypeScript + Vite |
| **Styling** | Vanilla CSS + Tailwind CSS |
| **Payment Gateway** | Razorpay Payment Links API |
| **Messaging Service** | Meta WhatsApp Cloud API (v18.0) |
| **Distance Services** | Google Routes API + OpenRouteService + Nominatim OSM |

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory:

```ini
# Supabase Configuration
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Razorpay Payment Gateway Configuration
ENVIRONMENT=development
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Meta WhatsApp Cloud API Configuration
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_permanent_access_token

# Distance Matrix APIs (Optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENROUTESERVICE_API_KEY=your_openrouteservice_api_key
```

---

## 🗄️ Database Setup & Migrations

Run all migration scripts located in `supabase/migrations/`:

1. `20260808000000_initial_schema.sql` (Core DDL schema for rates, orders, customers, admin settings, delivery zones, webhooks).
2. `20260808000001_address_distance_cache.sql` (Persistent 30-day TTL distance cache table).
3. `20260808000002_per_meat_stock_limits.sql` (Per-meat stock limits table and `create_order_atomic` stored procedure).

---

## 💻 Local Development Setup

### 1. Backend (FastAPI)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```
Backend API docs available at: `http://localhost:8000/docs`

### 2. Frontend (React + Vite)
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start frontend dev server
npm run dev
```
Frontend Web App available at: `http://localhost:5173`

---

## 🧪 Testing

Run the full backend Pytest test suite:
```bash
python -m pytest
```

Run frontend production build verification:
```bash
cd frontend
npm run build
```

---

## 📄 License
MIT License. Developed for Fresh Meat Shop Operations.
