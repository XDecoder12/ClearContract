# ClearContract

**ClearContract** is an AI-assisted contract and Terms of Service analyzer. It helps users review potentially concerning clauses using a Chrome extension, an Express API, MongoDB and Google's Gemini API. A separate administrator dashboard provides aggregate usage statistics and account and scan oversight.

The project is currently designed for **local development and demonstration**. The extension, authentication, history, PDF reporting and administrator APIs are implemented. A publicly hosted backend and Chrome Web Store release have **not** been established.

> **Important:** ClearContract provides preliminary, AI-generated information, **not legal advice**. Findings, risk ratings and quotations must be reviewed in context. An empty list of flagged risks does not prove that a contract is safe.

## Features

### Chrome extension

- Register, sign in and sign out using email and password.
- Paste contract text manually or use **Read Current Webpage** to extract readable text from the active tab.
- Analyze text using Gemini through the authenticated backend API.
- Review a short AI summary, an overall **LOW / MEDIUM / HIGH** risk level and individual flagged risks.
- For each flagged risk, view its category, severity, explanation and supporting quotation when provided.
- Browse the latest saved scans in expandable History cards, search by text, filter by whether risks were found and sort by scan date.
- Delete a saved scan after confirmation.
- Download PDF reports for both a fresh analysis and saved History records.
- Keep session tokens in Chrome extension storage and handle expired sessions.

### Analysis backend

- Express REST API and Mongoose models for users and scan results.
- JWT authentication and bcryptjs password hashing.
- Input validation, source URL checking and a **200,000-character** contract-text limit.
- Chunking with overlap for longer inputs and a synthesis step to combine findings.
- Gemini structured JSON output containing `overallRiskLevel`, `aiSummary` and `darkPatternsFound`.
- A risk entry can include `category`, `severity`, `explanation` and `evidence`.
- Verification that supplied evidence occurs in the contract text, allowing differences in whitespace. Unsupported quotations can cause an analysis request to fail; findings are **not** silently treated as verified.
- Saved analyses scoped to the authenticated user. Older records lacking newer optional risk fields remain supported.
- Rate limiting on analysis requests, Helmet headers, configurable CORS, environment validation and database-aware health checks.

### Administrator dashboard

- Administrator authentication with database-backed role checks.
- Totals for registered users, saved scans and scans in the previous seven days.
- Commonly detected risk categories.
- User listing with email search, pagination, account role and per-user scan count.
- Paginated scan activity with dates, URLs, account information and detected patterns.
- Loading, empty and API-error states.

The dashboard reads from protected backend endpoints, not a fixed demonstration dataset. Notification features are not implemented.

## Technology stack

| Area | Technology |
|---|---|
| Extension | React, JavaScript, Vite, Chrome Manifest V3 |
| Backend | Node.js, Express.js |
| Database | MongoDB / MongoDB Atlas, Mongoose |
| AI | Google Gemini API (`@google/generative-ai`) |
| Authentication | JWT, bcryptjs |
| Administrator dashboard | React, Vite, Tailwind CSS |
| PDF export | jsPDF |
| Backend tests | Jest, Supertest, MongoDB Memory Server |
| Quality checks | ESLint, Vite build |

The backend currently selects the model identifier `gemini-3.5-flash-lite` in `backend/routes/ai.js`; actual model access depends on the configured Gemini API account.

## System overview

```text
Chrome extension (React)                         Admin dashboard (React)
  ├─ paste text / scrape active page               └─ admin login and oversight
  ├─ scan result / saved history                             │
  └─ PDF export                                              │
              │ HTTPS/HTTP + JWT                             │ JWT
              └─────────────────┬────────────────────────────┘
                                ▼
                      Express backend API
                  ├─ authentication / authorization
                  ├─ contract analysis and validation ──────► Gemini API
                  ├─ scan persistence and deletion
                  └─ admin statistics and listings
                                │
                                ▼
                         MongoDB database
                         ├─ users
                         └─ scan results
```

