import { supabase } from '../lib/supabaseClient';

// Wraps fetch() and attaches the current Supabase Auth session token as a Bearer token,
// so the Express server can verify the caller is a signed-in admin/shop_manager.
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  return fetch(input, { ...init, headers });
}

export async function adminFetchJson<T = any>(input: string, init: RequestInit = {}): Promise<T> {
  const res = await adminFetch(input, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
