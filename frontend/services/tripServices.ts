const BASE_URL = "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TripRequest {
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
}

export interface TripResult {
  id: number;
  destination: string;
  budget: number;
  daily_budget: number;
  category: string;
  recommendation_transportation: string;
  ai_recommendation: string;
  local_food_recommendation: string | null;
}

export interface TripSummary {
  id: number;
  destination: string;
  days: number;
  budget: number;
  daily_budget: number;
  category: string;
  travel_style: string | null;
  ai_recommendation: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("kelana_token")
    : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string })?.detail ?? `Server error ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * POST /api/v1/trips
 * Create a new trip and get AI recommendation.
 */
export async function createTrip(data: TripRequest): Promise<TripResult> {
  const res = await fetch(`${BASE_URL}/api/v1/trips`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      destination: data.destination,
      budget: data.budget,
      days: data.days,
      travel_style: data.travel_style,
    }),
  });
  return handleResponse<TripResult>(res);
}

/**
 * GET /api/v1/trips
 * Fetch trips milik user yang sedang login.
 */
export async function listTrips(): Promise<TripSummary[]> {
  const res = await fetch(`${BASE_URL}/api/v1/trips`, {
    headers: authHeaders(),
  });
  return handleResponse<TripSummary[]>(res);
}

/**
 * GET /api/v1/trips/:id
 * Fetch a single trip by ID.
 */
export async function getTrip(id: number): Promise<TripSummary> {
  const res = await fetch(`${BASE_URL}/api/v1/trips/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse<TripSummary>(res);
}

/**
 * DELETE /api/v1/trips/:id
 * Delete a trip by ID.
 */
export async function deleteTrip(id: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/api/v1/trips/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<{ message: string }>(res);
}