**Analysis flow:** the extension sends pasted or extracted text to `POST /api/ai/analyze`. The backend validates and, when needed, divides the input into overlapping chunks. Gemini produces structured findings; the backend validates the response and verifies supplied quotations against the contract text. A synthesis stage consolidates chunk analyses. A successful result is saved and returned with a scan ID. History is accessed via `GET /api/scans`.

A text match helps detect unsupported quotations but does **not** establish that the model's legal interpretation is correct.

## Repository layout

```text
ClearContract/
├── backend/
│   ├── config/             # environment, prompts, shutdown
│   ├── middleware/         # authentication and admin authorization
│   ├── models/             # User and ScanResult
│   ├── routes/             # auth, AI, scans and admin APIs
│   ├── scripts/            # admin promotion utility
│   ├── tests/              # backend automated tests
│   ├── .env.example
│   ├── app.js
│   └── server.js
├── extension/
│   ├── public/             # Manifest V3 and app icons
│   └── src/                # popup, authentication, History and PDF export
├── dashboard/              # administrator React application
├── tests/sample-contracts/ # fictional contracts for manual QA
└── README.md
```

## Prerequisites

- Node.js compatible with the Vite 8 toolchain (Node.js 20.19+ or 22.12+).
- npm and Google Chrome.
- A MongoDB database, such as MongoDB Atlas.
- A Gemini API key.

Each application directory has its own dependencies and `package.json`.

## Local installation

### 1. Clone

```bash
git clone https://github.com/XDecoder12/ClearContract.git
cd ClearContract
```

### 2. Backend

```bash
cd backend
npm ci
```

Copy `backend/.env.example` to `backend/.env` (on Windows PowerShell: `Copy-Item .env.example .env`) and set your own values:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=5001
CORS_ALLOWED_ORIGINS=chrome-extension://YOUR_EXTENSION_ID,http://localhost:5173
```

For MongoDB Atlas, allow the necessary client IP in Network Access and use a properly configured database user. Never commit real `.env` files or secrets.

Start the backend:

```bash
npm run dev
```

The backend typically runs on `http://localhost:5001`. Visit `http://localhost:5001/health` to check API and database health. `npm start` runs without Nodemon watching files.

### 3. Chrome extension

In a separate terminal:

```bash
cd extension
npm ci
npm run lint
npm run build
```

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** and select **Load unpacked**.
3. Select `ClearContract/extension/dist`.
4. Copy the extension ID shown in Chrome.
5. Set `CORS_ALLOWED_ORIGINS` in `backend/.env` to include `chrome-extension://<that-id>` and restart the backend.
6. Register or log in through the extension popup.

The extension currently points to `http://localhost:5001`, and its Manifest V3 `host_permissions` include that local address. For deployment, both the API URL and host permissions require a reviewed HTTPS configuration.

### 4. Admin dashboard

In another terminal:

```bash
cd dashboard
npm ci
npm run dev
```

The dashboard normally uses `http://localhost:5173` and expects the backend at `http://localhost:5001`. If needed, create `dashboard/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5001
```

Ensure the dashboard origin is listed in backend CORS settings.

### 5. Administrator account

Register an ordinary user first. Then from the backend directory, run:

```bash
node scripts/promote-admin.js existing-user@example.com
```

This changes the existing account's role to `admin`; it does not create an account. Sign in to the administrator dashboard with that account. Public registration cannot grant itself admin privileges.

## API overview

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Basic API response |
| GET | `/health` | Public | API/database health |
| POST | `/api/auth/register` | Public | Account registration |
| POST | `/api/auth/login` | Public | Login and JWT issuance |
| POST | `/api/ai/analyze` | JWT | Analyze and save contract |
| GET | `/api/scans` | JWT | Retrieve up to 50 recent user scans |
| DELETE | `/api/scans/:id` | JWT | Delete an owned saved scan |
| GET | `/api/admin/me` | Admin | Verify admin access |
| GET | `/api/admin/stats` | Admin | Usage statistics |
| GET | `/api/admin/users` | Admin | Search and paginate users |
| GET | `/api/admin/scans` | Admin | Paginated scan activity |

