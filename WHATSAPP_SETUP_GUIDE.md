# WhatsApp Cloud API Webhook Setup Guide (Phase 8 — Echo Test)

This guide walks you through setting up a **Meta Business / Developer App**, obtaining WhatsApp test credentials, exposing your local FastAPI server using **ngrok**, and verifying the webhook echo test.

---

## 1. Create a Meta Developer Account & App

1. Go to the [Meta for Developers Portal](https://developers.facebook.com/) and log in with your Facebook account.
2. Click **My Apps** -> **Create App**.
3. Select **Other** -> **Business** app type and click **Next**.
4. Give your app a name (e.g. `Meat Booking Assistant`) and enter your email address.
5. Click **Create App**.

---

## 2. Set Up WhatsApp Product

1. On the App Dashboard, scroll down to **WhatsApp** and click **Set up**.
2. Select or create a Meta Business Account.
3. Under **WhatsApp -> API Setup**:
   - You will see a **Temporary Access Token** (`WHATSAPP_ACCESS_TOKEN`).
   - You will see a **Phone Number ID** (`WHATSAPP_PHONE_NUMBER_ID`).
   - You will see a **Test Phone Number** provided by Meta (e.g., `+1 555-0199`).
4. In the **"To"** field, add your personal WhatsApp phone number to send test messages. Follow the on-screen OTP verification to authorize your number.

---

## 3. Configure Local Environment Variables

Add the credentials to your `.env` file in the root of your project:

```env
WHATSAPP_ACCESS_TOKEN=EAAG... (your temporary or permanent Meta token)
WHATSAPP_PHONE_NUMBER_ID=100200300400500
WHATSAPP_VERIFY_TOKEN=meat_booking_secret_token_123
```

---

## 4. Run FastAPI Server & Expose via ngrok

1. Start your local FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

2. In a separate terminal, start `ngrok` to expose port 8000 to the public internet:
   ```bash
   ngrok http 8000
   ```

3. Copy your HTTPS forwarding URL from ngrok (e.g. `https://a1b2-123-45-67-89.ngrok-free.app`).

---

## 5. Configure Webhook in Meta Developer Portal

1. On the Meta Developer Dashboard, go to **WhatsApp -> Configuration** (or **Webhooks**).
2. Click **Edit** under **Webhook**:
   - **Callback URL**: `https://your-ngrok-url.ngrok-free.app/webhooks/whatsapp`
   - **Verify Token**: `meat_booking_secret_token_123` (must match `WHATSAPP_VERIFY_TOKEN` in `.env`)
3. Click **Verify and Save**. FastAPI will handle the GET verification challenge (`hub.challenge`) automatically.
4. Under **Webhook Fields**, click **Subscribe** to the `messages` field.

---

## 6. Test Echo Functionality

1. Send a WhatsApp text message from your authorized personal phone to the Meta Test Phone Number (e.g. `Hello Meat Shop`).
2. Meta will send a POST request to your `/webhooks/whatsapp` endpoint.
3. Your FastAPI server will receive the text message and automatically send back:
   ```text
   Echo: Hello Meat Shop
   ```
4. Check your WhatsApp phone — you will see the echo message delivered!
