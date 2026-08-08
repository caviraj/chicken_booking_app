from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.booking import router as booking_router
from app.admin_api.admin_routes import router as admin_router

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


@app.get("/")
def read_root():
    return {
        "app": "Meat Booking & Delivery API",
        "status": "healthy",
        "version": "1.0.0"
    }
