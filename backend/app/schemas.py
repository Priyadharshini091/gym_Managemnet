from __future__ import annotations

from datetime import date, datetime, time
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import BookingStatus, ChatRole, ClassType, InquiryStatus, MemberStatus, PaymentStatus, PlanType, UserRole


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MemberProfile(ORMModel):
    id: int
    user_id: int
    plan_type: PlanType
    join_date: date
    status: MemberStatus
    last_visit: datetime | None


class UserSummary(ORMModel):
    id: int
    email: EmailStr
    role: UserRole
    name: str
    phone: str | None
    created_at: datetime


class CurrentUserResponse(BaseModel):
    user: UserSummary
    member: MemberProfile | None = None


class TokenResponse(CurrentUserResponse):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2, max_length=120)
    phone: str | None = None
    plan_type: PlanType = PlanType.basic


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ClassTemplateBase(BaseModel):
    name: str
    trainer: str
    start_time: time
    end_time: time
    capacity: int = Field(default=15, ge=1, le=100)
    class_type: ClassType
    day_of_week: str


class GymClassCreate(ClassTemplateBase):
    pass


class GymClassUpdate(BaseModel):
    name: str | None = None
    trainer: str | None = None
    start_time: time | None = None
    end_time: time | None = None
    capacity: int | None = Field(default=None, ge=1, le=100)
    class_type: ClassType | None = None
    day_of_week: str | None = None


class ClassSessionOut(BaseModel):
    id: int
    name: str
    trainer: str
    start_time: time
    end_time: time
    capacity: int
    class_type: ClassType
    day_of_week: str
    scheduled_date: date
    start_at: datetime
    end_at: datetime
    booked_count: int
    spots_left: int


class BookingCreate(BaseModel):
    class_id: int
    scheduled_for: datetime | None = None
    member_id: int | None = None


class BookingOut(BaseModel):
    id: int
    member_id: int
    class_id: int
    booked_at: datetime
    status: BookingStatus
    reminder_sent: bool
    class_name: str
    class_type: ClassType
    trainer: str
    day_of_week: str


class PaymentCreate(BaseModel):
    member_id: int
    amount: float = Field(gt=0)
    due_date: date
    paid_date: date | None = None
    status: PaymentStatus
    plan_type: PlanType


class PaymentOut(BaseModel):
    id: int
    member_id: int
    member_name: str
    amount: float
    due_date: date
    paid_date: date | None
    status: PaymentStatus
    plan_type: PlanType


class MemberCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    phone: str | None = None
    plan_type: PlanType
    join_date: date | None = None
    status: MemberStatus = MemberStatus.active
    last_visit: datetime | None = None


class MemberUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    plan_type: PlanType | None = None
    status: MemberStatus | None = None
    last_visit: datetime | None = None


class MemberListItem(BaseModel):
    id: int
    user_id: int
    name: str
    email: EmailStr
    phone: str | None
    plan_type: PlanType
    join_date: date
    status: MemberStatus
    last_visit: datetime | None
    attendance_rate: float
    upcoming_bookings: int
    payment_status: PaymentStatus | None = None


class MemberDetail(MemberListItem):
    bookings: list[BookingOut]
    payments: list[PaymentOut]


class RevenuePoint(BaseModel):
    month: str
    revenue: float


class DashboardStatsOut(BaseModel):
    total_members: int
    active_today: int
    monthly_revenue: float
    no_show_rate: float
    status_breakdown: dict[str, int]
    today_classes: list[ClassSessionOut]
    at_risk_members: list[MemberListItem]


class MessageResponse(BaseModel):
    message: str
    meta: dict[str, Any] | None = None


class MembershipEnquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    preferred_plan: PlanType | None = None
    fitness_goal: str | None = Field(default=None, max_length=120)
    preferred_contact: str | None = Field(default=None, max_length=30)
    message: str = Field(min_length=10, max_length=1000)


class MembershipEnquiryOut(ORMModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None
    preferred_plan: PlanType | None
    fitness_goal: str | None
    preferred_contact: str | None
    message: str
    status: InquiryStatus
    created_at: datetime


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    member_id: int


class ChatHistoryItem(ORMModel):
    id: int
    role: ChatRole
    content: str
    timestamp: datetime


class ChatResponse(BaseModel):
    reply: str
    action: str | None = None
    action_payload: dict[str, Any] | None = None
    messages: list[ChatHistoryItem] = Field(default_factory=list)
