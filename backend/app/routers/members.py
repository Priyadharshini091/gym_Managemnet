from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import require_owner
from ..models import Booking, Member, MemberStatus, Payment, User, UserRole
from ..schemas import MemberCreate, MemberDetail, MemberListItem, MemberProfile, MemberUpdate, MessageResponse, UserSummary
from ..security import hash_password
from ..services import booking_to_schema, get_classes_for_date, member_list_item, payment_to_schema


router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("/at-risk", response_model=list[MemberListItem])
def at_risk_members(_: User = Depends(require_owner), db: Session = Depends(get_db)) -> list[MemberListItem]:
    members = db.scalars(
        select(Member)
        .options(selectinload(Member.user))
        .where(Member.status == MemberStatus.at_risk)
        .order_by(Member.last_visit)
    ).all()
    return [member_list_item(db, member) for member in members]


@router.get("/", response_model=list[MemberListItem])
def list_members(
    q: str | None = None,
    _: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> list[MemberListItem]:
    members = db.scalars(select(Member).options(selectinload(Member.user)).order_by(Member.join_date.desc())).all()
    if q:
        needle = q.lower()
        members = [
            member
            for member in members
            if needle in member.user.name.lower() or needle in member.user.email.lower()
        ]
    return [member_list_item(db, member) for member in members]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_member(payload: MemberCreate, _: User = Depends(require_owner), db: Session = Depends(get_db)) -> dict:
    existing_user = db.scalar(select(User).where(User.email == payload.email))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.member,
        name=payload.name,
        phone=payload.phone,
    )
    db.add(user)
    db.flush()

    member = Member(
        user_id=user.id,
        plan_type=payload.plan_type,
        join_date=payload.join_date or date.today(),
        status=payload.status,
        last_visit=payload.last_visit,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return {
        "message": "Member created",
        "member": {
            "user": UserSummary.model_validate(user),
            "member": MemberProfile.model_validate(member),
        },
    }


@router.get("/{member_id}", response_model=MemberDetail)
def get_member(member_id: int, _: User = Depends(require_owner), db: Session = Depends(get_db)) -> MemberDetail:
    member = db.scalar(select(Member).options(selectinload(Member.user)).where(Member.id == member_id))
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    bookings = db.scalars(
        select(Booking)
        .join(Booking.gym_class)
        .options(selectinload(Booking.gym_class))
        .where(Booking.member_id == member_id)
        .order_by(Booking.booked_at.desc())
        .limit(20)
    ).all()
    payments = db.scalars(
        select(Payment)
        .options(selectinload(Payment.member).selectinload(Member.user))
        .where(Payment.member_id == member_id)
        .order_by(Payment.due_date.desc())
        .limit(12)
    ).all()

    base = member_list_item(db, member)
    return MemberDetail(
        **base.model_dump(),
        bookings=[booking_to_schema(booking) for booking in bookings],
        payments=[payment_to_schema(payment) for payment in payments],
    )


@router.put("/{member_id}")
def update_member(
    member_id: int,
    payload: MemberUpdate,
    _: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    member = db.scalar(select(Member).options(selectinload(Member.user)).where(Member.id == member_id))
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    updates = payload.model_dump(exclude_unset=True)
    user_updates = {key: updates.pop(key) for key in ("name", "phone") if key in updates}
    for field, value in user_updates.items():
        setattr(member.user, field, value)
    for field, value in updates.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    return {"message": "Member updated"}


@router.post("/{member_id}/remind", response_model=MessageResponse)
def remind_member(member_id: int, _: User = Depends(require_owner), db: Session = Depends(get_db)) -> MessageResponse:
    member = db.scalar(select(Member).options(selectinload(Member.user)).where(Member.id == member_id))
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    suggestions = []
    for offset in range(1, 5):
        suggestions.extend(get_classes_for_date(db, date.today() + timedelta(days=offset)))
    suggestions = [session for session in suggestions if session.class_type.value in {"yoga", "pilates"}][:3]
    meta = {
        "member_name": member.user.name,
        "suggested_classes": [
            {
                "class_id": session.id,
                "name": session.name,
                "scheduled_for": session.start_at.isoformat(),
            }
            for session in suggestions
        ],
    }
    return MessageResponse(message=f"Reminder queued for {member.user.name}.", meta=meta)
