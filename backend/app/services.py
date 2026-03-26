from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta

from openai import OpenAI
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, selectinload

from .config import settings
from .models import Booking, BookingStatus, ChatMessage, ClassType, GymClass, Member, Payment, PaymentStatus
from .schemas import BookingOut, ChatResponse, ClassSessionOut, MemberListItem, PaymentOut, RevenuePoint
from .utils import combine_date_and_time, month_window, plan_limit, scheduled_date_for_week, truncate_words, week_start_from_string


BOOK_WORDS = ("book", "reserve", "sign me up", "join")
CANCEL_WORDS = ("cancel", "drop", "remove")
WEEKDAYS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
SCHEDULE_WORDS = ("class", "classes", "schedule", "available")
PAYMENT_WORDS = ("payment", "payments", "invoice", "invoices", "bill", "bills", "due", "paid", "owe", "owed")
PLAN_WORDS = ("plan", "membership")
PERSONAL_BOOKING_WORDS = (
    "my booking",
    "my bookings",
    "my class",
    "my classes",
    "am i booked",
    "do i have",
    "what do i have",
    "upcoming booking",
    "upcoming bookings",
    "upcoming class",
    "upcoming classes",
)


@dataclass
class IntentCandidate:
    reply_context: str
    action: str | None = None
    action_payload: dict | None = None


def sync_payment_statuses(db: Session) -> int:
    today = date.today()
    payments = db.scalars(
        select(Payment).where(Payment.status != PaymentStatus.paid, Payment.due_date < today)
    ).all()
    for payment in payments:
        payment.status = PaymentStatus.overdue
    if payments:
        db.commit()
    return len(payments)


def queue_booking_reminders(db: Session) -> int:
    now = datetime.now()
    reminder_cutoff = now + timedelta(minutes=settings.reminder_window_minutes)
    bookings = db.scalars(
        select(Booking).where(
            Booking.status == BookingStatus.confirmed,
            Booking.reminder_sent.is_(False),
            Booking.booked_at >= now,
            Booking.booked_at <= reminder_cutoff,
        )
    ).all()
    for booking in bookings:
        booking.reminder_sent = True
    if bookings:
        db.commit()
    return len(bookings)


def count_confirmed_bookings(db: Session, class_id: int, scheduled_for: datetime) -> int:
    return (
        db.scalar(
            select(func.count(Booking.id)).where(
                Booking.class_id == class_id,
                Booking.booked_at == scheduled_for,
                Booking.status == BookingStatus.confirmed,
            )
        )
        or 0
    )


def build_class_session(db: Session, gym_class: GymClass, scheduled_date: date) -> ClassSessionOut:
    start_at = combine_date_and_time(scheduled_date, gym_class.start_time)
    end_at = combine_date_and_time(scheduled_date, gym_class.end_time)
    booked_count = count_confirmed_bookings(db, gym_class.id, start_at)
    return ClassSessionOut(
        id=gym_class.id,
        name=gym_class.name,
        trainer=gym_class.trainer,
        start_time=gym_class.start_time,
        end_time=gym_class.end_time,
        capacity=gym_class.capacity,
        class_type=gym_class.class_type,
        day_of_week=gym_class.day_of_week,
        scheduled_date=scheduled_date,
        start_at=start_at,
        end_at=end_at,
        booked_count=booked_count,
        spots_left=max(gym_class.capacity - booked_count, 0),
    )


def get_week_sessions(db: Session, week: str | None = None) -> list[ClassSessionOut]:
    week_start = week_start_from_string(week)
    classes = db.scalars(select(GymClass).order_by(GymClass.start_time)).all()
    sessions = [
        build_class_session(db, gym_class, scheduled_date_for_week(week_start, gym_class.day_of_week))
        for gym_class in classes
    ]
    sessions.sort(key=lambda item: (item.scheduled_date, item.start_time))
    return sessions


def get_classes_for_date(db: Session, target_date: date) -> list[ClassSessionOut]:
    weekday = target_date.strftime("%A").lower()
    classes = db.scalars(
        select(GymClass).where(GymClass.day_of_week == weekday).order_by(GymClass.start_time)
    ).all()
    return [build_class_session(db, gym_class, target_date) for gym_class in classes]


def serialize_class_sessions(sessions: list[ClassSessionOut]) -> list[dict]:
    return [
        {
            "id": item.id,
            "name": item.name,
            "trainer": item.trainer,
            "type": item.class_type.value,
            "start_at": item.start_at.isoformat(),
            "spots_left": item.spots_left,
        }
        for item in sessions
    ]


