# BuildLight - Build Notes

## ✅ Automatic Prisma Client Generation (Fixed!)

**Prisma client is now automatically generated** during:
- `npm install` (via postinstall script)
- `npm run build` (before Next.js build)
- Vercel deployments (automatic)

You generally **don't need to run** `npx prisma generate` manually anymore!

## Database Setup (First Time Only)

After cloning the repository, run migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

Or for production deployments:
```bash
npx prisma migrate deploy
```

## Development Workflow

1. **Install dependencies** (Prisma generates automatically)
   ```bash
   npm install
   ```

2. **Run database migrations** (first time only)
   ```bash
   npx prisma migrate dev
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Production Build

For production deployment on Vercel:

1. ✅ **Prisma client generation** - Automatic (handled by postinstall script)
2. ✅ **Environment variables** - Set in Vercel dashboard
3. ⚠️ **Database migrations** - Run manually before deployment:
   ```bash
   npx prisma migrate deploy
   ```

### Vercel Configuration

The project includes `vercel.json` with optimized settings:
- Build command runs Prisma generation before Next.js build
- API routes have 30-second timeout for database operations
- Configured for optimal performance

### Build Command
```bash
prisma generate && next build
```

This ensures Prisma client is always available during the Next.js build process.

## Troubleshooting

### Build fails with "@prisma/client" errors

This means the Prisma client hasn't been generated yet. Run:
```bash
npx prisma generate
```

### Database connection errors

1. Check your DATABASE_URL in `.env.local`
2. Ensure Supabase database is running and accessible
3. Verify you're using the connection pooler URL (port 6543)

### Type errors after schema changes

After modifying `prisma/schema.prisma`:
1. Run `npx prisma generate` to regenerate types
2. Run `npx prisma migrate dev` to apply schema changes
3. Rebuild the application: `npm run build`

## Key Files

- `prisma/schema.prisma` - Database schema
- `lib/prisma.ts` - Prisma client instance
- `lib/types.ts` - TypeScript type definitions matching Prisma schema
- `.env.local` - Local environment variables (DO NOT commit)
- `.env.example` - Environment variable template

## Next Steps

See SETUP.md for complete setup instructions including:
- Clerk configuration
- Stripe webhook setup
- Google Drive API setup
- Vercel deployment
