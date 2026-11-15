# Phone alerts: setup (about 10 minutes, one time)

## 1. Table
Supabase > SQL Editor > paste `push-setup.sql` > Run.

## 2. Function secrets
Install the Supabase CLI, then in your project folder:

```
supabase secrets set VAPID_PUBLIC_KEY="BHMtxIXk4lU8-AYxPojlrF568kSrfgBxxs4JwpOjRnljSB5V3FefVQfJfwQO9eADOKxICvVKMviteMiyzG4gBh0"
supabase secrets set VAPID_PRIVATE_KEY="Rf5Hn5eqiYJ3zhNa23omOxC5Q6Yt6_cHuB0iasaKQe0"
supabase secrets set VAPID_SUBJECT="mailto:binnfrancisco@gmail.com"
supabase secrets set WEBHOOK_SECRET="<make up a long random string>"
```

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
