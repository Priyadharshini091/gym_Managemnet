from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import get_current_user, require_owner
from ..models import Member, Payment, PaymentStatus, User, UserRole
from ..schemas import MessageResponse, PaymentCreate, PaymentOut
from ..services import payment_to_schema, sync_payment_statuses


router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("/", response_model=list[PaymentOut])
def list_payments(
    status: str | None = None,
    member_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PaymentOut]:
    statement = (
        select(Payment)
        .options(selectinload(Payment.member).selectinload(Member.user))
        .order_by(Payment.due_date.desc())
    )
    if current_user.role == UserRole.member and current_user.member:
        statement = statement.where(Payment.member_id == current_user.member.id)
    elif member_id is not None:
        statement = statement.where(Payment.member_id == member_id)
    if status:
        statement = statement.where(Payment.status == status)
    payments = db.scalars(statement).all()
    return [payment_to_schema(payment) for payment in payments]


@router.post("/", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, _: User = Depends(require_owner), db: Session = Depends(get_db)) -> PaymentOut:
    member = db.scalar(select(Member).where(Member.id == payload.member_id))
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    payment = Payment(
        member_id=payload.member_id,
        amount=payload.amount,
        due_date=payload.due_date,
        paid_date=payload.paid_date,
        status=payload.status,
        plan_type=payload.plan_type,
    )
    db.add(payment)
    db.commit()
    payment = db.scalar(
        select(Payment).options(selectinload(Payment.member).selectinload(Member.user)).where(Payment.id == payment.id)
    )
    return payment_to_schema(payment)


@router.post("/bulk-remind", response_model=MessageResponse)
def bulk_remind(_: User = Depends(require_owner), db: Session = Depends(get_db)) -> MessageResponse:
    updated = sync_payment_statuses(db)
    count = (
        db.scalar(
            select(func.count(Payment.id)).where(Payment.status.in_([PaymentStatus.due, PaymentStatus.overdue]))
        )
        or 0
    )
    return MessageResponse(
        message="Queued reminders for due and overdue payments.",
        meta={"updated_to_overdue": updated, "count": count},
    )


@router.post("/{payment_id}/pay", response_model=PaymentOut)
def pay_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentOut:
    payment = db.scalar(select(Payment).where(Payment.id == payment_id))
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    if current_user.role == UserRole.member and payment.member_id != current_user.member.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot pay another member's invoice")

    payment.status = PaymentStatus.paid
    payment.paid_date = date.today()
    db.commit()
    payment = db.scalar(
        select(Payment).options(selectinload(Payment.member).selectinload(Member.user)).where(Payment.id == payment_id)
    )
    return payment_to_schema(payment)
