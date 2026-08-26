from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models.trip import Trip
from database import SessionLocal, init_db
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation_recommendation,
)
from services.bedrock_service import get_travel_recommendation, get_food_recommendation

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


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
def create_trip(request: TripRequest):
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
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    trip = Trip(
        destination               = request.destination,
        days                      = request.days,
        budget                    = request.budget,
        category                  = category,
        daily_budget              = daily_budget,
        ai_recommendation         = ai_recommendation,
        local_food_recommendation = local_food_recommendation,
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
    }


# GET /api/v1/trips — ambil semua trip
@app.get("/api/v1/trips")
def list_trips():
    db = SessionLocal()
    trips = db.query(Trip).all()
    db.close()
    return trips


# GET /api/v1/trips/{trip_id} — ambil trip by id
@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
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
def update_trip(trip_id: int, request: TripUpdateRequest):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

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
def delete_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    db.delete(trip)
    db.commit()
    db.close()
    return {"message": f"Trip with id {trip_id} deleted successfully"}
