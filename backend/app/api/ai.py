from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, ChatHistory
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Copilot"])

@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def chat_with_copilot(
    chat_in: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Query the AI service (Groq or offline fallback)
    ai_response = await AIService.get_copilot_response(chat_in.message)
    
    # Store record in chat_history
    db_chat = ChatHistory(
        user_id=current_user.id,
        message=chat_in.message,
        response=ai_response
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    
    return db_chat

@router.get("/history")
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).order_by(ChatHistory.created_at.desc()).limit(30).all()
    return [ChatResponse.model_validate(h) for h in history]
