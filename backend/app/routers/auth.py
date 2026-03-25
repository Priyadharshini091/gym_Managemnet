from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Member, MemberStatus, User, UserRole
from ..schemas import CurrentUserResponse, LoginRequest, MemberProfile, RegisterRequest, TokenResponse, UserSummary
from ..security import create_access_token, hash_password, verify_password


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
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
        join_date=date.today(),
        status=MemberStatus.active,
        last_visit=None,
    )
    db.add(member)
    db.commit()
    db.refresh(user)
    db.refresh(member)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserSummary.model_validate(user),
        member=MemberProfile.model_validate(member),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(user.id)
    member = db.scalar(select(Member).where(Member.user_id == user.id)) if user.role == UserRole.member else None
    return TokenResponse(
        access_token=token,
        user=UserSummary.model_validate(user),
        member=MemberProfile.model_validate(member) if member else None,
    )


@router.get("/me", response_model=CurrentUserResponse)
def me(current_user: User = Depends(get_current_user)) -> CurrentUserResponse:
    return CurrentUserResponse(
        user=UserSummary.model_validate(current_user),
        member=MemberProfile.model_validate(current_user.member) if current_user.member else None,
    )
