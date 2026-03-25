from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, SessionLocal, engine
from .routers import auth, bookings, chat, classes, dashboard, members, payments, trainer
from .services import queue_booking_reminders, sync_payment_statuses


scheduler = BackgroundScheduler(timezone="UTC")


def reminder_job() -> None:
    with SessionLocal() as db:
        queue_booking_reminders(db)


def payment_job() -> None:
    with SessionLocal() as db:
        sync_payment_statuses(db)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    scheduler.add_job(reminder_job, "interval", minutes=15, id="booking-reminders", replace_existing=True)
    scheduler.add_job(payment_job, "interval", hours=12, id="payment-status-sync", replace_existing=True)
    if not scheduler.running:
        scheduler.start()
    try:
        yield
    finally:
        if scheduler.running:
            scheduler.shutdown(wait=False)


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(members.router)
app.include_router(classes.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(chat.router)
app.include_router(trainer.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}
