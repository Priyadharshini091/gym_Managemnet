from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_trainer
from ..models import Booking, GymClass, User, UserRole
from ..schemas import BookingOut, ClassSessionOut
from ..services import get_week_sessions, booking_to_schema

router = APIRouter(prefix="/api/trainer", tags=["trainer"])


@router.get("/schedule", response_model=list[ClassSessionOut])
def my_schedule(
    week: str | None = None,
    current_user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
) -> list[ClassSessionOut]:
    sessions = get_week_sessions(db, week)
    if current_user.role == UserRole.owner:
        return sessions
    return [session for session in sessions if session.trainer == current_user.name]


@router.get("/bookings", response_model=list[BookingOut])
def class_bookings(
    current_user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
) -> list[BookingOut]:
    trainer_classes = db.scalars(select(GymClass).where(GymClass.trainer == current_user.name)).all()
    if not trainer_classes:
        return []
    class_ids = [gym_class.id for gym_class in trainer_classes]

    bookings = db.scalars(
        select(Booking)
        .where(Booking.class_id.in_(class_ids))
        .order_by(Booking.booked_at.desc())
    ).all()

    return [booking_to_schema(booking) for booking in bookings]
