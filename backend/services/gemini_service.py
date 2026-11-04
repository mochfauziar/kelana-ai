"""
gemini_service.py
-----------------
Handles all Google Gemini AI interactions using the Gemini REST API
(generateContent endpoint) with API key authentication.

Reference: https://ai.google.dev/gemini-api/docs/text-generation

Configuration loaded from .env:
    - GEMINI_API_KEY : Google Gemini API key (from Google AI Studio)
    - GEMINI_MODEL   : Gemini model ID (e.g. gemini-1.5-flash)
"""

import os

import requests
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta"
    f"/models/{GEMINI_MODEL}:generateContent"
)

# ---------------------------------------------------------------------------
# Prompt templates
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

SUMMARY_PROMPT_TEMPLATE = """You are a travel copywriter.
Write a single short line (max 12 words) summarising a {days}-day trip to {destination} with a {travel_style} travel style.
Focus on the mood and highlights (e.g. "5 days · beaches, temples, and night markets").
Reply with ONLY that one line — no extra explanation, no quotes."""

FOOD_PROMPT_TEMPLATE = """You are a local food expert and culinary travel guide.
Recommend must-try local foods and dishes for a traveller visiting {destination}.
Travel Style: {travel_style}
Budget: USD {budget} total for {days} days

Provide exactly 5 to 8 local food recommendations. For each item use this format:
**[Food Name]** — [one sentence description of the dish and where/how it is typically served]. Estimated cost: [price range in USD].

After the list, add a short paragraph (2-3 sentences) titled **Dining Tips** with practical advice for eating like a local."""


# ---------------------------------------------------------------------------
# Client initialisation
# ---------------------------------------------------------------------------

def get_gemini_headers() -> dict:
    """
    Return HTTP headers required for Gemini API key authentication.
    """
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is not set. "
            "Please add it to your .env file."
        )
    return {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type":   "application/json",
    }


