from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .database import get_db
from .models import Member, User, UserRole
from .security import decode_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    statement = select(User).options(selectinload(User.member)).where(User.id == int(user_id))
    user = db.scalar(statement)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required")
    return current_user


def require_trainer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.trainer, UserRole.owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Trainer or owner access required")
    return current_user


def get_current_member(current_user: User = Depends(get_current_user)) -> Member:
    if not current_user.member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Member access required")
    return current_user.member
