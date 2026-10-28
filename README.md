# ClearContract: Repository Review and Semester Finish Plan

Repository reviewed: https://github.com/XDecoder12/ClearContract  
Default branch: `main`  
Review date: 25 October 2026  
Latest observed commit: `ae2f8740ee8324e3491e6b5fbf48b5b65225191b` (`feat: connect admin dashboard scan activity to live API`)

## Executive status

The repository contains three applications: `backend/`, `extension/` and `dashboard/`. The main backend, extension history flow and live admin dashboard are implemented. The project is currently a functional local-development prototype, not yet a verified production deployment.

## Confirmed in repository

### Backend
- Express API separated into `app.js` and `server.js`.
- MongoDB/Mongoose models for users and scan results.
- Registration/login with bcryptjs and JWT.
- Protected Gemini analysis route that saves a scan on success.
- Text normalization, 200,000-character maximum, chunking/overlap and structured Gemini response validation.
- Retry attempts for selected transient Gemini statuses: 429, 500, 502, 503 and 504.
- User-specific scan history endpoint: `GET /api/scans`.
- Protected admin endpoints: `/api/admin/me`, `/stats`, `/users` and `/scans`.
- API rate limit: 20 calls to `/api/ai/analyze` per 15-minute window.
- Helmet, CORS allow-list, required environment validation, health endpoint and graceful shutdown.
- Jest/Supertest/MongoDB Memory Server tests are present under `backend/tests/`.

### Chrome extension
- React/Vite Manifest V3 extension.
- Registration, login, scan/logout flow and persisted token via Chrome storage.
- Can read `document.body.innerText` from the active tab when the user triggers the action.
- Sends the resulting/pasted contract text to the backend and sends the current tab URL as `sourceUrl` where available.
- History view uses the authenticated `/api/scans` endpoint. The repository contains a teammate commit `feat(extension): add collapsible scan history cards` from 22 October 2026.
- `extension/public/manifest.json` host permissions currently include only `http://localhost:5001/*`.
- API URLs in extension code currently target `http://localhost:5001`.

### Admin dashboard
- React/Vite dashboard.
- JWT login and admin role verification against `/api/admin/me`.
- Live stats/risk categories, real user directory, and real scan activity.
- Dashboard API helper uses `VITE_API_BASE_URL` or defaults to `http://localhost:5001`.
- Latest changes are visible in main: admin login, live users and live scans were committed on 21 and 25 October 2026.

### Test/build evidence available from the current conversation
- Backend baseline previously reported: 58 tests across 12 suites passing. This is conversation evidence, not a fresh rerun of the latest clone.
- Dashboard ESLint and production build both passed after its live scan integration.
- Extension build/lint still should be run from the latest main branch for a full final check.

## Priority pending work

### P0: finish before declaring the semester project complete
1. **Run all checks on latest `main`.** Backend: `cd backend && npm ci && npm test`. Extension: `cd extension && npm ci && npm run lint && npm run build`. Dashboard: `cd dashboard && npm ci && npm run lint && npm run build`.
2. **End-to-end local smoke test.** Register a fresh user, login, analyze pasted text, analyze a webpage with a URL, confirm the scan is stored once, view history, login as admin and verify stats/users/scans, then test invalid credentials, normal-user access to admin routes, overlong input and analysis rate limit.
3. **Inspect the dashboard's 304 caching behavior.** The live dashboard network screenshot showed `304 Not Modified` for some requests. The current dashboard API helper calls `response.json()` then rejects `!response.ok`; HTTP 304 responses have no body and are not `ok`. Confirm whether those responses occur on the API endpoints and adjust API caching or response handling if they can create false UI errors.
4. **Review AI safety requirements against the rubric.** Chunking and retry for selected Gemini errors are present. The prompt covers hidden fees, auto-renewal, cancellation barriers, misleading language and privacy concerns; verify the original requirement's explicit high-risk prioritization for fees, termination, auto-renewal and liability. Confirm that the intended failure response is sufficiently useful for Gemini failures.
5. **Finalize README and setup configuration.** The root `.env.example` currently includes `VITE_BACKEND_URL=http://localhost:5000`, which doesn't match the dashboard variable `VITE_API_BASE_URL` or backend default port 5001. Standardize or remove the stale root variable. Keep `backend/.env.example` as the backend template.
6. **Review stored contract privacy.** `ScanResult` stores `originalText`; admin listing APIs select safe metadata and omit it, but data retention, user disclosure and privacy policy should be decided before external release.

### P1: required if you're deploying/demoing outside the local machine
7. Deploy backend to a provider and confirm `GET /health` reports both API and database healthy.
8. Update both hardcoded extension API URL uses (authentication/history and analysis) to the production HTTPS API; update Manifest V3 `host_permissions` accordingly and rebuild/load-test the extension.
9. Set `VITE_API_BASE_URL` at dashboard build time, configure production `CORS_ALLOWED_ORIGINS`, and deploy the dashboard to a static host.
10. Check MongoDB Atlas cluster state, database user credentials, Network Access allow-list and environment values in the hosting platform.
11. Promote the actual production administrator account only after registration, and verify a regular user cannot read admin endpoints.
12. Run the same smoke tests against the production service and document the deployment URL only if it is deployed and available.

### P2: scope-dependent polish
13. Investigate scan records with missing/empty `sourceUrl`. This may be expected for manually pasted text, but it is worth confirming the active-tab flow always submits a URL when one is available.
14. Decide if scan search should be server-side. Current dashboard scan search filters only the page already loaded; the backend scans endpoint doesn't accept `q`.
15. Complete SRS/report, UML and architecture diagrams, screenshots, privacy policy and Chrome Web Store assets if those are required by the course/submission plan.

## Is a separate `POST /api/scans` needed?

Not for the current implementation. `POST /api/ai/analyze` already saves the analysis result as a `ScanResult` document and returns a `scanId`. `GET /api/scans` then reads the authenticated user's saved scans. Adding another save endpoint could duplicate persistence unless the architecture is intentionally changed.

## Repository configuration issues found

- Root `.env.example` has `PORT=5001` but also `VITE_BACKEND_URL=http://localhost:5000`; the dashboard actually reads `VITE_API_BASE_URL` and defaults to port 5001.
- Extension API URLs are hardcoded to `http://localhost:5001`, and the manifest's `host_permissions` only includes the local API. This is expected for local development but blocks a production-ready extension until changed.
- The `dashboard/README.md` still contains the generic React + Vite template text. The root README should be the main setup guide; optionally replace the component-level template README with a short pointer to the root README.
- The root README that existed at review time described the project as early prototype and said the dashboard and advanced browser analysis were still under development. That status is stale because the admin dashboard now exists and uses live backend endpoints.
- `originalText` is stored with each successful scan. The admin listing route intentionally does not return it; privacy/retention language still needs a decision.

## Practical finish sequence

1. Apply the updated root README draft.
2. Fix the stale root `.env.example` variable/port mismatch.
3. Run backend tests, extension lint/build and dashboard lint/build.
4. Complete local end-to-end smoke testing.
5. Decide deployment scope. If the semester demonstration is local-only, document that honestly. If an online demo is required, deploy and test production URLs/allowed origins.
6. Finish report/diagram/privacy deliverables required by the course.
7. Make the final documentation/config commit and verify `git status --short` is empty.
