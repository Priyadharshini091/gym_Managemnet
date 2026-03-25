from __future__ import annotations

from datetime import date, datetime, time, timedelta

from fastapi import HTTPException, status

from .config import settings
from .models import PlanType


DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]
DAY_INDEX = {day: index for index, day in enumerate(DAYS)}


def normalize_day(day_of_week: str) -> str:
    normalized = day_of_week.strip().lower()
    if normalized not in DAY_INDEX:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid day_of_week")
    return normalized


def week_start_from_string(raw: str | None) -> date:
    base = date.fromisoformat(raw) if raw else date.today()
    return base - timedelta(days=base.weekday())


def combine_date_and_time(target_date: date, target_time: time) -> datetime:
    return datetime.combine(target_date, target_time)


def scheduled_date_for_week(week_start: date, day_of_week: str) -> date:
    return week_start + timedelta(days=DAY_INDEX[normalize_day(day_of_week)])


def next_occurrence_date(day_of_week: str, start_from: date | None = None) -> date:
    current = start_from or date.today()
    delta = (DAY_INDEX[normalize_day(day_of_week)] - current.weekday()) % 7
    return current + timedelta(days=delta)


def month_window(today: date | None = None) -> tuple[date, date]:
    current = today or date.today()
    start = current.replace(day=1)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


def plan_limit(plan_type: PlanType) -> int | None:
    if plan_type == PlanType.basic:
        return settings.basic_plan_limit
    if plan_type == PlanType.premium:
        return settings.premium_plan_limit
    return None


def truncate_words(text: str, limit: int = 100) -> str:
    words = text.split()
    if len(words) <= limit:
        return text.strip()
    return " ".join(words[:limit]).strip() + "..."
