# NomUp

A mobile-first grocery management app that prevents food waste. Scan receipts, track expiration dates, discover matching recipes, and cook step-by-step — all powered by Gemini AI.

---

## Features

- **Receipt Scanning** — photograph a grocery receipt; Gemini extracts item names, quantities, prices, categories, storage locations, and predicted expiration dates automatically
- **Pantry Tracking** — items organised by Fridge / Freezer / Pantry with colour-coded expiration urgency (yellow → orange → red)
- **Expiration Alerts** — push notifications for items expiring within 5 days
- **Recipe Matching** — matches pantry contents against TheMealDB recipes with a % match score showing what you have vs. what you still need
- **Cooking Mode** — step-by-step instructions with built-in countdown timers; durations and temperatures extracted by Gemini
- **Saved Recipes** — store favourites with enhanced cooking steps
- **Shopping List** — add missing ingredients directly from a recipe
- **Consumption Logging** — 10-dot slider to track how much of an item you used

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native + Expo SDK 54 |
| Backend API | Express.js v5 (TypeScript) |
| Database | PostgreSQL via Supabase + Drizzle ORM |
| Auth | Supabase Auth (email/password + Google OAuth) |
| AI | Google Gemini 2.0 Flash |
| Recipe data | TheMealDB (free, no auth required) |
| State | React Context + TanStack React Query v5 |
| Local storage | AsyncStorage |
| Notifications | expo-notifications (mobile only) |

---

## Prerequisites — What You Need to Provide

Before running the app you need accounts and keys for the following services:

### 1. Supabase (database + auth)
- Create a project at [supabase.com](https://supabase.com)
- From **Settings → API** copy:
  - `SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` — your project URL
  - `SUPABASE_SERVICE_ROLE_KEY` — server-side admin key (keep secret)
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — public anon key (safe to expose)
- From **Settings → Database → Connection string** copy:
  - `DATABASE_URL` — PostgreSQL connection string

### 2. Google Gemini API key
- Get a key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Set as `GEMINI_API_KEY`
- Default model: `gemini-2.0-flash` — override with `GEMINI_MODEL` env var if needed

### 3. Your server domain
- `ALLOWED_ORIGINS` — comma-separated list of frontend origins the API should accept, e.g. `https://yourdomain.com`
- `EXPO_PUBLIC_DOMAIN` — domain where your Express server is hosted (no protocol, no trailing slash), e.g. `api.yourdomain.com`

### 4. Optional
- `EXPO_PUBLIC_POSTHOG_KEY` — PostHog analytics key; omit to disable analytics entirely

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in all values — see Prerequisites above

# 3. Run database migrations
npm run db:push

# 4. Start development
npm run server:dev     # Express API on port 5000
npm run expo:dev       # Expo / Metro bundler
```

---

## Environment Variables

See `.env.example` for the full annotated list. Summary:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase) |
| `SUPABASE_URL` | Yes | Supabase project URL (server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase admin key (server only) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `ALLOWED_ORIGINS` | Yes | Comma-separated allowed CORS origins |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (client) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (client) |
| `EXPO_PUBLIC_DOMAIN` | Yes | API server domain (client) |
| `GEMINI_MODEL` | No | Override Gemini model (default: `gemini-2.0-flash`) |
| `EXPO_PUBLIC_POSTHOG_KEY` | No | PostHog analytics key |
| `PORT` | No | Server port (default: `5000`) |
| `NODE_ENV` | No | `development` or `production` |

---

## Available Scripts

```bash
npm run expo:dev           # Start Expo dev server
npm run server:dev         # Start Express with hot reload
npm run db:push            # Run Drizzle migrations
npm run server:build       # Bundle server for production
npm run server:prod        # Run production server build
npm run lint               # ESLint
npm run lint:fix           # ESLint with auto-fix
npm run check:types        # TypeScript type check
npm run format             # Prettier format
```

---

## Project Structure

```
NomUp/
├── client/          # React Native + Expo app
│   ├── screens/     # Screen components
│   ├── components/  # Reusable UI components
│   ├── navigation/  # Stack and tab navigators
│   ├── context/     # AuthContext, AppContext (global state)
│   ├── lib/         # Supabase client, API request helpers
│   ├── services/    # Push notifications
│   └── constants/   # Theme (colors, spacing, typography)
├── server/          # Express.js API
│   ├── index.ts     # Server setup, CORS, static serving
│   ├── routes.ts    # All API endpoints
│   ├── db.ts        # Drizzle database connection
│   └── middleware/  # JWT auth middleware
├── shared/          # Shared types and DB schema
│   └── schema.ts    # Drizzle ORM table definitions
├── migrations/      # Auto-generated DB migrations
├── .env.example     # Environment variable template
└── app.json         # Expo app configuration
```
