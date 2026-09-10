"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, type AuthUser } from "@/services/authServices";

/**
 * useAuthGuard
 * ─────────────
 * Shared hook for pages that require authentication.
 * - Redirects to /login immediately if no token is found in localStorage.
 * - Returns the cached AuthUser once confirmed.
 * - `ready` is false until the check completes (prevents a flash of protected content).
 */
export function useAuthGuard(): { user: AuthUser | null; ready: boolean } {
  const router = useRouter();
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setUser(getUser());
    setReady(true);
  }, [router]);

  return { user, ready };
}

/**
 * useGuestGuard
 * ─────────────
 * Shared hook for pages that should NOT be accessible when logged in
 * (e.g. /login, /register).
 * - Redirects to / immediately if a token is already present.
 * - `ready` is false until the check completes.
 */
export function useGuestGuard(): { ready: boolean } {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  return { ready };
}
