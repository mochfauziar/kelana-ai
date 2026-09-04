from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from models.trip import Trip
from models.users import User
from models.conversation import Conversation  # noqa: F401 — needed for init_db
from models.message import Message            # noqa: F401 — needed for init_db
from database import SessionLocal, init_db
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation_recommendation,
)
from services.bedrock_service import get_travel_recommendation, get_food_recommendation, get_trip_summary
from services.auth_service import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from services.kb_service import ask_knowledge_base
from services.chat_service import (
    create_conversation,
    list_conversations,
    get_conversation_or_404,
    rename_conversation,
    get_messages,
    send_message,
)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ── JWT Auth dependency ─────────────────────────────────────────────────────

bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> User:
    """Decode JWT token dan kembalikan user yang sedang login."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    db = SessionLocal()
    user = db.query(User).filter(User.id == int(user_id)).first()
    db.close()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

class RegisterRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


# POST /api/v1/auth/register
@app.post("/api/v1/auth/register", status_code=201)
def register(request: RegisterRequest):
    db = SessionLocal()
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        db.close()
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        name          = request.name,
        email         = request.email,
        password_hash = hash_password(request.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    return {
        "message": "User registered successfully",
        "user": {
            "id":         user.id,
            "name":       user.name,
            "email":      user.email,
            "created_at": user.created_at,
        },
    }


# POST /api/v1/auth/login
@app.post("/api/v1/auth/login")
def login(request: LoginRequest):
    db = SessionLocal()
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        db.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verifikasi password sebelum tutup session
    try:
        password_valid = verify_password(request.password, user.password_hash)
    except Exception as exc:
        db.close()
        raise HTTPException(status_code=500, detail=f"Password verify error: {exc}")

    db.close()

    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return {
        "access_token": access_token,
        "token_type":   "bearer",
        "user": {
            "id":    user.id,
            "name":  user.name,
            "email": user.email,
        },
    }


# GET /api/v1/auth/me — data user yang sedang login
@app.get("/api/v1/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    total_trips = db.query(Trip).filter(Trip.user_id == current_user.id).count()
    db.close()
    return {
        "id":                   current_user.id,
        "name":                 current_user.name,
        "email":                current_user.email,
        "created_at":           current_user.created_at,
        "total_trips_generated": total_trips,
    }


# GET /
@app.get("/")
def home():
    return {"message": "Welcome to KelanaAI", "name": "Moch Fauzi"}


# GET /health
@app.get("/health")
def health():
    return {"status": "OK"}


class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: str = "Standard"


# POST /api/v1/trips — buat trip baru dan simpan ke DB
@app.post("/api/v1/trips")
def create_trip(request: TripRequest, current_user: User = Depends(get_current_user)):
    daily_budget   = calculate_daily_budget(request.budget, request.days)
    category       = get_trip_category(request.budget)
    transportation = get_transportation_recommendation(category)

    # get AI recommendation from Bedrock
    try:
        ai_recommendation = get_travel_recommendation(
            days         = request.days,
            destination  = request.destination,
            budget       = request.budget,
            travel_style = request.travel_style,
        )
        local_food_recommendation = get_food_recommendation(
            destination  = request.destination,
            days         = request.days,
            budget       = request.budget,
            travel_style = request.travel_style,
        )
        trip_summary = get_trip_summary(
            destination  = request.destination,
            days         = request.days,
            travel_style = request.travel_style,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    trip = Trip(
        destination               = request.destination,
        days                      = request.days,
        budget                    = request.budget,
        category                  = category,
        daily_budget              = daily_budget,
        travel_style              = request.travel_style,
        ai_recommendation         = ai_recommendation,
        local_food_recommendation = local_food_recommendation,
        summary                   = trip_summary,
        user_id                   = current_user.id,
    )

    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)
    db.close()

    return {
        "id":                            trip.id,
        "destination":                   trip.destination,
        "budget":                        trip.budget,
        "daily_budget":                  trip.daily_budget,
        "category":                      trip.category,
        "recommendation_transportation": transportation,
        "ai_recommendation":             trip.ai_recommendation,
        "local_food_recommendation":     trip.local_food_recommendation,
        "summary":                       trip.summary,
    }


# GET /api/v1/trips — ambil trips milik user yang login
@app.get("/api/v1/trips")
def list_trips(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).all()
    db.close()
    return trips


# GET /api/v1/trips/{trip_id} — ambil trip by id (hanya milik user sendiri)
@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    db.close()
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip


class TripUpdateRequest(BaseModel):
    destination: str | None = None
    days: int | None = None
    budget: float | None = None


# PUT /api/v1/trips/{trip_id} — update trip by id
@app.put("/api/v1/trips/{trip_id}")
def update_trip(trip_id: int, request: TripUpdateRequest, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()

    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    # update field yang dikirim saja, field lain tetap
    if request.destination is not None:
        trip.destination = request.destination
    if request.days is not None:
        trip.days = request.days
    if request.budget is not None:
        trip.budget = request.budget

    # recalculate derived fields
    trip.daily_budget = calculate_daily_budget(trip.budget, trip.days)
    trip.category     = get_trip_category(trip.budget)

    db.commit()
    db.refresh(trip)
    db.close()
    return trip


class RecommendationRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: str


# POST /api/v1/trips/recommend — get AI travel recommendation
@app.post("/api/v1/trips/recommend")
def recommend_trip(request: RecommendationRequest):
    category = get_trip_category(request.budget)
    try:
        recommendation = get_travel_recommendation(
            days=request.days,
            destination=request.destination,
            budget=request.budget,
            travel_style=request.travel_style,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {
        "destination":      request.destination,
        "days":             request.days,
        "budget":           request.budget,
        "travel_style":     request.travel_style,
        "category":         category,
        "recommendation":   recommendation,
    }


# DELETE /api/v1/trips/{trip_id} — hapus trip by id
@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()

    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    db.delete(trip)
    db.commit()
    db.close()
    return {"message": f"Trip with id {trip_id} deleted successfully"}


class QuestionRequest(BaseModel):
    question: str


# POST /api/v1/ask — tanya ke Knowledge Base
@app.post("/api/v1/ask")
def ask_endpoint(request: QuestionRequest):
    # 1. Send question to Knowledge Base
    answer = ask_knowledge_base(
        request.question
    )
    # 2. Return grounded answer to frontend
    return {
        "question": request.question,
        "answer": answer
    }


# ── Conversation Schemas ────────────────────────────────────────────────────

class CreateConversationRequest(BaseModel):
    title: str = "New Conversation"


class SendMessageRequest(BaseModel):
    content: str


class RenameConversationRequest(BaseModel):
    title: str


# ── Conversation Endpoints ──────────────────────────────────────────────────

# POST /api/v1/conversations — buat conversation baru
@app.post("/api/v1/conversations", status_code=201)
def create_conversation_endpoint(
    request: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
):
    db   = SessionLocal()
    conv = create_conversation(db, user_id=current_user.id, title=request.title)
    db.close()
    return {"conversation_id": conv.id, "title": conv.title}


# GET /api/v1/conversations — list semua conversation milik user
@app.get("/api/v1/conversations")
def list_conversations_endpoint(current_user: User = Depends(get_current_user)):
    db    = SessionLocal()
    convs = list_conversations(db, user_id=current_user.id)
    result = [
        {
            "id":         c.id,
            "title":      c.title,
            "created_at": c.created_at,
        }
        for c in convs
    ]
    db.close()
    return result


# POST /api/v1/conversations/{conversation_id}/messages — kirim pesan, terima jawaban AI
@app.post("/api/v1/conversations/{conversation_id}/messages")
def send_message_endpoint(
    conversation_id: int,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
):
    db     = SessionLocal()
    result = send_message(db, conversation_id=conversation_id, user_id=current_user.id, content=request.content)
    db.close()
    return result


# GET /api/v1/conversations/{conversation_id}/messages — ambil history messages
@app.get("/api/v1/conversations/{conversation_id}/messages")
def get_messages_endpoint(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
):
    db   = SessionLocal()
    msgs = get_messages(db, conversation_id=conversation_id, user_id=current_user.id)
    result = [
        {
            "id":              m.id,
            "conversation_id": m.conversation_id,
            "role":            m.role,
            "content":         m.content,
            "created_at":      m.created_at,
        }
        for m in msgs
    ]
    db.close()
    return result


# PATCH /api/v1/conversations/{conversation_id} — rename title conversation
@app.patch("/api/v1/conversations/{conversation_id}")
def rename_conversation_endpoint(
    conversation_id: int,
    request: RenameConversationRequest,
    current_user: User = Depends(get_current_user),
):
    db   = SessionLocal()
    conv = rename_conversation(db, conversation_id=conversation_id, user_id=current_user.id, title=request.title)
    db.close()
    return {"conversation_id": conv.id, "title": conv.title}
