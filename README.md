# BuildLight

**Construction Management That Gets Out of Your Way**

BuildLight is a modern construction management SaaS built for residential builders. Organize projects in 1 hour, not 100.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with Swiss Design System
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk.com (with organization support)
- **Deployment**: Vercel

## Design System

BuildLight uses a minimal Swiss design system with the following color palette:

- **Primary**: #121212 (Graphite Black)
- **Accent**: #6BF178 (BuildLight Green)
- **Background**: #FFFFFF (White)
- **Support**: #E5E5E5 (Concrete Gray)

## Features

- ✅ Authentication with Clerk (sign-in, sign-up, organizations)
- ✅ Role-based access control (OWNER, PROJECT_MANAGER, FIELD_WORKER, SUBCONTRACTOR, CLIENT)
- ✅ Light/Dark mode toggle
- ✅ Responsive design with mobile navigation
- ✅ Dashboard with empty state
- ✅ Pricing page (Starter $49/mo, Pro $99/mo)
- ✅ Protected routes with middleware

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Clerk account ([clerk.com](https://clerk.com))
- Stripe account for payments (optional)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/eaagency/build-light.git
cd build-light
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/buildlight"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

4. **Set up the database**

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
build-light/
├── app/
│   ├── dashboard/          # Protected dashboard routes
│   ├── sign-in/           # Custom Clerk sign-in page
│   ├── sign-up/           # Custom Clerk sign-up page
│   ├── layout.tsx         # Root layout with ClerkProvider
│   ├── page.tsx           # Homepage with hero and pricing
│   └── globals.css        # Global styles with design tokens
├── components/
│   ├── navigation.tsx     # Main navigation component
│   ├── theme-provider.tsx # Theme context provider
│   └── theme-toggle.tsx   # Light/dark mode toggle
├── lib/
│   └── prisma.ts          # Prisma client initialization
├── prisma/
│   └── schema.prisma      # Database schema
└── middleware.ts          # Clerk route protection
```

## Database Schema

- **User**: Stores user information (linked to Clerk)
- **Organization**: Represents construction companies
- **Project**: Construction projects with status tracking
- **Role**: Enum for user permissions (OWNER, PROJECT_MANAGER, etc.)

## Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev  # Create migration
npx prisma generate  # Generate Prisma Client

# Linting
npm run lint         # Run ESLint
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables on Vercel

Make sure to add all variables from `.env.example` to your Vercel project settings.

## Clerk Configuration

1. Create an application at [clerk.com](https://clerk.com)
2. Enable organizations in Clerk dashboard
3. Set up custom pages:
   - Sign In URL: `/sign-in`
   - Sign Up URL: `/sign-up`
   - After Sign In: `/dashboard`
   - After Sign Up: `/dashboard`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.
