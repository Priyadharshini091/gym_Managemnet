from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import get_current_user
from ..models import ChatMessage, ChatRole, Member, User, UserRole
from ..schemas import ChatHistoryItem, ChatMessageRequest, ChatResponse
from ..services import GymChatbotService, build_chat_history


router = APIRouter(prefix="/api/chat", tags=["chat"])


def resolve_chat_member(db: Session, current_user: User, member_id: int) -> Member:
    member = db.scalar(select(Member).options(selectinload(Member.user)).where(Member.id == member_id))
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    if current_user.role == UserRole.member and current_user.member and current_user.member.id != member_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only access your own chat")
    return member


@router.post("/message", response_model=ChatResponse)
def send_message(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    member = resolve_chat_member(db, current_user, payload.member_id)
    user_message = ChatMessage(member_id=member.id, role=ChatRole.user, content=payload.message)

    try:
        db.add(user_message)
        db.flush()

        service = GymChatbotService(db)
        response = service.handle_message(member, payload.message)

        assistant_message = ChatMessage(member_id=member.id, role=ChatRole.assistant, content=response.reply)
        db.add(assistant_message)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process chat message",
        ) from exc

    return ChatResponse(
        reply=response.reply,
        action=response.action,
        action_payload=response.action_payload,
        messages=[
            ChatHistoryItem.model_validate(user_message),
            ChatHistoryItem.model_validate(assistant_message),
        ],
    )


@router.get("/history", response_model=list[ChatHistoryItem])
def history(
    member_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ChatHistoryItem]:
    if current_user.role == UserRole.member:
        if not current_user.member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Member account required")
        target_member_id = current_user.member.id
    else:
        if member_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="member_id is required")
        target_member_id = member_id

    messages = build_chat_history(db, target_member_id)
    return [ChatHistoryItem.model_validate(message) for message in messages]