def serialize_booking_list(bookings: list[Booking]) -> list[dict]:
    return [
        {
            "booking_id": booking.id,
            "class_id": booking.class_id,
            "name": booking.gym_class.name,
            "type": booking.gym_class.class_type.value,
            "time": booking.booked_at.isoformat(),
            "status": booking.status.value,
        }
        for booking in bookings
    ]


def booking_to_schema(booking: Booking) -> BookingOut:
    return BookingOut(
        id=booking.id,
        member_id=booking.member_id,
        class_id=booking.class_id,
        booked_at=booking.booked_at,
        status=booking.status,
        reminder_sent=booking.reminder_sent,
        class_name=booking.gym_class.name,
        class_type=booking.gym_class.class_type,
        trainer=booking.gym_class.trainer,
        day_of_week=booking.gym_class.day_of_week,
    )


def payment_to_schema(payment: Payment) -> PaymentOut:
    return PaymentOut(
        id=payment.id,
        member_id=payment.member_id,
        member_name=payment.member.user.name,
        amount=float(payment.amount),
        due_date=payment.due_date,
        paid_date=payment.paid_date,
        status=payment.status,
        plan_type=payment.plan_type,
    )


def member_attendance_rate(db: Session, member_id: int) -> float:
    counts = db.execute(
        select(
            func.count(Booking.id).label("total"),
            func.sum(case((Booking.status == BookingStatus.no_show, 1), else_=0)).label("no_show"),
        ).where(Booking.member_id == member_id, Booking.status != BookingStatus.cancelled)
    ).one()
    total = counts.total or 0
    no_show = counts.no_show or 0
    if total == 0:
        return 0.0
    return round(((total - no_show) / total) * 100, 1)


def member_list_item(db: Session, member: Member) -> MemberListItem:
    upcoming_bookings = (
        db.scalar(
            select(func.count(Booking.id)).where(
                Booking.member_id == member.id,
                Booking.status == BookingStatus.confirmed,
                Booking.booked_at >= datetime.now(),
            )
        )
        or 0
    )
    latest_payment = db.scalar(
        select(Payment).where(Payment.member_id == member.id).order_by(Payment.due_date.desc()).limit(1)
    )
    return MemberListItem(
        id=member.id,
        user_id=member.user_id,
        name=member.user.name,
        email=member.user.email,
        phone=member.user.phone,
        plan_type=member.plan_type,
        join_date=member.join_date,
        status=member.status,
        last_visit=member.last_visit,
        attendance_rate=member_attendance_rate(db, member.id),
        upcoming_bookings=upcoming_bookings,
        payment_status=latest_payment.status if latest_payment else None,
    )


def revenue_series(db: Session, months: int) -> list[RevenuePoint]:
    today = date.today().replace(day=1)
    month_starts: list[date] = []
    current = today
    for _ in range(months):
        month_starts.append(current)
        if current.month == 1:
            current = current.replace(year=current.year - 1, month=12)
        else:
            current = current.replace(month=current.month - 1)
    month_starts.reverse()

    points: list[RevenuePoint] = []
    for month_start in month_starts:
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)
        total = db.scalar(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.status == PaymentStatus.paid,
                Payment.paid_date >= month_start,
                Payment.paid_date < month_end,
            )
        )
        points.append(RevenuePoint(month=month_start.strftime("%b %Y"), revenue=float(total or 0)))
    return points


def monthly_revenue(db: Session) -> float:
    start, end = month_window()
    total = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == PaymentStatus.paid,
            Payment.paid_date >= start,
            Payment.paid_date < end,
        )
    )
    return float(total or 0)


def no_show_rate(db: Session) -> float:
    since = datetime.now() - timedelta(days=30)
    counts = db.execute(
        select(
            func.count(Booking.id).label("total"),
            func.sum(case((Booking.status == BookingStatus.no_show, 1), else_=0)).label("no_show"),
        ).where(Booking.booked_at >= since, Booking.status != BookingStatus.cancelled)
    ).one()
    total = counts.total or 0
    no_show = counts.no_show or 0
    if total == 0:
        return 0.0
    return round((no_show / total) * 100, 1)


