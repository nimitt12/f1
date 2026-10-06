import type { AuthUser } from '../components/Hero';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const TOKEN_KEY = 'f1_token';

// Tab-scoped storage remains readable by JavaScript. HttpOnly sessions need backend support.
export const getToken = (): string | null => {
  localStorage.removeItem(TOKEN_KEY);
  return sessionStorage.getItem(TOKEN_KEY);
};

export const clearSession = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('f1_user');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('f1_user');
  window.dispatchEvent(new Event('pitwall:signout'));
};

export const authFetch = async (input: string, init: RequestInit = {}): Promise<Response> => {
  const url = new URL(input);
  const backend = new URL(BACKEND_URL);
  if (url.origin !== backend.origin || url.username || url.password ||
      (import.meta.env.PROD && url.protocol !== 'https:')) {
    throw new Error('Refusing to send credentials to an untrusted API');
  }
  const token = getToken();
  if (!token) throw new Error('Please sign in again to continue.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const timeout = AbortSignal.timeout(20_000);
  const response = await fetch(url.href, {
    ...init, headers, cache: 'no-store', redirect: 'error', credentials: 'omit',
    signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
  });
  if (response.status === 401 && getToken() === token) clearSession();
  return response;
};

export const signInWithGoogle = async (idToken: string): Promise<AuthUser> => {
  const url = new URL(`${BACKEND_URL}/auth/google`);
  if (import.meta.env.PROD && url.protocol !== 'https:') throw new Error('Authentication requires HTTPS');
  const response = await fetch(url.href, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }), cache: 'no-store', redirect: 'error',
    credentials: 'omit', signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error('Backend authentication failed');
  const data = await response.json();
  if (typeof data.token !== 'string' || !data.token || !data.user?.id ||
      typeof data.user.email !== 'string') throw new Error('Invalid authentication response');
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.setItem(TOKEN_KEY, data.token);
  return {
    id: String(data.user.id), email: data.user.email,
    name: String(data.user.name || data.user.full_name || 'User'),
    picture: String(data.user.picture || data.user.avatar_url || data.user.picture_url || ''),
    is_admin: data.user.is_admin === true,
  };
};
