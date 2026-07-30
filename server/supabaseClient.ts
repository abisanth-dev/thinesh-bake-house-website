import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

// Loaded here too (not just in server.ts) because ES module imports are evaluated before any
// code in the importing module runs — server.ts's dotenv.config() would run too late otherwise.
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn(
    '[Supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Admin API calls will fail until configured in .env.'
  );
}

// Service-role client: full DB & Storage access, bypasses RLS. Server-side only, never expose to the browser.
export const supabaseAdmin = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SERVICE_ROLE_KEY || 'placeholder', {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface AdminRequest extends Request {
  adminUser?: { id: string; name: string; email: string; role: string };
}

// Resolves the caller's admin/shop_manager profile from a Supabase Auth bearer token, or null.
export async function getAdminProfile(req: Request): Promise<AdminRequest['adminUser'] | null> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) return null;

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', userData.user.id)
    .single();

  if (profileErr || !profile) return null;
  if (profile.role !== 'administrator' && profile.role !== 'shop_manager') return null;

  return profile as AdminRequest['adminUser'];
}

// Express middleware form of getAdminProfile — rejects the request if not an authenticated admin.
export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  try {
    const profile = await getAdminProfile(req);
    if (!profile) {
      return res.status(401).json({ error: 'Admin access required. Please sign in again.' });
    }
    req.adminUser = profile;
    next();
  } catch (err: any) {
    console.error('Admin auth check failed:', err);
    res.status(500).json({ error: 'Authentication check failed.' });
  }
}