def parse_time_from_text(message: str) -> time | None:
    match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", message.lower())
    if not match:
        return None
    hour = int(match.group(1))
    minute = int(match.group(2) or 0)
    period = match.group(3)
    if period == "pm" and hour != 12:
        hour += 12
    if period == "am" and hour == 12:
        hour = 0
    return time(hour=hour, minute=minute)


def extract_class_type(message: str):
    lowered = message.lower()
    for class_type in ClassType:
        if class_type.value in lowered:
            return class_type
    return None


def extract_requested_day(message: str) -> date | None:
    lowered = message.lower()
    today = date.today()
    if "tomorrow" in lowered:
        return today + timedelta(days=1)
    if "today" in lowered:
        return today
    for index, weekday in enumerate(WEEKDAYS):
        if weekday in lowered:
            delta = (index - today.weekday()) % 7
            if delta == 0:
                delta = 7
            return today + timedelta(days=delta)
    return None


def contains_any_phrase(message: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in message for phrase in phrases)


def has_booking_intent(message: str) -> bool:
    return (
        bool(re.search(r"\b(book|reserve)\b", message))
        or "sign me up" in message
        or bool(re.search(r"\bjoin\b.*\bclass\b", message))
    )


def has_cancel_intent(message: str) -> bool:
    return bool(re.search(r"\b(cancel|drop|remove)\b", message))


def candidate_sessions(db: Session, target_date: date | None = None, horizon_days: int = 7) -> list[ClassSessionOut]:
    if target_date:
        return get_classes_for_date(db, target_date)

    today = date.today()
    sessions: list[ClassSessionOut] = []
    for offset in range(horizon_days + 1):
        sessions.extend(get_classes_for_date(db, today + timedelta(days=offset)))
    return [session for session in sessions if session.start_at >= datetime.now()]


def upcoming_bookings_for_member(
    db: Session,
    member_id: int,
    target_date: date | None = None,
    limit: int = 5,
) -> list[Booking]:
    bookings = db.scalars(
        select(Booking)
        .join(Booking.gym_class)
        .options(selectinload(Booking.gym_class))
        .where(
            Booking.member_id == member_id,
            Booking.status == BookingStatus.confirmed,
            Booking.booked_at >= datetime.now(),
        )
        .order_by(Booking.booked_at)
        .limit(limit)
    ).all()
    if target_date:
        bookings = [booking for booking in bookings if booking.booked_at.date() == target_date]
    return bookings


def format_time_label(target_time: time) -> str:
    return target_time.strftime("%I:%M %p").lstrip("0")


def format_session_option(session: ClassSessionOut, include_date: bool = True) -> str:
    if include_date:
        return f"{session.scheduled_date.strftime('%A')} at {format_time_label(session.start_time)} {session.name}"
    return f"{format_time_label(session.start_time)} {session.name}"


def format_booking_option(booking: Booking, include_date: bool = True) -> str:
    if include_date:
        return f"{booking.booked_at.strftime('%A')} at {format_time_label(booking.booked_at.time())} {booking.gym_class.name}"
    return f"{format_time_label(booking.booked_at.time())} {booking.gym_class.name}"


def format_session_list(sessions: list[ClassSessionOut], include_date: bool = True, limit: int = 4) -> str:
    return ", ".join(format_session_option(session, include_date=include_date) for session in sessions[:limit])


def format_booking_list(bookings: list[Booking], include_date: bool = True, limit: int = 4) -> str:
    return ", ".join(format_booking_option(booking, include_date=include_date) for booking in bookings[:limit])


def monthly_usage_summary(db: Session, member: Member) -> tuple[int, int | None]:
    start, end = month_window()
    used = (
        db.scalar(
            select(func.count(Booking.id)).where(
                Booking.member_id == member.id,
                Booking.booked_at >= datetime.combine(start, time.min),
                Booking.booked_at < datetime.combine(end, time.min),
                Booking.status != BookingStatus.cancelled,
            )
        )
        or 0
    )
    return used, plan_limit(member.plan_type)


def booking_request_specificity(message: str) -> int:
    return sum(
        value is not None
        for value in (
            extract_requested_day(message),
            extract_class_type(message),
            parse_time_from_text(message),
        )
    )


