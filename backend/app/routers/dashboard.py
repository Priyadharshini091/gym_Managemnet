from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import require_owner
from ..models import Booking, BookingStatus, Member, MemberStatus, User
from ..schemas import ClassSessionOut, DashboardStatsOut, RevenuePoint
from ..services import get_classes_for_date, member_list_item, monthly_revenue, no_show_rate, revenue_series


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsOut)
def get_stats(_: User = Depends(require_owner), db: Session = Depends(get_db)) -> DashboardStatsOut:
    members = db.scalars(select(Member).options(selectinload(Member.user)).order_by(Member.join_date.desc())).all()
    total_members = len(members)
    active_today = (
        db.scalar(
            select(func.count(func.distinct(Booking.member_id))).where(
                func.date(Booking.booked_at) == date.today().isoformat(),
                Booking.status == BookingStatus.confirmed,
            )
        )
        or 0
    )
    status_breakdown = {status.value: 0 for status in MemberStatus}
    for member in members:
        status_breakdown[member.status.value] += 1

    at_risk = [member_list_item(db, member) for member in members if member.status == MemberStatus.at_risk][:5]
    today_classes = get_classes_for_date(db, date.today())
    return DashboardStatsOut(
        total_members=total_members,
        active_today=active_today,
        monthly_revenue=monthly_revenue(db),
        no_show_rate=no_show_rate(db),
        status_breakdown=status_breakdown,
        today_classes=today_classes,
        at_risk_members=at_risk,
    )


@router.get("/revenue", response_model=list[RevenuePoint])
def get_revenue(months: int = 6, _: User = Depends(require_owner), db: Session = Depends(get_db)) -> list[RevenuePoint]:
    return revenue_series(db, months)


@router.get("/today-classes", response_model=list[ClassSessionOut])
def today_classes(_: User = Depends(require_owner), db: Session = Depends(get_db)) -> list[ClassSessionOut]:
    return get_classes_for_date(db, date.today())
