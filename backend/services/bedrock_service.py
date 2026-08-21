"""
bedrock_service.py
------------------
Handles all AWS Bedrock interactions using Bedrock API key (bearer token auth).

Bedrock API keys use HTTP Authorization header, not SigV4 signing.
Reference: https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html

Configuration loaded from .env:
  - AWS_BEARER_TOKEN_BEDROCK : Bedrock API key (starts with ABSK...)
  - AWS_REGION               : AWS region (e.g. ap-southeast-2)
  - MODEL_ID                 : Bedrock model ID (e.g. amazon.nova-lite-v1:0)
"""

import json
import os

import requests
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

AWS_BEARER_TOKEN = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
AWS_REGION       = os.getenv("AWS_REGION", "us-east-1")
MODEL_ID         = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")

BEDROCK_ENDPOINT = (
    f"https://bedrock-runtime.{AWS_REGION}.amazonaws.com"
    f"/model/{MODEL_ID}/converse"
)

# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

TRAVEL_PROMPT_TEMPLATE = """You are an experienced travel planner.
Plan a {days}-day itinerary for {destination}.
Budget: USD {budget}
Travel Style: {travel_style}

Format your response in Markdown using:
- ## for each day heading (e.g. ## Day 1: Arrival)
- Bullet lists (-) for activities, places to visit, and estimated costs

Provide a practical and well-structured itinerary for each day, including
recommended activities, places to visit, and estimated costs where appropriate."""


# ---------------------------------------------------------------------------
# Client initialisation
# ---------------------------------------------------------------------------

def get_bedrock_headers() -> dict:
    """
    Return HTTP headers required for Bedrock API key authentication.
    """
    if not AWS_BEARER_TOKEN:
        raise ValueError(
            "AWS_BEARER_TOKEN_BEDROCK is not set. "
            "Please add it to your .env file."
        )
    return {
        "Authorization": f"Bearer {AWS_BEARER_TOKEN}",
        "Content-Type":  "application/json",
    }


# ---------------------------------------------------------------------------
# AI recommendation
# ---------------------------------------------------------------------------

def get_travel_recommendation(
    days: int,
    destination: str,
    budget: float,
    travel_style: str,
) -> str:
    """
    Send a travel-planning request to AWS Bedrock and return the
    AI-generated itinerary as a string.

    Parameters
    ----------
    days          : Number of travel days.
    destination   : Travel destination (e.g. "Bali, Indonesia").
    budget        : Total budget in USD.
    travel_style  : Style of travel (e.g. "Backpacker", "Luxury").

    Returns
    -------
    str : The AI-generated itinerary text.

    Raises
    ------
    RuntimeError  : If the Bedrock API call fails.
    """
    prompt = TRAVEL_PROMPT_TEMPLATE.format(
        days=days,
        destination=destination,
        budget=budget,
        travel_style=travel_style,
    )

    payload = {
        "messages": [
            {
                "role": "user",
                "content": [{"text": prompt}],
            }
        ],
        "inferenceConfig": {
            "maxTokens": 2048,
            "temperature": 0.7,
            "topP": 0.9,
        },
    }

    try:
        response = requests.post(
            url     = BEDROCK_ENDPOINT,
            headers = get_bedrock_headers(),
            json    = payload,
            timeout = 60,
        )
        response.raise_for_status()

        data           = response.json()
        output_message = data["output"]["message"]
        recommendation = " ".join(
            block["text"]
            for block in output_message["content"]
            if "text" in block
        )
        return recommendation.strip()

    except requests.HTTPError as exc:
        raise RuntimeError(
            f"Bedrock API returned {exc.response.status_code}: {exc.response.text}"
        ) from exc
    except Exception as exc:
        raise RuntimeError(f"Bedrock API call failed: {exc}") from exc