def suggested_sessions(
    db: Session,
    requested_date: date | None,
    requested_type: ClassType | None,
    requested_time: time | None,
    horizon_days: int = 7,
    limit: int = 3,
) -> list[ClassSessionOut]:
    candidates = [session for session in candidate_sessions(db, requested_date, horizon_days) if session.spots_left > 0]
    if requested_type:
        typed_candidates = [session for session in candidates if session.class_type == requested_type]
        if typed_candidates:
            candidates = typed_candidates
    if not candidates and requested_type:
        candidates = [session for session in candidate_sessions(db, None, horizon_days) if session.spots_left > 0]
        typed_candidates = [session for session in candidates if session.class_type == requested_type]
        if typed_candidates:
            candidates = typed_candidates
    if requested_time and candidates:
        candidates = sorted(
            candidates,
            key=lambda item: abs(
                (
                    datetime.combine(item.scheduled_date, item.start_time)
                    - datetime.combine(item.scheduled_date, requested_time)
                ).total_seconds()
            ),
        )
    return candidates[:limit]


def find_matching_session(db: Session, message: str) -> ClassSessionOut | None:
    requested_date = extract_requested_day(message)
    requested_type = extract_class_type(message)
    requested_time = parse_time_from_text(message)
    candidates = candidate_sessions(db, requested_date)

    if requested_type:
        candidates = [item for item in candidates if item.class_type == requested_type]
    if requested_time:
        candidates = [
            item
            for item in candidates
            if abs(
                (
                    datetime.combine(item.scheduled_date, item.start_time)
                    - datetime.combine(item.scheduled_date, requested_time)
                ).total_seconds()
            )
            <= 60 * 60
        ]
    candidates = [item for item in candidates if item.spots_left > 0]
    return candidates[0] if candidates else None


def find_matching_booking(db: Session, member_id: int, message: str) -> Booking | None:
    requested_date = extract_requested_day(message)
    requested_type = extract_class_type(message)
    requested_time = parse_time_from_text(message)

    bookings = db.scalars(
        select(Booking)
        .join(Booking.gym_class)
        .options(selectinload(Booking.gym_class))
        .where(
            Booking.member_id == member_id,
            Booking.status == BookingStatus.confirmed,
            Booking.booked_at >= datetime.now(),
        )
        .order_by(Booking.booked_at)
    ).all()
    if requested_date:
        bookings = [booking for booking in bookings if booking.booked_at.date() == requested_date]
    if requested_type:
        bookings = [booking for booking in bookings if booking.gym_class.class_type == requested_type]
    if requested_time:
        bookings = [
            booking
            for booking in bookings
            if abs(
                (
                    datetime.combine(booking.booked_at.date(), booking.booked_at.time())
                    - datetime.combine(booking.booked_at.date(), requested_time)
                ).total_seconds()
            )
            <= 60 * 60
        ]
    return bookings[0] if bookings else None


