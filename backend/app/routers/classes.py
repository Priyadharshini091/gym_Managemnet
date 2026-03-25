from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_owner
from ..models import GymClass, User
from ..schemas import ClassSessionOut, GymClassCreate, GymClassUpdate, MessageResponse
from ..services import get_week_sessions
from ..utils import normalize_day


router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.get("/", response_model=list[ClassSessionOut])
def list_classes(week: str | None = None, _: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ClassSessionOut]:
    return get_week_sessions(db, week)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_class(payload: GymClassCreate, _: User = Depends(require_owner), db: Session = Depends(get_db)) -> dict:
    gym_class = GymClass(
        name=payload.name,
        trainer=payload.trainer,
        start_time=payload.start_time,
        end_time=payload.end_time,
        capacity=payload.capacity,
        class_type=payload.class_type,
        day_of_week=normalize_day(payload.day_of_week),
    )
    db.add(gym_class)
    db.commit()
    db.refresh(gym_class)
    return {"id": gym_class.id, "message": "Class created"}


@router.put("/{class_id}")
def update_class(
    class_id: int,
    payload: GymClassUpdate,
    _: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    gym_class = db.scalar(select(GymClass).where(GymClass.id == class_id))
    if not gym_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    updates = payload.model_dump(exclude_unset=True)
    if "day_of_week" in updates:
        updates["day_of_week"] = normalize_day(updates["day_of_week"])
    for field, value in updates.items():
        setattr(gym_class, field, value)
    db.commit()
    db.refresh(gym_class)
    return {"id": gym_class.id, "message": "Class updated"}


@router.delete("/{class_id}", response_model=MessageResponse)
def delete_class(class_id: int, _: User = Depends(require_owner), db: Session = Depends(get_db)) -> MessageResponse:
    gym_class = db.scalar(select(GymClass).where(GymClass.id == class_id))
    if not gym_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    db.delete(gym_class)
    db.commit()
    return MessageResponse(message="Class deleted")
