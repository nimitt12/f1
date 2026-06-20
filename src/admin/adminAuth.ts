// Shared auth helpers for the admin portal.
// The session token is the JWT returned by the backend on login and stored in
// localStorage (`f1_token`). Admin endpoints are protected server-side, so every
// request to `/admin/*` must carry it as a Bearer token.

export const TOKEN_KEY = 'f1_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

/**
 * Drop-in replacement for `fetch` that attaches the admin Bearer token.
 * Use for any call to a protected `/admin/*` endpoint.
 */
export const authFetch = (input: string, init: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
};
