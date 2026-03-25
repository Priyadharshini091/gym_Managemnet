from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import get_current_member, get_current_user, require_owner
from ..models import Booking, BookingStatus, GymClass, Member, User, UserRole
from ..schemas import BookingCreate, BookingOut, MessageResponse
from ..services import booking_to_schema, count_confirmed_bookings
from ..utils import combine_date_and_time, next_occurrence_date


router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def resolve_member_scope(
    current_user: User,
    db: Session,
    member_id: int | None = None,
) -> Member:
    if current_user.role == UserRole.member:
        if member_id and current_user.member and member_id != current_user.member.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own bookings")
        if not current_user.member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Member account required")
        return current_user.member

    if member_id is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="member_id is required")

    member = db.scalar(select(Member).where(Member.id == member_id))
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return member


@router.get("/my", response_model=list[BookingOut])
def my_bookings(
    member_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[BookingOut]:
    member = resolve_member_scope(current_user, db, member_id)
    bookings = db.scalars(
        select(Booking)
        .join(Booking.gym_class)
        .options(selectinload(Booking.gym_class))
        .where(Booking.member_id == member.id)
        .order_by(Booking.booked_at.desc())
        .limit(60)
    ).all()
    return [booking_to_schema(booking) for booking in bookings]


@router.post("/", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingOut:
    member = resolve_member_scope(current_user, db, payload.member_id)
    gym_class = db.scalar(select(GymClass).where(GymClass.id == payload.class_id))
    if not gym_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    scheduled_for = payload.scheduled_for
    if not scheduled_for:
        occurrence_date = next_occurrence_date(gym_class.day_of_week)
        scheduled_for = combine_date_and_time(occurrence_date, gym_class.start_time)

    if scheduled_for < datetime.now():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot book a past class")

    existing = db.scalar(
        select(Booking).where(
            Booking.member_id == member.id,
            Booking.class_id == gym_class.id,
            Booking.booked_at == scheduled_for,
            Booking.status != BookingStatus.cancelled,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Class already booked")

    confirmed_count = count_confirmed_bookings(db, gym_class.id, scheduled_for)
    if confirmed_count >= gym_class.capacity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Class is full")

    booking = Booking(
        member_id=member.id,
        class_id=gym_class.id,
        booked_at=scheduled_for,
        status=BookingStatus.confirmed,
        reminder_sent=False,
    )
    db.add(booking)
    db.commit()
    booking = db.scalar(
        select(Booking)
        .join(Booking.gym_class)
        .options(selectinload(Booking.gym_class))
        .where(Booking.id == booking.id)
    )
    return booking_to_schema(booking)


@router.delete("/{booking_id}", response_model=MessageResponse)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    booking = db.scalar(
        select(Booking)
        .join(Booking.gym_class)
        .options(selectinload(Booking.gym_class), selectinload(Booking.member))
        .where(Booking.id == booking_id)
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if current_user.role == UserRole.member and current_user.member and booking.member_id != current_user.member.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own booking")

    booking.status = BookingStatus.cancelled
    db.commit()
    return MessageResponse(message="Booking cancelled")


@router.get("/class/{class_id}", response_model=list[BookingOut])
def class_bookings(
    class_id: int,
    scheduled_for: datetime | None = None,
    _: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> list[BookingOut]:
    statement = (
        select(Booking)
        .join(Booking.gym_class)
        .options(selectinload(Booking.gym_class))
        .where(Booking.class_id == class_id)
        .order_by(Booking.booked_at.desc())
    )
    if scheduled_for:
        statement = statement.where(Booking.booked_at == scheduled_for)
    bookings = db.scalars(statement).all()
    return [booking_to_schema(booking) for booking in bookings]
