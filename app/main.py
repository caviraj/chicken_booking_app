from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.booking import router as booking_router
from app.admin_api.admin_routes import router as admin_router
from app.webhooks.razorpay_webhook import router as razorpay_webhook_router
from app.webhooks.whatsapp_webhook import router as whatsapp_webhook_router

app = FastAPI(
    title="Meat Booking & Delivery API",
    version="1.0.0",
    description="FastAPI Backend for Meat Booking Application"
)

# Enable CORS for local React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(booking_router)
app.include_router(admin_router)
app.include_router(razorpay_webhook_router)
app.include_router(whatsapp_webhook_router)




@app.get("/")
def read_root():
    return {
        "app": "Meat Booking & Delivery API",
        "status": "healthy",
        "version": "1.0.0"
    }