def _parse_response(data: dict) -> str:
    """
    Extract text from a Gemini generateContent response.

    Gemini returns candidates[0].content.parts[*].text — this helper
    joins all text parts into a single string.

    Raises RuntimeError if the response is empty, blocked, or malformed.
    """
    candidates = data.get("candidates", [])
    if not candidates:
        # Check if the prompt was blocked
        block_reason = data.get("promptFeedback", {}).get("blockReason")
        if block_reason:
            raise RuntimeError(f"Gemini request was blocked: {block_reason}")
        raise RuntimeError("Gemini API returned no candidates")

    candidate = candidates[0]
    finish_reason = candidate.get("finishReason", "")

    content = candidate.get("content", {})
    parts = content.get("parts", [])
    text = " ".join(part["text"] for part in parts if "text" in part)

    if not text.strip():
        if finish_reason == "SAFETY":
            raise RuntimeError("Gemini response was blocked by safety filters")
        raise RuntimeError(f"Gemini returned empty response (finishReason: {finish_reason})")

    return text.strip()


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
    Send a travel-planning request to Google Gemini and return the
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
    RuntimeError  : If the Gemini API call fails.
    """
    prompt = TRAVEL_PROMPT_TEMPLATE.format(
        days=days,
        destination=destination,
        budget=budget,
        travel_style=travel_style,
    )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 8192,
            "temperature": 0.7,
            "topP": 0.9,
        },
    }

    try:
        response = requests.post(
            url     = GEMINI_ENDPOINT,
            headers = get_gemini_headers(),
            json    = payload,
            timeout = 60,
        )
        response.raise_for_status()

        return _parse_response(response.json())

    except requests.HTTPError as exc:
        raise RuntimeError(
            f"Gemini API returned {exc.response.status_code}: {exc.response.text}"
        ) from exc
    except Exception as exc:
        raise RuntimeError(f"Gemini API call failed: {exc}") from exc


def get_food_recommendation(
    destination: str,
    days: int,
    budget: float,
    travel_style: str,
) -> str:
    """
    Send a local food recommendation request to Google Gemini and return
    the AI-generated food guide as a string.

    Parameters
    ----------
    destination   : Travel destination (e.g. "Bali, Indonesia").
    days          : Number of travel days.
    budget        : Total budget in USD.
    travel_style  : Style of travel (e.g. "Backpacker", "Luxury").

    Returns
    -------
    str : The AI-generated food recommendation text.

    Raises
    ------
    RuntimeError  : If the Gemini API call fails.
    """
    prompt = FOOD_PROMPT_TEMPLATE.format(
        destination=destination,
        days=days,
        budget=budget,
        travel_style=travel_style,
    )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 8192,
            "temperature": 0.7,
            "topP": 0.9,
        },
    }

    try:
        response = requests.post(
            url     = GEMINI_ENDPOINT,
            headers = get_gemini_headers(),
            json    = payload,
            timeout = 60,
        )
        response.raise_for_status()

        return _parse_response(response.json())

    except requests.HTTPError as exc:
        raise RuntimeError(
            f"Gemini API returned {exc.response.status_code}: {exc.response.text}"
        ) from exc
    except Exception as exc:
        raise RuntimeError(f"Gemini API call failed: {exc}") from exc


def get_trip_summary(
    destination: str,
    days: int,
    travel_style: str,
) -> str:
    """
    Generate a short one-line trip summary (≤12 words) using Google Gemini.

    Parameters
    ----------
    destination   : Travel destination (e.g. "Bali, Indonesia").
    days          : Number of travel days.
    travel_style  : Style of travel (e.g. "Backpacker", "Luxury").

    Returns
    -------
    str : One-line summary, e.g. "5 days · beaches, temples, and night markets".

    Raises
    ------
    RuntimeError  : If the Gemini API call fails.
    """
    prompt = SUMMARY_PROMPT_TEMPLATE.format(
        days=days,
        destination=destination,
        travel_style=travel_style,
    )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 256,
            "temperature": 0.5,
            "topP": 0.9,
        },
    }

    try:
        response = requests.post(
            url     = GEMINI_ENDPOINT,
            headers = get_gemini_headers(),
            json    = payload,
            timeout = 30,
        )
        response.raise_for_status()

        summary = _parse_response(response.json())
        return summary.strip('"').strip("'")

    except requests.HTTPError as exc:
        raise RuntimeError(
            f"Gemini API returned {exc.response.status_code}: {exc.response.text}"
        ) from exc
    except Exception as exc:
        raise RuntimeError(f"Gemini API call failed: {exc}") from exc


def chat_with_history(messages: list[dict]) -> str:
    """
    Send a multi-turn conversation to Google Gemini.

    Parameters
    ----------
    messages : list of {"role": "user"|"assistant", "content": str}
               Full conversation history ordered oldest → newest.
               The last entry must have role "user".

    Returns
    -------
    str : The AI assistant's reply text.

    Raises
    ------
    RuntimeError : If the Gemini API call fails.

    Note
    ----
    Gemini uses "model" as the assistant role name (not "assistant").
    This function translates "assistant" → "model" automatically.
    """
    contents = []
    for msg in messages:
        # Gemini uses "model" instead of "assistant"
        role = "model" if msg["role"] == "assistant" else msg["role"]
        contents.append({
            "role": role,
            "parts": [{"text": msg["content"]}],
        })

    payload = {
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": 8192,
            "temperature": 0.7,
            "topP": 0.9,
        },
    }

    try:
        response = requests.post(
            url     = GEMINI_ENDPOINT,
            headers = get_gemini_headers(),
            json    = payload,
            timeout = 60,
        )
        response.raise_for_status()

        return _parse_response(response.json())

    except requests.HTTPError as exc:
        raise RuntimeError(
            f"Gemini API returned {exc.response.status_code}: {exc.response.text}"
        ) from exc
    except Exception as exc:
        raise RuntimeError(f"Gemini API call failed: {exc}") from exc