def infer_intent(db: Session, member: Member, message: str) -> IntentCandidate:
    lowered = message.lower().strip()
    requested_date = extract_requested_day(lowered)
    requested_type = extract_class_type(lowered)
    requested_time = parse_time_from_text(lowered)

    if "classes" in lowered and "left" in lowered and "month" in lowered:
        used, limit = monthly_usage_summary(db, member)
        if limit is None:
            return IntentCandidate("Your VIP plan has unlimited classes this month.")
        return IntentCandidate(
            f"You've used {used} of {limit} classes this month, so you have {max(limit - used, 0)} left."
        )

    if "haven't been" in lowered or "been in a while" in lowered or "not been" in lowered:
        sessions = [
            session
            for session in candidate_sessions(db, horizon_days=7)
            if session.class_type in {ClassType.yoga, ClassType.pilates}
        ][:3]
        if not sessions:
            return IntentCandidate("We've got your back. I can help you ease in with the next beginner-friendly class.")
        suggestions = ", ".join(
            f"{session.name} on {session.scheduled_date.strftime('%a')} at {format_time_label(session.start_time)}"
            for session in sessions
        )
        return IntentCandidate(
            f"It's totally okay to restart gently. Beginner-friendly options coming up are {suggestions}."
        )

    if has_booking_intent(lowered):
        if booking_request_specificity(lowered) == 0:
            options = suggested_sessions(db, None, None, None, horizon_days=3)
            if options:
                return IntentCandidate(
                    "I can book a class for you. Good upcoming options are "
                    f"{format_session_list(options)}. Tell me the day, class type, or time you want."
                )
            return IntentCandidate("I can book a class for you. Tell me the day, class type, or time you want.")

        session = find_matching_session(db, lowered)
        if session:
            return IntentCandidate(
                reply_context=(
                    f"I found {session.name} with {session.trainer} on "
                    f"{session.scheduled_date.strftime('%A')} at {format_time_label(session.start_time)}."
                ),
                action="book_class",
                action_payload={
                    "class_id": session.id,
                    "scheduled_for": session.start_at.isoformat(),
                    "class_name": session.name,
                },
            )

        options = suggested_sessions(db, requested_date, requested_type, requested_time)
        if options:
            return IntentCandidate(
                "I couldn't find an exact match. The closest options are "
                f"{format_session_list(options)}. Tell me which one you'd like."
            )
        return IntentCandidate("I couldn't find a matching class in the next week. Tell me the day, class type, or time you want.")

    if has_cancel_intent(lowered):
        upcoming_bookings = upcoming_bookings_for_member(db, member.id)
        if not upcoming_bookings:
            return IntentCandidate("You don't have any upcoming bookings to cancel.")
        if booking_request_specificity(lowered) == 0:
            if len(upcoming_bookings) == 1:
                booking = upcoming_bookings[0]
                return IntentCandidate(
                    reply_context=(
                        f"I found your {booking.gym_class.name} booking on "
                        f"{booking.booked_at.strftime('%A')} at {format_time_label(booking.booked_at.time())}."
                    ),
                    action="cancel_booking",
                    action_payload={
                        "booking_id": booking.id,
                        "class_id": booking.class_id,
                        "scheduled_for": booking.booked_at.isoformat(),
                        "class_name": booking.gym_class.name,
                    },
                )
            return IntentCandidate(
                f"Your upcoming bookings are {format_booking_list(upcoming_bookings)}. Tell me which one you'd like to cancel."
            )

        booking = find_matching_booking(db, member.id, lowered)
        if booking:
            return IntentCandidate(
                reply_context=(
                    f"I found your {booking.gym_class.name} booking on "
                    f"{booking.booked_at.strftime('%A')} at {format_time_label(booking.booked_at.time())}."
                ),
                action="cancel_booking",
                action_payload={
                    "booking_id": booking.id,
                    "class_id": booking.class_id,
                    "scheduled_for": booking.booked_at.isoformat(),
                    "class_name": booking.gym_class.name,
                },
            )
        return IntentCandidate(
            f"I couldn't find that exact booking. Your upcoming bookings are {format_booking_list(upcoming_bookings)}."
        )

    if contains_any_phrase(lowered, PERSONAL_BOOKING_WORDS):
        member_bookings = upcoming_bookings_for_member(db, member.id, requested_date)
        if member_bookings:
            return IntentCandidate(f"Your upcoming bookings are {format_booking_list(member_bookings)}.")
        if requested_date:
            sessions = get_classes_for_date(db, requested_date)
            if sessions:
                return IntentCandidate(
                    "You're not booked for anything then. Available classes are "
                    f"{format_session_list(sessions, include_date=False)}."
                )
            return IntentCandidate("You're not booked for anything then, and there are no classes scheduled.")
        return IntentCandidate("You don't have any upcoming bookings right now.")

    if contains_any_phrase(lowered, SCHEDULE_WORDS):
        if "week" in lowered:
            sessions = candidate_sessions(db, horizon_days=7)
            if requested_type:
                sessions = [session for session in sessions if session.class_type == requested_type]
            if not sessions:
                return IntentCandidate("There are no matching classes scheduled in the next week.")
            return IntentCandidate(f"The next classes this week are {format_session_list(sessions)}.")

        target_date = requested_date or (date.today() if "today" in lowered else None)
        if target_date:
            sessions = get_classes_for_date(db, target_date)
            if requested_type:
                sessions = [session for session in sessions if session.class_type == requested_type]
            if not sessions:
                return IntentCandidate("There are no matching classes scheduled then.")
            return IntentCandidate(f"Available classes are {format_session_list(sessions, include_date=False)}.")

        sessions = candidate_sessions(db, horizon_days=5)
        if requested_type:
            sessions = [session for session in sessions if session.class_type == requested_type]
        if sessions:
            return IntentCandidate(f"Coming up next are {format_session_list(sessions)}.")

    if contains_any_phrase(lowered, PLAN_WORDS):
        used, limit = monthly_usage_summary(db, member)
        if limit is None:
            return IntentCandidate(
                f"You're on the {member.plan_type.value} plan with unlimited classes. You've used {used} classes this month."
            )
        return IntentCandidate(
            f"You're on the {member.plan_type.value} plan with {limit} classes per month. You've used {used}, so {max(limit - used, 0)} are left."
        )

    if contains_any_phrase(lowered, PAYMENT_WORDS):
        latest_payment = db.scalar(
            select(Payment).where(Payment.member_id == member.id).order_by(Payment.due_date.desc()).limit(1)
        )
        if latest_payment:
            return IntentCandidate(
                f"Your latest payment is {latest_payment.status.value} for "
                f"{settings.currency_symbol}{float(latest_payment.amount):.0f}, due {latest_payment.due_date.isoformat()}."
            )
        return IntentCandidate("You don't have any payment records yet.")

    return IntentCandidate("I can help with schedules, bookings, membership details, and payments.")


