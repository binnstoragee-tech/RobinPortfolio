# Phone alerts: setup (about 10 minutes, one time)

## 1. Table
Supabase > SQL Editor > paste `push-setup.sql` > Run.

## 2. Function secrets
Generate your own VAPID keys (never commit real keys to this repo):

```
npx web-push generate-vapid-keys
```

Then set them as secrets (Supabase Dashboard > Edge Functions > Secrets, or the CLI):

```
supabase secrets set VAPID_PUBLIC_KEY="<your public key>"
supabase secrets set VAPID_PRIVATE_KEY="<your private key>"
supabase secrets set VAPID_SUBJECT="mailto:binnfrancisco@gmail.com"
supabase secrets set WEBHOOK_SECRET="<make up a long random string>"
```

Put the same **public** key in `supabase-config.js` (`pushKey`). The private key lives only in the Supabase secrets.

## 3. Deploy the function
Put `supabase/functions/notify-inquiry/index.ts` in your project, then:

```
supabase functions deploy notify-inquiry --no-verify-jwt
```

## 4. Database webhooks (two of them)
Supabase > Database > Webhooks > Create:
- Table `inquiries`, event **Insert**, type **HTTP Request**, method POST,
  URL `https://fejzgbyhcwlfhdezovmv.supabase.co/functions/v1/notify-inquiry`,
  header `x-webhook-secret` = the same string from step 2.
- Repeat for table `adflare_inquiries`.

## 5. Turn it on from your phone
1. Upload the new `sw.js`, `admin.html`, `supabase-config.js` and redeploy.
2. Open /admin on your phone and sign in.
3. **iPhone:** Share > Add to Home Screen first (needs iOS 16.4+), then open it from the home screen icon.
   **Android:** Chrome works directly.
4. Tap the bell, tap **Phone alerts**, then Allow.

Test: send an inquiry from the Collabs form with the app closed.