Example analysis request body:

```json
{
  "contractText": "Membership automatically renews unless cancelled.",
  "sourceUrl": "https://example.com/terms"
}
```

`sourceUrl` is optional but, if provided, must be an HTTP or HTTPS URL. An analysis response contains `success`, `scanId` and an `analysis` object. For newer results, the analysis has a structure similar to:

```json
{
  "overallRiskLevel": "MEDIUM",
  "aiSummary": "The contract contains an automatic renewal condition.",
  "darkPatternsFound": [
    {
      "category": "Automatic Renewal",
      "severity": "MEDIUM",
      "explanation": "The membership continues until the customer cancels.",
      "evidence": "Membership automatically renews unless cancelled."
    }
  ]
}
```

This example is illustrative, not a claim about an actual service's contract or a guaranteed Gemini result. Older saved scans might lack risk-level, severity or evidence fields.

Admin list endpoints support pagination with page sizes up to 100. User search uses the `q` parameter. The dashboard's scan search operates on currently loaded records rather than performing server-side search across all scans.

## Testing and QA

From `backend/`:

```bash
npm test
```

At the last confirmed local test run on **29 October 2026**, **66 backend tests passed across 12 suites**. The suite covers authentication, permissions, analysis success/failure handling, evidence validation, request limits, environment checks, health, shutdown and administrator APIs. These are automated checks using mock Gemini responses; they do not guarantee perfect live AI outputs.

From `extension/`:

```bash
npm run lint
npm run build
```

Both succeeded at the final integration checkpoint. For the dashboard:

```bash
cd dashboard
npm run lint
npm run build
```

Dashboard build success should be verified independently before claiming a fresh pass.

**Manual contract QA:** `tests/sample-contracts/` contains eight fictional or illustrative sample agreements used for evaluating consumer-risk detection. Names resembling real services are for testing only; these files are not presented as authentic current service agreements.

Useful end-to-end checks include registration, login/logout, manual analysis, active-page extraction, risk evidence, saved History, search/filter/sort, deletion, both PDF downloads and admin access.

## Security and privacy considerations

- Passwords are hashed using bcryptjs.
- JWTs protect user-specific API requests. Tokens expire, and the extension handles expired sessions.
- Admin endpoints require authentication and a database-backed administrator role.
- Inputs are length-limited, URLs are validated and analysis requests are rate-limited.
- Configurable CORS and Helmet headers provide additional protections.
- History and admin APIs limit selected fields instead of returning whole database documents.
- Scan results **do store the original contract text** in MongoDB. This matters for privacy, data retention and future deployment policies.
- The API sends contract text to Gemini for analysis. Do not submit confidential agreements without understanding the data-processing implications.

These measures do not make the project independently audited or production-ready.

## Current limitations

- Backend and extension are configured for localhost, not a production HTTPS deployment.
- Chrome Web Store publication and a complete public privacy policy are not in place.
- Gemini responses can be inaccurate or return quotations with differences beyond whitespace; verification may reject the analysis rather than save unsupported evidence.
- Risk levels are model-generated indicators, not independently validated legal conclusions.
- The extension reads webpage `document.body.innerText` where Chrome permits script injection; it is not a dedicated legal-document parser and may collect irrelevant page text.
- No established production policy for long-term retention and deletion of original contract text.
- Dashboard scan searching is limited to loaded records; notifications are not implemented.
- Formal academic artifacts such as diagrams and the project report are separate from this repository documentation.

## Development and contributions

The project was developed collaboratively. UI branding and styling, Gemini prompt improvements and fictional contract QA samples were incorporated from teammate development branches. Integration also preserved and extended authentication, scanning, scan management and PDF reporting. The team's original development branches are intentionally retained for review of contribution history.

Individual responsibilities and authorship should be assessed from the repository's commit history and project records rather than inferred from this summary.

## Disclaimer

ClearContract is an educational project to assist with preliminary review of contracts and Terms of Service. It does not provide legal advice. Users should independently review source documents and obtain advice from a qualified professional for consequential decisions.
