from __future__ import annotations

from datetime import date, datetime, time
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Enum as SqlEnum, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.utcnow()


class UserRole(str, Enum):
    owner = "owner"
    trainer = "trainer"
    member = "member"


class PlanType(str, Enum):
    basic = "basic"
    premium = "premium"
    vip = "vip"


class MemberStatus(str, Enum):
    active = "active"
    at_risk = "at_risk"
    churned = "churned"


class ClassType(str, Enum):
    yoga = "yoga"
    hiit = "hiit"
    pilates = "pilates"
    strength = "strength"


class BookingStatus(str, Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    no_show = "no_show"


class PaymentStatus(str, Enum):
    paid = "paid"
    due = "due"
    overdue = "overdue"


class ChatRole(str, Enum):
    user = "user"
    assistant = "assistant"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole, native_enum=False))
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    member: Mapped["Member | None"] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    plan_type: Mapped[PlanType] = mapped_column(SqlEnum(PlanType, native_enum=False), index=True)
    join_date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[MemberStatus] = mapped_column(SqlEnum(MemberStatus, native_enum=False), index=True)
    last_visit: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)

    user: Mapped[User] = relationship(back_populates="member")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="member", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="member", cascade="all, delete-orphan")
    chat_messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="member",
        cascade="all, delete-orphan",
    )


class GymClass(Base):
    __tablename__ = "gym_classes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    trainer: Mapped[str] = mapped_column(String(120))
    start_time: Mapped[time] = mapped_column()
    end_time: Mapped[time] = mapped_column()
    capacity: Mapped[int] = mapped_column(default=15)
    class_type: Mapped[ClassType] = mapped_column(SqlEnum(ClassType, native_enum=False), index=True)
    day_of_week: Mapped[str] = mapped_column(String(20), index=True)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="gym_class", cascade="all, delete-orphan")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("member_id", "class_id", "booked_at", name="uq_member_class_occurrence"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), index=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("gym_classes.id", ondelete="CASCADE"), index=True)
    booked_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[BookingStatus] = mapped_column(
        SqlEnum(BookingStatus, native_enum=False),
        default=BookingStatus.confirmed,
        index=True,
    )
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    member: Mapped[Member] = relationship(back_populates="bookings")
    gym_class: Mapped[GymClass] = relationship(back_populates="bookings")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    due_date: Mapped[date] = mapped_column(Date, index=True)
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    status: Mapped[PaymentStatus] = mapped_column(SqlEnum(PaymentStatus, native_enum=False), index=True)
    plan_type: Mapped[PlanType] = mapped_column(SqlEnum(PlanType, native_enum=False))

    member: Mapped[Member] = relationship(back_populates="payments")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), index=True)
    role: Mapped[ChatRole] = mapped_column(SqlEnum(ChatRole, native_enum=False), index=True)
    content: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    member: Mapped[Member] = relationship(back_populates="chat_messages")
