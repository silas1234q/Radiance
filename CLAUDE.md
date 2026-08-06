# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Radiance is a full-stack AI-driven skincare app. Users complete a skin quiz, receive a personalized skin analysis (score, metrics, face map), optionally do a face scan for photo-based analysis, get AM/PM routines, track progress, and log moods.

## Tech Stack

- **Backend:** Express 5 + TypeScript + Prisma 7 (PostgreSQL via PrismaPg adapter) + Clerk auth + Cloudinary uploads
- **Frontend:** Expo 54 + React Native + Expo Router 6 + NativeWind/Tailwind + TanStack React Query 4 + Clerk

## Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_WEBHOOK_SECRET` — Svix webhook verification secret
- `OPENAI_API_KEY` — OpenAI API key (optional; falls back to rule-based analysis)
- `OPENAI_MODEL` — model name (default: `gpt-4o-mini`)
- `OPENAI_TEMPERATURE` — temperature (default: `0.3`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary credentials for photo uploads
- `PORT` — server port (default: `5000`)

### Frontend (`frontend/.env`)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `EXPO_PUBLIC_API_BASE_URL` — backend URL (e.g. `http://localhost:5000`)

## Commands

### Backend
```bash
cd backend
npm run dev          # Start dev server (ts-node-dev)
npm run build        # TypeScript compile
npm run db:migrate   # Prisma migrate dev
npm run db:seed      # Seed sample products
npm run db:studio    # Prisma Studio
```

### Frontend
```bash
cd frontend
npm start            # Expo dev server
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run lint         # ESLint
```

There are no tests in this project yet — no test runner, no test files.

### After changing Prisma schema
```bash
cd backend
npm run db:migrate   # Creates migration + regenerates client
```
The generated client lives at `backend/generated/prisma/` (not the default location). All backend code imports from `../../generated/prisma/client`. Prisma 7 config (schema path, DATABASE_URL) is in `backend/prisma.config.ts`.

**Migration drift:** If `db:migrate` fails due to drift between the schema and existing migrations, use `npx prisma db push` instead to sync the database directly.

## Architecture

### Backend Request Flow
`app.ts` sets up middleware in this order:
1. CORS + Morgan logging
2. **Webhook routes** (`/api/webhooks`) — mounted BEFORE `express.json()` because Svix verification needs the raw body
3. `express.json()` body parser
4. `clerkAuth` middleware (runs on all routes, populates auth context)
5. API routes — all feature routers are aggregated in `src/routes/routes.ts` and mounted at `/api`; individual routers apply `requireAuth()` + `syncUser` as needed
6. `globalErrorHandler` (catches `AppError` subclasses and unhandled errors)

Route prefixes: `/auth`, `/users`, `/quiz`, `/skin-profile`, `/routines`, `/skin-logs`, `/skin-scores`, `/moods`, `/products`, `/upload`, `/gamification`, `/user-products`, `/scan-credits`. Health check at `/api/health` (no auth).

### Auth Pattern
- **Backend:** `clerkMiddleware()` runs globally. Protected routes chain `requireAuth()` → `syncUser`. `syncUser` upserts the Clerk user into the DB and sets `req.user` (the DB User, not the Clerk user).
- **Frontend:** Provider nesting in `_layout.tsx`: `ClerkProvider` → `RevenueCatProvider` → `QueryClientProvider` → `NotificationsProvider` → `Slot`. An `AuthRouter` component there does all auth-based navigation: signed out → `/auth` (single screen, no route group); signed in → checks whether a skin profile exists and routes to `(tabs)` or `(onboarding)/quiz`. It also guards `(tabs)` access by re-verifying the profile.
- `useApi()` hook provides `fetch()` that auto-attaches Bearer tokens (with retry). All API calls go through `src/api/apiClient.ts` which prepends `EXPO_PUBLIC_API_BASE_URL/api`.
- **Account deletion:** `DELETE /api/users/me` (`deleteMe`, hook `useDeleteAccount`) deletes the DB user inside a transaction — most relations cascade from `User`, but `RoutineInsightCache` is keyed by `userId` without an FK so it's deleted explicitly — then best-effort deletes the Clerk account (`clerkClient.users.deleteUser`).

### AI Integration
- `openAIService.ts` — GPT-4o with Zod-validated structured outputs for skin analysis and routine generation
- `skinAnalysisService.ts` and `routineService.ts` — AI-first with rule-based fallback if OpenAI fails
- `openBeautyFactsService.ts` — Product search with DB caching and rate limiting
- `productAnalysisService.ts` — AI-powered product-skin fit scoring (fitScore, pros/cons, ingredient flags)
- `routineInsightService.ts` — cached routine insights (per-user `RoutineInsightCache`)
- `weeklyPlanService.ts` — weekly skincare plan generation
- `revenueCatService.ts` — server-side subscription validation
- `youCamService.ts` — interface + 501 stubs (deferred)
- Skin analysis has two entry points: `POST /skin-profile/analyze` (quiz answers only) and `POST /skin-profile/analyze-with-scan` (quiz + face-scan photo)

### Gamification
`gamificationService.ts` tracks per-user XP and AM/PM streaks (`UserGamification`, `DailyCompletion`, `XpEvent` models). Completing a routine step or logging mood emits an `XpEvent` and updates `DailyCompletion`; streak breaks can be undone via a limited number of `streakRestoresLeft`. Exposed through `/api/gamification` (summary, streak restore, weekly completions, XP history).

### Product Shelf
`UserProduct` links a `User` to a `Product` with a `source` of `"recommended" | "scanned" | "added"` — this backs the frontend's "My Shelf" screen (`my-shelf.tsx`). `ProductAnalysis` (per user/product `fitScore`, pros/cons, ingredient flags) is generated by `productAnalysisService.ts` and surfaced on `product-detail.tsx`.

### Photo Upload Flow
`POST /api/upload/skin-photo`: multer writes to `backend/uploads/` → `uploadService.ts` uploads to Cloudinary (`radiance/skin-scans` folder) and deletes the temp file → returns `{ url }`. Cloudinary client configured in `src/config/cloudinary.config.ts`.

### Subscriptions (RevenueCat)
`RevenueCatProvider` wraps the app (inside `ClerkProvider`, outside `QueryClientProvider`). It configures `react-native-purchases` with the Clerk user ID as the app user ID, exposes `presentPaywall()` (via `react-native-purchases-ui`), and tracks entitlement status. The `SubscribeGate` component on the results screen calls `presentPaywall()` to gate the full skin analysis behind a subscription. Error codes from the SDK are mapped to user-friendly messages — never surface raw SDK errors.

### Push Notifications
- **Frontend (local):** `NotificationsProvider` installs the notification handler, hydrates persisted settings, and reconciles locally-scheduled reminders (routine reminders, streak nudges) whenever routines/gamification data or app foreground state change. Settings persistence and scheduling logic live in `src/lib/notifications/` (modular: `settings.ts`, `scheduler.ts`, `handler.ts`, `store.ts`, `permissions.ts`, `push.ts`, `native.ts`). Phase 2 registers the Expo push token with the backend via `useRegisterPushToken`.
- **Backend (server push):** `src/jobs/index.ts` runs `node-cron` scheduled tasks — weekly summary (hourly cron, fires at 18:00 local Sunday) and win-back (daily, for users inactive ≥ 3 days). Uses each user's stored IANA `timezone` and `luxon` for local-time checks. Push delivery via `expo-server-sdk` in `src/services/notificationService.ts`.

### Query Persistence
React Query is configured with `@tanstack/query-async-storage-persister` + `@tanstack/react-query-persist-client` to persist the query cache to AsyncStorage for offline support.

### Onboarding Flow (frontend)
`quiz → analyzing → results`. `analyzing.tsx` runs the real quiz-only analysis (`useAnalyzeSkin`) once, then routes to `results` (or `results?error=1` on failure). From results the user can optionally launch face-scan.

**Face-scan is capture + on-device validate only — it does NOT upload or analyze.** The real analysis is deferred behind a paywall on the results screen (see below):

- `face-scan.tsx` — **preview + validate-on-capture** (not live per-frame tracking). Renders an `expo-camera` `CameraView` (front-facing) with a static face-guide overlay and a capture button. Phase state machine: `preview → capturing → validating`. On capture it calls `takePictureAsync`, runs the photo through MLKit, and on success routes to `scan-processing?uri=<fileUri>`; any validation failure surfaces a friendly reason and returns to `preview`. "Skip"/permission-denied routes to `results?locked=1`. Optional front-camera "screen flash" (no hardware flash on the front camera) briefly maxes screen brightness + a white overlay before the shutter.
- Face detection uses `@infinitered/react-native-mlkit-face-detection` (v5, a **still-image** detector — it runs on a captured file URI, not a camera frame stream). The screen is wrapped in `FaceDetectionProvider` (options: `performanceMode: 'accurate'`, `landmarkMode` + `classificationMode` on, `contourMode` off) and gets the detector via `useFaceDetection()`, calling `detector.detectFaces(uri)`. It's a native Expo module, so it requires a dev build (not Expo Go); no config plugin needed.
- `src/lib/faceValidation.ts` — pure `validateFaceScan(result, imgW, imgH)` returning the first failing reason. Checks: exactly one face, face size ratio (not too far/close), centering, head pose via `headEulerAngleX/Y/Z`, and eyes-open probabilities. Any pose/eye check is skipped when the detector didn't report that field (`has…` flag false); non-finite native values are rejected defensively.
- `scan-processing.tsx` (+ `components/face-scan/ScanProcessing.tsx`) — **purely theatrical.** Shows the captured photo in an "analyzing" UI for a fixed ~5.5s timer, then routes to `results?locked=1&uri=<fileUri>`. No upload or analysis happens here.
- **Locked results + paywall.** `results.tsx` reads `locked=1` → renders `LockedResults` (blurred placeholder content) with the `components/results/SubscribeGate.tsx` bottom-sheet paywall. The real analysis runs only in `handleSubscribe` (the "Start free trial" CTA is simulated): if a captured photo `uri` is present it uploads via `uploadSkinPhoto` (`api/uploadPhoto.ts`) then `useAnalyzeSkinWithScan(url)`; otherwise `useAnalyzeSkin()` (quiz-only). On success it flips `unlocked` and reveals the full results in place. So `analyze-with-scan` fires on unlock, not during the scan flow.
- The camera screen defers mounting `CameraView` until `InteractionManager.runAfterInteractions` fires after the push transition settles — doing it earlier races UIKit's transition coordinator and can crash with SIGABRT.
- iOS camera usage requires `NSCameraUsageDescription` in `app.json` (`ios.infoPlist`); Android needs `android.permission.CAMERA` (both already set).

### Frontend Data Flow
- React Query hooks in `src/hooks/queries/` (useProfile, useRoutines, useSkinScores, useQuiz, etc.)
- Each hook uses `useApi().fetch` for authenticated requests
- Navigation: Expo Router file-based routing — `(onboarding)/` (quiz flow), `(tabs)/` (main app with index/routine/progress/profile/scan tabs), `(screens)/` (all non-tab screens: `auth`, `skin-log-modal`, `skin-comparison-modal`, `routine-steps`, `edit-skin-profile`, `edit-skin-field`, `skin-goal`, `skin-summary`, `routine-insight`, `routine-preferences`, `add-steps`, `product-detail`, `product-search`, `edit-routine`, `new-routine`, `my-routine`, `my-shelf`, `app-settings`, `contact-us`, `faq`, `critical-error`)

### Error Handling
Controllers use `catchAsync` wrapper. Errors extend `AppError` with `statusCode`, `type`, and `isOperational` fields. `globalErrorHandler` formats the response. Frontend expects `{ success: false, type, message }` shape on errors.

### Adding a New Backend Feature
Follow the existing pattern: create controller in `src/controllers/`, route file in `src/routes/`, then register in `src/routes/routes.ts`. Protected routes use `requireAuth()` + `syncUser` middleware chain. Controllers access the DB user via `req.user` (typed in `src/types/express.d.ts`). Wrap async handlers with `catchAsync` and throw `AppError` subclasses for error responses.

## Key Conventions

- Primary accent color: `#F06680`; fonts are Poppins (via `@expo-google-fonts/poppins`); shared theme constants in `frontend/src/constants/theme.ts`
- Backend tsconfig: `rootDir: "."`, `outDir: "./dist"`, target ES2020, CommonJS modules
- Frontend tsconfig: `@/*` path alias maps to the `frontend/` root (e.g. `@/src/hooks/...`)
- Prisma schema at `backend/prisma/schema.prisma`, client generated to `backend/generated/prisma/`
- Backend controllers live in `src/controllers/`
- Frontend uses NativeWind (Tailwind CSS for React Native) + `react-native-gifted-charts` and `react-native-svg` for charts + `react-native-reanimated` for animations
- Expo Router typed routes are auto-generated on dev server start

## Expo Note

Expo 54 has significant API changes. Reference the versioned docs at https://docs.expo.dev/versions/v54.0.0/ when writing frontend code (also stated in `frontend/AGENTS.md`).
