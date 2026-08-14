from fastapi import  FastAPI
from pydantic import BaseModel
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation_recommendation
)



app = FastAPI()

# a Get endpoint at the root path

@app.get("/")
def home():
    return{
        "message":"Welcome to KelanaAI",
        "name":"Moch Fauzi"
    }
# a Get Health endpoint at the root path
@app.get("/health")
def home():
    return{
        "status":"OK"
    }

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float

# a Post at the root path
@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )
    transportation = get_transportation_recommendation(
        category
    )
    return {
        "destination": request.destination,
        "budget": request.budget,
        "daily_budget": daily_budget,
        "category": category,
        "recommendation_transportation": transportation
    }

