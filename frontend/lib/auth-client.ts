/**
 * Auth client for HttpOnly cookie-based authentication.
 * No JWT tokens are stored in localStorage — the browser handles
 * cookies automatically via `credentials: 'include'`.
 *
 * User profile metadata (non-sensitive) is cached in localStorage
 * for UI convenience only.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface User {
  id: string;
  fullName?: string;
  email: string;
  userType: string;
  username?: string;
  artistName?: string;
  profilePicUrl?: string;
}

// ---- Public API ----

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send & receive cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.user) {
      // Cache non-sensitive user metadata in localStorage for UI
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    }

    return { success: false, error: data.error || 'Login failed' };
  } catch {
    return { success: false, error: 'Network error — please check your connection' };
  }
}

export async function logout(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    localStorage.removeItem('user');
    return response.ok;
  } catch {
    localStorage.removeItem('user');
    return false;
  }
}

export async function logoutAllDevices(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/logout-all`, {
      method: 'POST',
      credentials: 'include',
    });

    localStorage.removeItem('user');
    return response.ok;
  } catch {
    localStorage.removeItem('user');
    return false;
  }
}

export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      // Re-fetch user data after refresh
      const userRes = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) {
          localStorage.setItem('user', JSON.stringify(userData.user));
        }
      }
      return true;
    }

    // Refresh failed — clear local state
    localStorage.removeItem('user');
    return false;
  } catch {
    return false;
  }
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getUser();
}

// ---- API helpers ----

/**
 * Authenticated fetch wrapper.
 * Automatically includes credentials and handles 401 by
 * attempting a silent token refresh (once).
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.headers || {}),
      // Let the browser set Content-Type for FormData, etc.
    },
  });

  if (response.status === 401) {
    // Token may be expired — try refreshing
    const refreshed = await refreshSession();
    if (refreshed) {
      // Retry the original request with fresh cookies
      response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...(options.headers || {}),
        },
      });
    } else {
      // Refresh failed — clear local state
      localStorage.removeItem('user');
      // Redirect to login if on client side
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return response;
}

// ---- Session helpers ----

export interface SessionInfo {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export async function getSessions(): Promise<{ success: boolean; sessions?: SessionInfo[]; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/sessions`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, sessions: data.sessions || [] };
    }
    return { success: false, error: data.error || 'Failed to load sessions' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function revokeSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await response.json();
    if (response.ok) return { success: true };
    return { success: false, error: data.error || 'Failed to revoke session' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ---- Role helpers ----

export interface RoleInfo {
  id: string;
  role: string;
  grantedBy: string;
  grantedAt: string;
}

export async function getMyRoles(): Promise<{ success: boolean; roles?: RoleInfo[]; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/admin/roles/me`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, roles: data.roles || [] };
    }
    return { success: false, error: data.error || 'Failed to load roles' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}