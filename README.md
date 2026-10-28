# ClearContract

**ClearContract** is an AI-assisted contract analysis project designed to help users understand potentially concerning clauses in contracts and Terms of Service. Built with the MERN ecosystem and Google's Gemini API, it includes a Chrome extension for contract analysis, a backend API for authentication and data storage, and an administrator dashboard for reviewing users, scan activity and detected risk patterns.

**Project status:** The core local-development workflow, authenticated scan history, protected administrator APIs and live admin dashboard are implemented. Production deployment and Chrome Web Store publication remain subject to final verification.

> **Disclaimer:** ClearContract provides preliminary AI-generated information, not legal advice. Its results may be incomplete or inaccurate and should not replace review by a qualified legal professional.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Creating an Administrator Account](#creating-an-administrator-account)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Security and Data Handling](#security-and-data-handling)
- [Current Limitations and Remaining Work](#current-limitations-and-remaining-work)
- [Disclaimer](#disclaimer)

## Features

### 1. Chrome Extension

The ClearContract Chrome extension provides the main interface for users.

- **User registration and login:** Create an account and authenticate using an email address and password.
- **Contract input:** Paste contract text or Terms of Service into the extension.
- **Webpage text extraction:** Read visible text from the currently active webpage using Chrome extension APIs.
- **AI-powered analysis:** Submit contract text to the backend for analysis using Google's Gemini API.
- **Risk explanations:** Review detected patterns, their explanations and an AI-generated summary.
- **Scan history:** Retrieve previously saved analyses associated with the authenticated user.
- **Collapsible history cards:** Expand and collapse saved scan details in the extension's history interface.
- **Session handling:** Store authentication tokens using Chrome extension storage and handle expired sessions.

### 2. Backend API

The backend manages authentication, analysis, persistence and administrator access.

- REST API built with Node.js and Express.
- MongoDB persistence using Mongoose.
- JWT-based authentication and bcryptjs password hashing.
- User-specific scan history.
- Contract text validation and normalization.
- Source URL validation for HTTP and HTTPS URLs.
- Support for contract text up to 200,000 characters.
- Chunked analysis for long contracts with overlapping sections.
- Structured JSON responses and synthesis of chunk-level findings.
- Retries for selected transient Gemini API failures.
- Rate limiting for contract analysis requests.
- Helmet security headers and configurable CORS.
- Environment-variable validation during server startup.
- Health endpoint that reports database connectivity.
- Graceful shutdown of the HTTP server and MongoDB connection.

### 3. Administrator Dashboard

The React dashboard provides protected administrative oversight using live backend data.

- Administrator login and database-backed role verification.
- Live statistics for registered users, total scans and scans from the last seven days.
- Most frequently detected risk categories.
- User directory with email search, pagination, roles and per-user scan counts.
- Scan activity with source URLs, account emails, scan dates and detected patterns.
- Loading, empty and API-error states.
- Protected administrator APIs for statistics, users and scan metadata.

The dashboard uses the backend API rather than hardcoded sample users and scan records for these connected sections. Notifications are not implemented yet.

## Technology Stack

| Component | Technologies |
|---|---|
| Browser extension | React, JavaScript, Vite, Chrome Extensions Manifest V3 |
| Administrator dashboard | React, JavaScript, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| AI integration | Google Gemini API |
| Authentication | JSON Web Tokens, bcryptjs |
| Backend testing | Jest, Supertest, MongoDB Memory Server |
| Frontend quality checks | ESLint and Vite production builds |

The Gemini model identifier is configured in `backend/routes/ai.js`. Its availability depends on the Gemini API account and provider configuration.

## Architecture

```text
                  ┌──────────────────────────┐
                  │   Chrome Extension       │
                  │      React + Vite        │
                  └────────────┬─────────────┘
                               │
                               │ HTTP requests + JWT
                               ▼
                  ┌──────────────────────────┐
                  │      Express API         │
                  │                          │
                  │ Authentication           │
                  │ Contract analysis        │
                  │ Scan history             │
                  │ Admin endpoints          │
                  │ Security middleware      │
                  └───────┬──────────┬───────┘
                          │          │
                          ▼          ▼
                 ┌────────────┐  ┌─────────────┐
                 │  MongoDB   │  │ Gemini API  │
                 │            │  │             │
                 │ Users      │  │ AI analysis │
                 │ Scan data  │  │ Summaries   │
                 └────────────┘  └─────────────┘

                  ┌──────────────────────────┐
                  │ Administrator Dashboard  │
                  │       React + Vite       │
                  └────────────┬─────────────┘
                               │
                               └── Protected admin API
```

A successful analysis is saved by `POST /api/ai/analyze`. The extension retrieves previously saved analyses through `GET /api/scans`. A separate `POST /api/scans` endpoint is not currently required by this workflow because the analysis route already persists the scan.

## Project Structure

```text
ClearContract/
├── backend/
│   ├── config/
│   │   ├── env.js
│   │   ├── prompts.js
│   │   └── shutdown.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── requireAdmin.js
│   ├── models/
│   │   ├── ScanResult.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── ai.js
│   │   ├── auth.js
│   │   └── scans.js
│   ├── scripts/
│   │   └── promote-admin.js
│   ├── tests/
│   ├── .env.example
│   ├── app.js
│   ├── server.js
│   ├── jest.config.js
│   └── package.json
├── dashboard/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── extension/
│   ├── public/
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── auth.js
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── tests/
│   └── sample-contracts/
├── .env.example
├── .gitignore
└── README.md
```

Each application has its own `package.json` and dependency installation. Run commands from the relevant component directory.

## Prerequisites

- Node.js 20.19+ or 22.12+ recommended for the Vite 8 toolchain.
- npm.
- A MongoDB Atlas cluster or another compatible MongoDB deployment.
- A Google Gemini API key.
- Google Chrome for loading and testing the extension.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/XDecoder12/ClearContract.git
cd ClearContract
```

### 2. Configure and start the backend

From the repository root:

```bash
cd backend
npm ci
cp .env.example .env
```

Open `backend/.env` and configure your own environment variables:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=replace_with_a_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=5001
CORS_ALLOWED_ORIGINS=chrome-extension://YOUR_EXTENSION_ID,http://localhost:5173
```

Replace all placeholders with your own values. Do not commit real API keys, database credentials or production secrets.

**MongoDB Atlas configuration**

1. Make sure the Atlas cluster is running.
2. Create or select a database user with the permissions required by the application.
3. Add your current IP address to Atlas Network Access.
4. Use the correct MongoDB connection string in `MONGO_URI`.

**CORS configuration**

The backend accepts configured origins from the comma-separated `CORS_ALLOWED_ORIGINS` variable.

For local development, this normally includes:

- The Chrome extension origin, in the form `chrome-extension://YOUR_EXTENSION_ID`.
- The dashboard development origin, normally `http://localhost:5173`.

You can find the extension ID at `chrome://extensions` after loading the extension. Update the backend environment file with the actual ID and restart the backend.

Start the development server:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5001
```

Check its health at:

```text
http://localhost:5001/health
```

A healthy response has this general structure:

```json
{
  "status": "ok",
  "database": "connected"
}
```

For a non-watch start, run `npm start` inside the backend directory.

### 3. Build and load the Chrome extension

Open another terminal from the repository root:

```bash
cd extension
npm ci
npm run lint
npm run build
```

After the build succeeds:

1. Open Google Chrome.
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the generated `extension/dist` directory.
6. Copy the extension ID shown by Chrome into `backend/.env` as part of `CORS_ALLOWED_ORIGINS`.
7. Restart the backend so it uses the updated CORS configuration.

The current extension code is configured to communicate with `http://localhost:5001`. Before production deployment, the extension API URL references and Manifest V3 `host_permissions` must be updated to use the deployed HTTPS API.

### 4. Start the administrator dashboard

Open another terminal from the repository root:

```bash
cd dashboard
npm ci
npm run dev
```

Vite normally serves the dashboard at:

```text
http://localhost:5173
```

The dashboard API client defaults to `http://localhost:5001`.

To override the dashboard API base URL, create `dashboard/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5001
```

Restart the Vite development server after changing environment variables. Make sure the dashboard's origin is included in the backend's `CORS_ALLOWED_ORIGINS` setting.

### 5. Register and test a user

Launch the extension, register a user account and sign in. Paste a sample contract or read text from a webpage. Run the analysis and open scan history to verify that the result has been saved.

The backend associates saved scans with the authenticated user, so each user retrieves their own history.

## Creating an Administrator Account

Administrator privileges are assigned to an existing user through the backend promotion utility.

First, register a normal account using the extension. Then open a terminal:

```bash
cd backend
node scripts/promote-admin.js existing-user@example.com
```

Replace `existing-user@example.com` with the email address of the account you intend to promote.

The script connects to the MongoDB database configured by `MONGO_URI` and changes that account's role to `admin`. It does not create a new account.

Use this utility only for trusted accounts. Public registration does not grant administrator privileges, and admin API access is checked against the database role.

After promotion, sign in to the administrator dashboard using that account's email and password.

## API Reference

The following endpoints are implemented in the backend. Unless noted otherwise, requests are served from `http://localhost:5001` during local development.

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| GET | `/` | Public | Returns a simple API status message |
| GET | `/health` | Public | Reports API and database health |
| POST | `/api/auth/register` | Public | Registers a new user |
| POST | `/api/auth/login` | Public | Authenticates a user and returns a JWT |
| POST | `/api/ai/analyze` | JWT required | Analyzes contract text and saves the result |
| GET | `/api/scans` | JWT required | Retrieves the authenticated user's scan history |
| GET | `/api/admin/me` | Admin required | Verifies administrator access |
| GET | `/api/admin/stats` | Admin required | Returns usage statistics and common risk categories |
| GET | `/api/admin/users?q=alice&page=1&limit=20` | Admin required | Searches and paginates user records |
| GET | `/api/admin/scans?page=1&limit=20` | Admin required | Retrieves paginated scan metadata |

### Contract analysis

`POST /api/ai/analyze` accepts JSON with the following fields:

```json
{
  "contractText": "The contract or Terms of Service text...",
  "sourceUrl": "https://example.com/terms"
}
```

`sourceUrl` is optional. When supplied, it must be a valid HTTP or HTTPS URL.

The backend normalizes contract text and rejects empty input or input exceeding 200,000 characters. Long contracts are split into overlapping chunks, analyzed and synthesized into structured findings.

A successful response includes the analysis, an AI-generated summary and the ID of the saved scan.

### Scan history and administrator data

- `GET /api/scans` returns recent scans belonging to the authenticated user.
- `GET /api/admin/stats` returns user and scan counts, recent scan activity totals and the most frequently detected categories.
- `GET /api/admin/users` returns user email, role, account creation date and scan count.
- `GET /api/admin/scans` returns scan metadata, associated account details, detected patterns and scan date.

The admin list endpoints support pagination. The maximum page size is 100. User search matches email addresses.

The admin scan listing intentionally excludes the saved original contract text. The scan model does retain `originalText` for saved analyses, so privacy and retention decisions remain important before public release.

## Testing

### Backend tests

Run from the backend directory:

```bash
cd backend
npm ci
npm test
```

The backend test suite uses Jest, Supertest and MongoDB Memory Server for isolated database tests.

The test files cover areas including:

- Authentication and authorization.
- Successful AI analysis and failure paths.
- Input validation and long contract handling.
- Rate limiting.
- CORS and security headers.
- Health checks and graceful shutdown.
- Administrator authorization, statistics, user listing and scan listing.

Run the complete suite again against the latest commit before submission. The test count may change as new cases are added.

### Extension checks

```bash
cd extension
npm ci
npm run lint
npm run build
```

### Dashboard checks

```bash
cd dashboard
npm ci
npm run lint
npm run build
```

Both frontend packages provide ESLint and Vite production build scripts. The extension currently does not define a separate frontend test script.

## Security and Data Handling

ClearContract includes several security controls:

- Passwords are hashed using bcryptjs.
- JWT authentication protects user-specific routes.
- Administrator routes require a database-backed admin role.
- Public registration cannot assign administrator privileges.
- Contract analysis is rate limited to 20 requests per 15-minute window.
- Input validation and contract text length limits are applied by the backend.
- Source URLs, when provided, are validated for HTTP or HTTPS.
- Helmet adds security-related response headers.
- CORS origins are configured through environment variables.
- Required backend secrets are validated at startup.
- User history and admin listing endpoints select specific fields rather than exposing the full user or scan documents.

These controls reduce risk but do not make the application automatically production-ready. Secrets must be secured, dependencies maintained and access controls verified before deployment.

## Current Limitations and Remaining Work

The core local-development workflow is implemented, but the following work should be verified or completed before treating ClearContract as production-ready:

- [ ] **Production deployment:** Deploy the backend and verify the health endpoint in the deployed environment.
- [ ] **Production API URLs:** Update the extension's hardcoded API URLs and Manifest V3 `host_permissions` to use the deployed HTTPS API.
- [ ] **Dashboard deployment:** Configure `VITE_API_BASE_URL` for the production build and configure production CORS origins.
- [ ] **Environment cleanup:** Standardize the root `.env.example` with the component-specific setup instructions. The current local backend setup should use `backend/.env.example`.
- [ ] **End-to-end testing:** Test registration, login, webpage text extraction, pasted-text analysis, saved scan history, expired sessions, rate limits and admin access using the latest code.
- [ ] **AI behavior verification:** Confirm Gemini failure handling and the treatment of high-priority contract clauses, including fees, termination, automatic renewal and liability.
- [ ] **Caching behavior:** Verify the handling of cached HTTP responses in the dashboard API client and confirm that they do not produce false UI errors.
- [ ] **Source URL consistency:** Investigate scans with missing source URLs and confirm that webpage scans persist the URL whenever it is available. Manually pasted text may legitimately have no source URL.
- [ ] **Privacy and retention:** Decide how long original contract text should be stored and document how users' information is handled.
- [ ] **Academic documentation:** Finalize the SRS, architecture diagrams, UML/use-case diagrams, project report and demonstration screenshots.
- [ ] **Chrome Web Store preparation:** Prepare the privacy policy and store listing assets if publishing the extension.

The scan activity search in the dashboard currently filters the records loaded for the current page. The backend scan-list endpoint does not yet provide server-side scan search.

A separate `POST /api/scans` endpoint is not currently required for the existing workflow because successful analyses are saved directly by `POST /api/ai/analyze`.

## Disclaimer

ClearContract is an educational software project intended to help users explore potentially concerning contract language. AI-generated analyses can be incomplete, inaccurate or missing important context.

ClearContract does not constitute legal advice and should not be relied on as the sole basis for legal or financial decisions. Users should consult a qualified legal professional when making important decisions about contracts.