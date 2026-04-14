/**
 * Supabase Edge Function: send-reminders
 *
 * Sends daily habit reminder emails to users who have reminders enabled.
 *
 * DEPLOYMENT:
 *   1. supabase functions deploy send-reminders
 *   2. Set secret: supabase secrets set RESEND_API_KEY=re_...
 *   3. Schedule via pg_cron (run once per hour, function checks user reminder_time):
 *
 *      select cron.schedule(
 *        'habit-reminders',
 *        '0 * * * *',
 *        $$
 *          select net.http_post(
 *            url := '<YOUR_SUPABASE_PROJECT_URL>/functions/v1/send-reminders',
 *            headers := '{"Authorization": "Bearer <YOUR_ANON_KEY>"}'::jsonb
 *          );
 *        $$
 *      );
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (_req) => {
  if (!RESEND_API_KEY) {
    return new Response('RESEND_API_KEY not set', { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get current UTC hour
  const nowUtc = new Date();
  const utcHour = nowUtc.getUTCHours();
  const utcMinute = nowUtc.getUTCMinutes();
  const currentTime = `${String(utcHour).padStart(2,'0')}:${String(utcMinute).padStart(2,'0')}`;

  // Find users whose reminder_time (stored in their local timezone) matches now
  // Simplified: query profiles where reminders_enabled = true
  // and the current UTC time converted to their timezone matches reminder_time
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('auth_email, reminder_email, reminder_time, timezone, reminders_enabled')
    .eq('reminders_enabled', true);

  if (error) {
    console.error('Failed to fetch profiles:', error);
    return new Response('DB error', { status: 500 });
  }

  const sent: string[] = [];

  for (const profile of profiles ?? []) {
    const email = profile.reminder_email || profile.auth_email;
    if (!email) continue;

    // Check if current time in user's timezone matches their reminder_time
    try {
      const userNow = new Intl.DateTimeFormat('en-GB', {
        timeZone: profile.timezone || 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(nowUtc);

      if (userNow !== profile.reminder_time) continue;
    } catch {
      continue;
    }

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Habit Tracker <reminders@yourdomain.com>',
        to: [email],
        subject: "🌱 Don't forget your habits today",
        html: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#4a2030;font-weight:normal">Your daily check-in is waiting 🌹</h2>
            <p style="color:#6b4858;line-height:1.7">
              Keep your streak alive — open your habit tracker and check in for today.
            </p>
            <a href="${SUPABASE_URL.replace('.supabase.co','').replace('https://','https://') || 'https://your-app.vercel.app'}"
               style="display:inline-block;background:#e879a0;color:#fff;padding:12px 24px;border-radius:9px;text-decoration:none;font-family:sans-serif;font-weight:700;margin-top:8px">
              Open Habit Tracker
            </a>
            <p style="color:#bbb;font-size:11px;font-family:sans-serif;margin-top:24px">
              To unsubscribe, disable reminders in your app Settings.
            </p>
          </div>
        `,
      }),
    });

    if (res.ok) sent.push(email);
    else console.error('Failed to send to', email, await res.text());
  }

  return new Response(JSON.stringify({ sent: sent.length, emails: sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
