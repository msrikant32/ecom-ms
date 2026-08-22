"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import { API_BASE_URL } from "./config";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Authenticated fetch: attaches the current access token, and on a 401
  // (expired token) tries one silent refresh via the httpOnly cookie before
  // giving up - callers never see the expiry, only a fully-formed Response.
  authFetch: (path: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "ecom_auth";

interface StoredSession {
  user: User;
  accessToken: string;
}

// Session lives in localStorage, read through useSyncExternalStore rather
// than "useState + useEffect(() => setState(...))" - that pattern causes an
// extra render and (per React's stricter lint) risks a hydration mismatch,
// since localStorage isn't available during the server render at all.
// useSyncExternalStore is the API React built specifically for this:
// getServerSnapshot() runs during SSR and the initial client hydration pass
// (both return null, so they match), then React corrects to the real
// getSnapshot() value synchronously right after hydration, before any
// passive effect in a descendant component runs.
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: StoredSession | null = null;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = null;
    return cachedSnapshot;
  }
  try {
    cachedSnapshot = JSON.parse(raw) as StoredSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    cachedSnapshot = null;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): StoredSession | null {
  return null;
}

function writeSession(session: StoredSession | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  notifyListeners();
}

async function parseError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error?.message ?? fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = session?.user ?? null;
  const accessToken = session?.accessToken ?? null;

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await parseError(res, "Login failed"));
    const body = await res.json();
    writeSession({ user: body.user, accessToken: body.accessToken });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await parseError(res, "Registration failed"));
    const body = await res.json();
    writeSession({ user: body.user, accessToken: body.accessToken });
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    writeSession(null);
  }, []);

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const currentToken = getSnapshot()?.accessToken ?? null;
      // FormData (file uploads) must NOT get a manual Content-Type - the
      // browser needs to set its own multipart boundary. JSON bodies still
      // default to application/json unless the caller overrides it.
      const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
      const doFetch = (token: string | null) =>
        fetch(`${API_BASE_URL}${path}`, {
          ...options,
          credentials: "include",
          headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
          },
        });

      let res = await doFetch(currentToken);
      if (res.status === 401 && currentToken) {
        const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (refreshRes.ok) {
          const body = await refreshRes.json();
          writeSession({ user: body.user, accessToken: body.accessToken });
          res = await doFetch(body.accessToken);
        } else {
          writeSession(null);
        }
      }
      return res;
    },
    []
  );

  return (
    <AuthContext.Provider value={{ user, accessToken, loading: false, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
