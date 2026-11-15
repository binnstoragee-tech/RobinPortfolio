// Sends a push notification to every saved phone when a new inquiry row is inserted.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);
const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("unauthorized", { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || body.type !== "INSERT" || !body.record) return new Response("ignored");

  const q = body.record;
  const from = body.table === "adflare_inquiries" ? "AdFlare" : "Website";
  const payload = JSON.stringify({
    title: `New inquiry from ${String(q.name ?? "someone").slice(0, 60)}`,
    body: `${String(q.project ?? "").slice(0, 100)} · ${from}`,
    tag: "inquiry",
  });

  const { data: subs } = await db.from("push_subscriptions").select("endpoint,p256dh,auth");
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        { TTL: 86400, urgency: "high" },
      );
    } catch (e) {
      // phone unsubscribed / app removed: clean it up
      if (e.statusCode === 404 || e.statusCode === 410) {
        await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }));
  return new Response("ok");
});
