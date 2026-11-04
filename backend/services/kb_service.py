"""
kb_service.py
-------------
Handles knowledge-base queries using Google Gemini with Google Search
grounding.

This replaces the previous AWS Bedrock Knowledge Base (boto3 RAG) approach.
Instead of retrieving from a custom vector database, Gemini grounds its
answers using Google Search and returns up-to-date information with
verifiable source citations.

Reference: https://ai.google.dev/gemini-api/docs/grounding

Configuration loaded from .env:
  - GEMINI_API_KEY : Google Gemini API key
  - GEMINI_MODEL   : Gemini model ID (e.g. gemini-2.5-flash)
"""

import os

import requests
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta"
    f"/models/{GEMINI_MODEL}:generateContent"
)


def _get_headers() -> dict:
    """Return HTTP headers required for Gemini API key authentication."""
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is not set. Please add it to your .env file."
        )
    return {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type":   "application/json",
    }


def ask_knowledge_base(question: str) -> str:
    """
    Answer a travel question using Gemini with Google Search grounding.

    Gemini searches the web for up-to-date information and grounds its
    answer in the search results. The response includes grounding metadata
    (source URLs, search queries) in candidates[0].groundingMetadata.

    Parameters
    ----------
    question : The user's travel question.

    Returns
    -------
    str : The grounded answer text, or a fallback message if no answer.

    Raises
    ------
    RuntimeError : If the Gemini API call fails.
    """
    prompt = f"""You are a helpful travel assistant.

Answer the user's question using information from Google Search.
Provide accurate, up-to-date, and helpful information for travellers.
If you cannot find relevant information, say that you don't have
enough information.

Question:
{question}

Answer:"""

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        # Google Search grounding — Gemini will search the web for
        # up-to-date information and cite its sources.
        "tools": [{"google_search": {}}],
        "generationConfig": {
            "maxOutputTokens": 8192,
            "temperature": 0.7,
            "topP": 0.9,
        },
    }

    try:
        response = requests.post(
            url     = GEMINI_ENDPOINT,
            headers = _get_headers(),
            json    = payload,
            timeout = 60,
        )
        response.raise_for_status()

        data = response.json()
        candidates = data.get("candidates", [])

        if not candidates:
            return "Maaf, saya tidak menemukan informasi yang relevan."

        content = candidates[0].get("content", {})
        parts = content.get("parts", [])
        text = " ".join(part["text"] for part in parts if "text" in part)

        if not text.strip():
            return "Maaf, saya tidak menemukan informasi yang relevan."

        return text.strip()

    except requests.HTTPError as exc:
        raise RuntimeError(
            f"Gemini API returned {exc.response.status_code}: {exc.response.text}"
        ) from exc
    except Exception as exc:
        raise RuntimeError(f"Gemini API call failed: {exc}") from exc
