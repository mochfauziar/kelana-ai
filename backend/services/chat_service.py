"""
chat_service.py
---------------
Orchestration logic for the chat conversation feature.

All business logic lives here — route handlers in main.py stay thin.
DB session is passed in from the caller (manual SessionLocal pattern used
throughout this project).
"""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.conversation import Conversation
from models.message import Message
from services.bedrock_service import chat_with_history


# ---------------------------------------------------------------------------
# Conversation helpers
# ---------------------------------------------------------------------------

def create_conversation(db: Session, user_id: int, title: str = "New Conversation") -> Conversation:
    """Create a new conversation for the given user and persist it."""
    conv = Conversation(user_id=user_id, title=title)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def list_conversations(db: Session, user_id: int) -> list[Conversation]:
    """Return all conversations owned by user_id, newest first."""
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


def get_conversation_or_404(db: Session, conversation_id: int, user_id: int) -> Conversation:
    """
    Fetch a conversation by id.

    Raises
    ------
    HTTPException 404  : Conversation does not exist.
    HTTPException 403  : Conversation belongs to a different user.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access forbidden")
    return conv


def rename_conversation(db: Session, conversation_id: int, user_id: int, title: str) -> Conversation:
    """Rename the title of an existing conversation."""
    conv = get_conversation_or_404(db, conversation_id, user_id)
    conv.title      = title
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conv)
    return conv


# ---------------------------------------------------------------------------
# Message helpers
# ---------------------------------------------------------------------------

def get_messages(db: Session, conversation_id: int, user_id: int) -> list[Message]:
    """Return all messages in a conversation, ordered oldest → newest."""
    get_conversation_or_404(db, conversation_id, user_id)  # ownership check
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )


# ---------------------------------------------------------------------------
# Core send-message orchestration
# ---------------------------------------------------------------------------

def send_message(db: Session, conversation_id: int, user_id: int, content: str) -> dict:
    """
    Full message flow:

    1. Validate conversation ownership.
    2. Count existing messages (used for auto-title check).
    3. Persist the user message.
    4. Load the full history (including the new user message).
    5. Call Bedrock with the full history.
    6. Persist the assistant reply.
    7. Auto-generate a title from the first user message if applicable.
    8. Commit everything and return the result.

    Returns
    -------
    dict : {"answer": str, "conversation_id": int, "title": str}
    """
    conv = get_conversation_or_404(db, conversation_id, user_id)

    # Count existing messages before we add the new one
    existing_count = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .count()
    )

    # 1. Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=content,
    )
    db.add(user_msg)
    db.flush()  # assign id/created_at without committing yet

    # 2. Load full history (oldest → newest, including the message just flushed)
    history = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    # 3. Build Bedrock payload and call
    messages_payload = [{"role": m.role, "content": m.content} for m in history]
    try:
        ai_text = chat_with_history(messages_payload)
    except RuntimeError as exc:
        db.rollback()
        raise HTTPException(status_code=502, detail=str(exc))

    # 4. Save assistant reply
    assistant_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=ai_text,
    )
    db.add(assistant_msg)

    # 5. Auto-title: first message + title still default
    if existing_count == 0 and conv.title == "New Conversation":
        words           = content.split()
        generated_title = " ".join(words[:6])
        conv.title      = generated_title
        conv.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "answer":          ai_text,
        "conversation_id": conv.id,
        "title":           conv.title,
    }
