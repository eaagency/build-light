# BuildLight Setup Guide

This guide will help you set up BuildLight from scratch with all integrations.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git
- Supabase account (free tier works)
- Clerk account (free tier works)
- Stripe account
- Google Cloud Console account (for Drive API)

## Environment Setup

The `.env.local` file has been created with your production credentials. Make sure it's in your `.gitignore` (it already is).

## Database Setup

### 1. Initialize Prisma

First, generate the Prisma client:

```bash
npx prisma generate
```

### 2. Create Database Migration

Run the initial migration to create your database schema:

```bash
npx prisma migrate dev --name init
```

This will create all tables, enums, and indexes in your Supabase PostgreSQL database.

### 3. View Database (Optional)

You can use Prisma Studio to view and edit your database:

```bash
npx prisma studio
```

This opens a browser interface at `http://localhost:5555`

## Clerk Setup

Your Clerk application should have:

### Organization Settings

1. Enable Organizations in Clerk Dashboard:
   - Go to: **Organization Settings** > **Enable organizations**

2. Configure Custom Roles:
   - Go to: **Organization Settings** > **Roles & Permissions**
   - Create these roles:
     - `owner` - Full access (default admin role)
     - `project_manager` - Can manage projects
     - `field_worker` - Can view and update projects
     - `subcontractor` - Limited access to assigned projects
     - `client` - Read-only access

### OAuth Providers

1. Enable Google OAuth:
   - Go to: **Authentication** > **Social connections** > **Google**
   - Add your Google OAuth credentials
   - Enable the following scopes:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/drive.file` (for Drive integration)

### Custom Pages

Already configured in your `.env.local`:
- Sign In URL: `/sign-in`
- Sign Up URL: `/sign-up`
- After Sign In: `/dashboard`
- After Sign Up: `/dashboard`

## Stripe Setup

### 1. Create Products

In your Stripe Dashboard, create two subscription products:

**Starter Plan**
- Name: BuildLight Starter
- Price: $49/month
- Price ID: Already set in `.env.local`

**Pro Plan**
- Name: BuildLight Pro
- Price: $99/month
- Price ID: Already set in `.env.local`

### 2. Configure Trial Period

For each product:
1. Go to product settings
2. Enable "Free trial"
3. Set trial period to **14 days**

### 3. Set Up Webhook

1. Go to **Developers** > **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to your `.env.local`

## Google Drive API Setup

### 1. Enable Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Drive API**:
   - Navigate to **APIs & Services** > **Library**
   - Search for "Google Drive API"
   - Click **Enable**

### 2. OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type
3. Fill in application details:
   - App name: BuildLight
   - Support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/drive.file`
5. Save and continue

### 3. OAuth Credentials

Your Google OAuth credentials are already configured in `.env.local`.
Make sure they match in both Google Cloud Console and Clerk.

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Deployment to Vercel

### 1. Push to GitHub

Your code is already committed. Push to GitHub:

```bash
git push origin claude/buildlight-initial-setup-011CUrkuSggkVEZU4Yophbar
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Import Project**
3. Select your GitHub repository
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Add Environment Variables

In Vercel dashboard, add all variables from `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
DATABASE_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_STARTER_PRICE_ID
STRIPE_PRO_PRICE_ID
NEXT_PUBLIC_APP_URL (set to your Vercel URL)
ANTHROPIC_API_KEY
```

### 4. Deploy

Click **Deploy** and wait for build to complete.

### 5. Update Stripe Webhook URL

After deployment, update your Stripe webhook URL to:
```
https://your-vercel-domain.vercel.app/api/webhooks/stripe
```

## Testing the Setup

### 1. Sign Up Flow

1. Go to your homepage
2. Click "Start Free Trial" on any pricing card
3. Sign up with email or Google
4. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
5. Verify you're redirected to dashboard

### 2. Organization Features

1. In dashboard, create an organization
2. Invite team members with different roles
3. Test role-based permissions

### 3. Project Creation

1. Click "Create First Project"
2. Fill in project details
3. Verify Google Drive folder is created (if OAuth is connected)

### 4. Subscription Management

1. Go to Settings
2. Click "Manage Subscription"
3. Verify billing portal opens

## Troubleshooting

### Prisma Connection Issues

If Prisma can't connect to Supabase:
1. Verify DATABASE_URL in `.env.local`
2. Check Supabase is using connection pooler URL (port 6543)
3. Ensure database is not paused

### Clerk Issues

If authentication fails:
1. Verify CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
2. Check custom pages are configured in Clerk dashboard
3. Ensure organization feature is enabled

### Stripe Issues

If checkout fails:
1. Verify STRIPE_SECRET_KEY and webhook secret
2. Check price IDs match your Stripe products
3. Test with Stripe test mode first

### Google Drive Issues

If Drive integration fails:
1. Verify Google Drive API is enabled
2. Check OAuth scopes include `drive.file`
3. Ensure user has connected Google account via Clerk

## Next Steps

After setup is complete:

1. **Customize branding**: Update colors, fonts, and logo
2. **Add features**: Build out project management features
3. **Set up monitoring**: Add error tracking (Sentry)
4. **Configure analytics**: Add analytics (PostHog, Mixpanel)
5. **Email notifications**: Set up transactional emails
6. **Mobile app**: Consider building with React Native

## Support

For issues or questions:
- Check documentation in `/README.md`
- Review code comments in `/lib/*`
- Contact: your-email@example.com
