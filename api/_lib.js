// Shared helpers for the Vercel functions in /api. Files starting with "_" are not routes.
import { createClient } from '@supabase/supabase-js';

const env = k => process.env[k] || '';

export function serviceClient() {
  const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const config = {
  notify: () => env('ORDER_NOTIFY_EMAIL') || 'eleenehovak@gmail.com',
  from: () => env('RESEND_FROM') || 'Awora <onboarding@resend.dev>',
  resendKey: () => env('RESEND_API_KEY'),
  site: () => (env('SITE_URL') || '').replace(/\/$/, '')
};

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim() || req.socket?.remoteAddress || '';
}

export async function sendEmail({ to, subject, html, replyTo }) {
  const key = config.resendKey();
  if (!key) { console.warn('[awora] RESEND_API_KEY not set, order email skipped'); return { skipped: true }; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: config.from(), to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) })
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Resend ${r.status}: ${JSON.stringify(body)}`);
  return body;
}
