from __future__ import annotations

import calendar
from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Booking, BookingStatus, ChatMessage, ChatRole, ClassType, GymClass, Member, MemberStatus, Payment, PaymentStatus, PlanType, User, UserRole
from .security import hash_password
from .utils import combine_date_and_time, next_occurrence_date


DEMO_PASSWORD = "demo123"

DEMO_CLASSES = [
    {
        "name": "Strength Lab",
        "trainer": "Casey Nolan",
        "start_time": time(18, 0),
        "end_time": time(19, 0),
        "capacity": 15,
        "class_type": ClassType.strength,
        "day_of_week": "monday",
    },
    {
        "name": "Yoga Flow",
        "trainer": "Sarah",
        "start_time": time(7, 0),
        "end_time": time(8, 0),
        "capacity": 18,
        "class_type": ClassType.yoga,
        "day_of_week": "wednesday",
    },
    {
        "name": "HIIT Burn",
        "trainer": "Casey Nolan",
        "start_time": time(17, 30),
        "end_time": time(18, 15),
        "capacity": 16,
        "class_type": ClassType.hiit,
        "day_of_week": "thursday",
    },
    {
        "name": "Pilates Core",
        "trainer": "Sarah",
        "start_time": time(10, 0),
        "end_time": time(11, 0),
        "capacity": 14,
        "class_type": ClassType.pilates,
        "day_of_week": "saturday",
    },
]


def month_due_date(reference: date, months_ago: int, due_day: int = 5) -> date:
    month = reference.month - months_ago
    year = reference.year
    while month <= 0:
        month += 12
        year -= 1
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, min(due_day, last_day))


def upsert_demo_user(
    db: Session,
    *,
    email: str,
    role: UserRole,
    name: str,
    phone: str,
    created_at: datetime,
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(
            email=email,
            password_hash=hash_password(DEMO_PASSWORD),
            role=role,
            name=name,
            phone=phone,
            created_at=created_at,
        )
        db.add(user)
        db.flush()
        return user

    user.password_hash = hash_password(DEMO_PASSWORD)
    user.role = role
    user.name = name
    user.phone = phone
    return user


def upsert_demo_member(db: Session, user: User) -> Member:
    member = db.scalar(select(Member).where(Member.user_id == user.id))
    join_date = date.today() - timedelta(days=120)
    if not member:
        member = Member(
            user_id=user.id,
            plan_type=PlanType.premium,
            join_date=join_date,
            status=MemberStatus.active,
            last_visit=None,
        )
        db.add(member)
        db.flush()
        return member

    member.plan_type = PlanType.premium
    member.join_date = member.join_date or join_date
    member.status = MemberStatus.active
    return member


def ensure_demo_classes(db: Session) -> list[GymClass]:
    classes: list[GymClass] = []
    for payload in DEMO_CLASSES:
        gym_class = db.scalar(
            select(GymClass).where(
                GymClass.name == payload["name"],
                GymClass.trainer == payload["trainer"],
                GymClass.day_of_week == payload["day_of_week"],
                GymClass.start_time == payload["start_time"],
            )
        )
        if not gym_class:
            gym_class = GymClass(**payload)
            db.add(gym_class)
            db.flush()
        classes.append(gym_class)
    return classes


def ensure_demo_payments(db: Session, member: Member) -> None:
    existing = db.scalar(select(Payment.id).where(Payment.member_id == member.id).limit(1))
    if existing:
        return

    today = date.today()
    payment_specs = [
        (2, PaymentStatus.paid, 49.0, month_due_date(today, 2) + timedelta(days=1)),
        (1, PaymentStatus.paid, 49.0, month_due_date(today, 1) + timedelta(days=2)),
        (0, PaymentStatus.due if today.day <= 5 else PaymentStatus.overdue, 49.0, None),
    ]
    for months_ago, status, amount, paid_date in payment_specs:
        db.add(
            Payment(
                member_id=member.id,
                amount=amount,
                due_date=month_due_date(today, months_ago),
                paid_date=paid_date,
                status=status,
                plan_type=PlanType.premium,
            )
        )


def ensure_demo_bookings(db: Session, member: Member, classes: list[GymClass]) -> None:
    existing = db.scalar(select(Booking.id).where(Booking.member_id == member.id).limit(1))
    if existing:
        last_booking = db.scalar(
            select(Booking)
            .where(Booking.member_id == member.id, Booking.status == BookingStatus.confirmed)
            .order_by(Booking.booked_at.desc())
        )
        member.last_visit = last_booking.booked_at if last_booking else member.last_visit
        return

    today = date.today()
    future_class = next((item for item in classes if item.trainer == "Casey Nolan"), classes[0])
    future_date = next_occurrence_date(future_class.day_of_week, start_from=today)
    future_start = combine_date_and_time(future_date, future_class.start_time)

    past_class = next((item for item in classes if item.class_type == ClassType.yoga), classes[0])
    past_date = next_occurrence_date(past_class.day_of_week, start_from=today) - timedelta(days=7)
    past_start = combine_date_and_time(past_date, past_class.start_time)

    db.add(
        Booking(
            member_id=member.id,
            class_id=past_class.id,
            booked_at=past_start,
            status=BookingStatus.confirmed,
            reminder_sent=True,
        )
    )
    db.add(
        Booking(
            member_id=member.id,
            class_id=future_class.id,
            booked_at=future_start,
            status=BookingStatus.confirmed,
            reminder_sent=False,
        )
    )
    member.last_visit = past_start


def ensure_demo_chat(db: Session, member: Member) -> None:
    existing = db.scalar(select(ChatMessage.id).where(ChatMessage.member_id == member.id).limit(1))
    if existing:
        return

    db.add(
        ChatMessage(
            member_id=member.id,
            role=ChatRole.assistant,
            content="Welcome back, Alex. Your next class is lined up and your account looks healthy.",
            timestamp=datetime.now() - timedelta(hours=2),
        )
    )


def ensure_demo_data(db: Session) -> None:
    owner = upsert_demo_user(
        db,
        email="owner@gymflow.com",
        role=UserRole.owner,
        name="Jordan Blake",
        phone="+1 555-0100",
        created_at=datetime.now() - timedelta(days=400),
    )
    trainer = upsert_demo_user(
        db,
        email="trainer@gymflow.com",
        role=UserRole.trainer,
        name="Casey Nolan",
        phone="+1 555-0110",
        created_at=datetime.now() - timedelta(days=300),
    )
    member_user = upsert_demo_user(
        db,
        email="member@gymflow.com",
        role=UserRole.member,
        name="Alex Rivera",
        phone="+1 555-1000",
        created_at=datetime.now() - timedelta(days=180),
    )

    # Touch references so SQLAlchemy keeps rows loaded before related inserts.
    owner.id
    trainer.id
    member = upsert_demo_member(db, member_user)
    classes = ensure_demo_classes(db)
    ensure_demo_payments(db, member)
    ensure_demo_bookings(db, member, classes)
    ensure_demo_chat(db, member)
    db.commit()
