# Changelog

## [Unreleased]

### Removed
- `replit.md` — Replit-specific documentation, no longer relevant
- `static-build/` — pre-built Expo bundles with Replit domain URLs baked in; must be rebuilt against new host

### Changed
- **CORS config** (`server/index.ts`): replaced `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS` env vars with a single `ALLOWED_ORIGINS` env var (comma-separated list of allowed origins)
- **Gemini env var** (`server/routes.ts`): renamed `AI_INTEGRATIONS_GEMINI_API_KEY` → `GEMINI_API_KEY`
- **Gemini client** (`server/routes.ts`): removed Replit AI proxy `baseUrl` / `httpOptions` block — now connects directly to Google's Gemini API
- **README.md**: rewrote with setup instructions, prerequisites checklist, env var table, scripts reference, and project structure

### Added
- `.env.example` — documents all required and optional environment variables with instructions for where to obtain each value

---

## Previous

### Fixed (Bug fixes from code review — 16 issues)
- Hardcoded Gemini model version → runtime override via `GEMINI_MODEL` env var
- AI JSON responses not validated before mapping → `.isArray()` guard before map
- No image size validation (DoS risk) → reject base64 payloads > 6.8 MB
- No timeout on external API calls → 30 s timeout wrapper on all Gemini calls
- Inconsistent error response format → standardised all responses to `{ error: string }`
- `console.log` without `NODE_ENV` guard → debug logs suppressed in production
- `req.userId` used without local guard → defence-in-depth check in each route
- Hardcoded recipe limit with no pagination → `?limit` / `?page` query params (max 50)
- `any` types in Supabase mapping functions → typed row interfaces
- `AsyncStorage` calls without try/catch → all wrapped in try/catch
- No user feedback on Supabase mutation failures → centralised `notifyMutationError()` alert
- OAuth token null check missing → both `accessToken` and `refreshToken` checked before `setSession`
- `CookingTimer` `setInterval` race condition → proper `useEffect` cleanup
- Demo data button visible in production → wrapped with `__DEV__` conditional
- Demo data loaded on scan failure → removed fallback to demo data on error
- Missing 401 retry and token guard in query client → token refresh retry on 401
