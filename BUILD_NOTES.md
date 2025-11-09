# BuildLight - Build Notes

## Important: Prisma Client Generation Required

Before running the application or building for production, you **must** generate the Prisma client:

```bash
npx prisma generate
```

Then run migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

## Development Workflow

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Run migrations**
   ```bash
   npx prisma migrate dev
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Production Build

For production deployment (e.g., on Vercel):

1. Prisma client generation is automatically handled during build
2. Make sure all environment variables are set in Vercel dashboard
3. Database migrations should be run manually or via CI/CD:
   ```bash
   npx prisma migrate deploy
   ```

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
