# Upstash Redis Setup Guide for BuildLight

This guide will help you set up Upstash Redis for rate limiting in BuildLight.

## Why Upstash Redis?

- ✅ **Serverless-friendly** - Works with Vercel Edge Functions
- ✅ **REST API** - No TCP connections needed
- ✅ **Free tier** - 10,000 commands/day (good for ~500 DAU)
- ✅ **Global** - Low latency worldwide
- ✅ **Pay-per-use** - Only pay for what you use ($0.20 per 100K commands)

---

## Step 1: Create Upstash Account

1. Go to [console.upstash.com](https://console.upstash.com)
2. Click **"Sign Up"** or **"Sign In"** if you already have an account
3. Choose sign-in method:
   - GitHub (recommended)
   - Google
   - Email

---

## Step 2: Create Redis Database

1. After signing in, click **"Create Database"** button
2. Configure your database:

   **Database Name:**
   ```
   buildlight-rate-limiting
   ```

   **Type:**
   - Select **"Regional"** (not Global)
   - Regional is faster and cheaper for single-region deployments

   **Region:**
   - Choose closest to your Vercel deployment
   - Recommended: `us-east-1` (Virginia) for US deployments
   - Or: `eu-west-1` (Ireland) for EU deployments

   **Eviction:**
   - Leave as default (allkeys-lru)

3. Click **"Create"** button

---

## Step 3: Copy Credentials

After creating the database, you'll see the dashboard. Copy these values:

### REST URL
Located under **"REST API"** section:
```
https://[your-database-name].upstash.io
```

**Example:**
```
https://optimal-mongrel-28808.upstash.io
```

### REST Token
Located under **"REST API"** section, click **"Copy"** button next to **"UPSTASH_REDIS_REST_TOKEN"**

**Example:**
```
AXCIAAIncDI5NWU3YTdlNjAyZjI0OTk1ODA0MTBiZmQ2YWJjYmUzZHAyMjg4MDg
```

**⚠️ IMPORTANT:** Keep this token secret! Never commit it to version control.

---

## Step 4: Add to Environment Variables

### Local Development (.env.local)

Add these lines to your `.env.local` file:

```bash
# ===================================
# UPSTASH REDIS (RATE LIMITING)
# ===================================
UPSTASH_REDIS_REST_URL=https://optimal-mongrel-28808.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXCIAAIncDI5NWU3YTdlNjAyZjI0OTk1ODA0MTBiZmQ2YWJjYmUzZHAyMjg4MDg
```

Replace with your actual values from Step 3.

### Production (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Select your BuildLight project
3. Go to **Settings** → **Environment Variables**
4. Add two variables:

   **Variable 1:**
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** `https://your-database-name.upstash.io`
   - **Environment:** Production, Preview, Development

   **Variable 2:**
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** Your token from Step 3
   - **Environment:** Production, Preview, Development

5. Click **"Save"**
6. Redeploy your application

---

## Step 5: Verify Setup

### Option A: Run Test Script

```bash
node test-rate-limit.js
```

Expected output:
```
🧪 Testing Upstash Redis Rate Limiting...

1️⃣  Testing Redis connection...
✅ Redis connection successful: PONG

2️⃣  Testing rate limiting...
   Making 6 requests (limit is 5 per 10 seconds)...

   Request 1: ✅ ALLOWED
      - Limit: 5 requests
      - Remaining: 4
      - Reset in: 10s

   ...

   Request 6: ❌ BLOCKED
      - Limit: 5 requests
      - Remaining: 0
      - Reset in: 8s

✅ Rate limiting working correctly!

3️⃣  Testing all rate limit levels...
   STRICT: 5 req/10 s - ✅ Working (4 remaining)
   STANDARD: 20 req/10 s - ✅ Working (19 remaining)
   GENEROUS: 100 req/10 s - ✅ Working (99 remaining)
   UPLOAD: 10 req/60 s - ✅ Working (9 remaining)

✅ All rate limit levels configured correctly!

🎉 All tests passed! Rate limiting is ready for production.
```

### Option B: Check Upstash Dashboard

1. Go to [console.upstash.com](https://console.upstash.com)
2. Click on your database
3. Go to **"Data Browser"** tab
4. You should see keys like:
   ```
   @buildlight/ratelimit/strict:user_123
   @buildlight/ratelimit/standard:user_456
   ```

5. Go to **"Metrics"** tab
6. You should see:
   - **Commands** - Total requests
   - **Hits** - Successful lookups
   - **Bandwidth** - Data transferred

---

## Step 6: Understanding Costs

### Free Tier (Included)
- **10,000 commands per day**
- **256 MB storage**
- **Good for:** ~500 daily active users
- **No credit card required**

### Pay-Per-Use (After Free Tier)
- **$0.20 per 100,000 commands**
- **$0.25 per GB storage**

### Example Costs:

**Small App (1,000 DAU):**
- ~100,000 requests/day
- Cost: **$0.20/day** = **$6/month**

**Medium App (10,000 DAU):**
- ~1,000,000 requests/day
- Cost: **$2/day** = **$60/month**

**Large App (100,000 DAU):**
- ~10,000,000 requests/day
- Cost: **$20/day** = **$600/month**

---

## Troubleshooting

### Error: "fetch failed"

**Cause:** Invalid credentials or network issue

**Fix:**
1. Verify your `UPSTASH_REDIS_REST_URL` is correct
2. Verify your `UPSTASH_REDIS_REST_TOKEN` is correct (no spaces)
3. Check if you can access Upstash dashboard
4. Try regenerating the token in Upstash dashboard

### Error: "Access denied"

**Cause:** Invalid or expired token

**Fix:**
1. Go to Upstash dashboard
2. Click on your database
3. Go to **"REST API"** section
4. Click **"Regenerate Token"**
5. Copy new token and update `.env.local`

### Rate Limiting Not Working in Development

**Cause:** Environment variables not loaded

**Fix:**
1. Verify `.env.local` exists in project root
2. Restart your development server: `npm run dev`
3. Check console for warnings like:
   ```
   ⚠️ Rate limiting is disabled - Redis not configured!
   ```

### Rate Limiting Not Working in Production

**Cause:** Environment variables not set in Vercel

**Fix:**
1. Go to Vercel project settings
2. Check **Environment Variables** section
3. Verify both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
4. Redeploy your application

---

## Security Best Practices

### ✅ DO:
- Store credentials in environment variables
- Use different databases for development/production
- Rotate tokens regularly (every 90 days)
- Monitor usage in Upstash dashboard
- Set up billing alerts

### ❌ DON'T:
- Commit `.env.local` to Git
- Share tokens publicly
- Use same database for all environments
- Ignore unusual usage patterns

---

## Monitoring & Analytics

### Upstash Dashboard Metrics

1. Go to [console.upstash.com](https://console.upstash.com)
2. Click on your database
3. View metrics:

   **Commands:**
   - Total API calls to Redis
   - Useful for: Billing estimates

   **Daily Request Count:**
   - Rate limit checks per day
   - Useful for: Usage patterns

   **Data Size:**
   - Storage used by rate limit keys
   - Useful for: Cost optimization

   **Latency:**
   - Average response time
   - Useful for: Performance monitoring

### Sentry Integration

BuildLight automatically logs rate limit events to Sentry:

- **Rate Limit Exceeded** (Warning level)
  - Includes: User ID, endpoint, timestamp
  - Useful for: Detecting abuse patterns

- **Rate Limiting Service Error** (Error level)
  - Includes: Error details, context
  - Useful for: Uptime monitoring

---

## Next Steps

✅ **Setup Complete!** Your rate limiting is now active.

**Recommended:**
1. Test locally with `node test-rate-limit.js`
2. Deploy to Vercel with environment variables
3. Monitor usage in Upstash dashboard for 1 week
4. Adjust rate limits if needed (see `lib/rate-limit.ts`)
5. Set up billing alerts in Upstash

---

## Additional Resources

- [Upstash Documentation](https://docs.upstash.com/redis)
- [Upstash Pricing](https://upstash.com/pricing)
- [Rate Limiting Best Practices](https://upstash.com/blog/rate-limiting)
- [BuildLight Rate Limiting Documentation](./RATE_LIMITING.md)

---

## Support

**Upstash Issues:**
- Dashboard: [console.upstash.com](https://console.upstash.com)
- Discord: [Upstash Discord](https://upstash.com/discord)
- Email: support@upstash.com

**BuildLight Issues:**
- Check `RATE_LIMITING.md` for implementation details
- Check Sentry logs for error messages
- Review Upstash dashboard for usage patterns
