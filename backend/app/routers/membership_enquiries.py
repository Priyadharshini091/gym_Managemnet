from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_owner
from ..models import MembershipEnquiry, User
from ..schemas import MembershipEnquiryCreate, MembershipEnquiryOut, MessageResponse


router = APIRouter(prefix="/api/membership-enquiries", tags=["membership-enquiries"])


def clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_membership_enquiry(payload: MembershipEnquiryCreate, db: Session = Depends(get_db)) -> MessageResponse:
    enquiry = MembershipEnquiry(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        phone=clean_optional(payload.phone),
        preferred_plan=payload.preferred_plan,
        fitness_goal=clean_optional(payload.fitness_goal),
        preferred_contact=clean_optional(payload.preferred_contact),
        message=payload.message.strip(),
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return MessageResponse(
        message="Membership enquiry received. Our team will reach out soon.",
        meta={"enquiry_id": enquiry.id},
    )


@router.get("", response_model=list[MembershipEnquiryOut], include_in_schema=False)
@router.get("/", response_model=list[MembershipEnquiryOut])
def list_membership_enquiries(_: User = Depends(require_owner), db: Session = Depends(get_db)) -> list[MembershipEnquiryOut]:
    enquiries = db.scalars(select(MembershipEnquiry).order_by(MembershipEnquiry.created_at.desc())).all()
    return [MembershipEnquiryOut.model_validate(enquiry) for enquiry in enquiries]