class GymChatbotService:
    def __init__(self, db: Session):
        self.db = db
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def system_prompt(self, member: Member) -> str:
        today = date.today()
        todays_classes = serialize_class_sessions(get_classes_for_date(self.db, today))
        member_bookings = self.db.scalars(
            select(Booking)
            .join(Booking.gym_class)
            .options(selectinload(Booking.gym_class))
            .where(
                Booking.member_id == member.id,
                Booking.booked_at >= datetime.now(),
                Booking.status == BookingStatus.confirmed,
            )
            .order_by(Booking.booked_at)
            .limit(5)
        ).all()
        return (
            "You are GymFlow AI, the friendly assistant for "
            f"{settings.gym_name} gym.\n"
            f"Current date: {today.isoformat()}\n"
            f"Available classes today: {json.dumps(todays_classes)}\n"
            f"Member speaking: {member.user.name}, Plan: {member.plan_type.value}, "
            f"Bookings: {json.dumps(serialize_booking_list(member_bookings))}\n"
            "You can help members: check class schedules, book/cancel classes, check their membership, get payment info.\n"
            "When a member wants to book, respond with action: book_class and include the class_id in action_payload.\n"
            "Be friendly, concise, and use emojis occasionally. Always respond in the same language the member uses.\n"
            "Keep replies under 100 words. Always reply with valid JSON containing reply, action, action_payload."
        )

    def fallback_response(self, intent: IntentCandidate) -> ChatResponse:
        reply = intent.reply_context
        if intent.action:
            reply = f"{reply} Would you like me to go ahead? Yes or no?"
        return ChatResponse(reply=truncate_words(reply), action=intent.action, action_payload=intent.action_payload)

    def handle_message(self, member: Member, message: str) -> ChatResponse:
        intent = infer_intent(self.db, member, message)
        fallback = self.fallback_response(intent)
        if not self.client:
            return fallback

        latest_payments = self.db.scalars(
            select(Payment).where(Payment.member_id == member.id).order_by(Payment.due_date.desc()).limit(3)
        ).all()
        payload = {
            "member_question": message,
            "intent_context": intent.reply_context,
            "candidate_action": intent.action,
            "candidate_action_payload": intent.action_payload,
            "payments": [
                {
                    "amount": float(payment.amount),
                    "status": payment.status.value,
                    "due_date": payment.due_date.isoformat(),
                }
                for payment in latest_payments
            ],
        }

        try:
            completion = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": self.system_prompt(member)},
                    {
                        "role": "user",
                        "content": (
                            "Use this real data to answer the member. "
                            "If candidate_action is provided, keep it unless it is clearly invalid. "
                            "End action replies with a Yes/No confirmation request.\n"
                            f"{json.dumps(payload)}"
                        ),
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=220,
            )
            raw_content = completion.choices[0].message.content or "{}"
            parsed = json.loads(raw_content)
            reply = truncate_words(parsed.get("reply") or fallback.reply)
            action = parsed.get("action", intent.action)
            action_payload = parsed.get("action_payload", intent.action_payload)
            if intent.action and action != intent.action:
                action = intent.action
                action_payload = intent.action_payload
            if action and not reply.lower().endswith(("yes?", "no?", "yes or no?", "yes/no?")):
                reply = f"{reply.rstrip('.')} Yes or no?"
            return ChatResponse(reply=reply, action=action, action_payload=action_payload)
        except Exception:
            return fallback


def build_chat_history(db: Session, member_id: int) -> list[ChatMessage]:
    return db.scalars(
        select(ChatMessage).where(ChatMessage.member_id == member_id).order_by(ChatMessage.timestamp.asc())
    ).all()
