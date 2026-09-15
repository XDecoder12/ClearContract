# ClearContract

ClearContract is an experimental AI-powered Chrome extension for analysing contracts and Terms of Service text for potentially concerning clauses.

The project uses Google's Gemini API to generate preliminary analysis and is currently in an early development and testing stage.

## Overview

Legal agreements and Terms of Service can contain complicated language, unclear conditions, hidden costs, and potentially unfair clauses that are difficult to understand.

ClearContract aims to make these documents easier to analyse by allowing users to provide legal text and receive an AI-generated explanation of potentially concerning terms.

The current implementation focuses on the core text-analysis workflow through a Chrome extension and backend API.

## Current Functionality

- Paste contract or Terms of Service text into the Chrome extension
- Send the provided text to the backend for analysis
- Analyse the text using Google's Gemini API
- Receive an AI-generated preliminary analysis
- Basic Chrome extension interface for interacting with the system

## How It Works

```text
Contract / Terms of Service Text
              ↓
      ClearContract Extension
              ↓
          Backend API
              ↓
        Google Gemini
              ↓
      AI-Generated Analysis
```

## Tech Stack

### Frontend
- React.js
- Chrome Extension APIs
- Vite

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### AI
- Google Gemini API
- Gemini 3.1 Flash-Lite

### Authentication
- JSON Web Tokens (JWT)
- bcryptjs

## Project Structure

```text
ClearContract/
├── backend/              # Node.js/Express backend and Gemini integration
├── dashboard/            # Dashboard components under development
├── extension/            # Chrome extension
├── tests/
│   └── sample-contracts/ # Sample contract and legal text files
├── .env.example
├── .gitignore
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 18 or later
- MongoDB Atlas account and cluster
- Google Gemini API key

### Backend Setup

1. Clone the repository:

```bash
git clone https://github.com/XDecoder12/ClearContract.git
cd ClearContract
```

2. Navigate to the backend:

```bash
cd backend
```

3. Install the dependencies:

```bash
npm install
```

4. Create your environment file:

```bash
cp .env.example .env
```

5. Add the required environment variables:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
PORT=5001
```

6. Start the development server:

```bash
npm run dev
```

The backend runs locally on:

```text
http://localhost:5001
```

### Chrome Extension

The extension can be loaded locally through Chrome's developer mode.

1. Open Chrome and navigate to:

```text
chrome://extensions
```

2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Select the `extension` directory from the project.

## Current Status

ClearContract is currently a **prototype under active development**.

The core text-analysis workflow is functional, but the project is still being tested and refined. The current version provides a basic extension interface connected to the backend and Gemini API.

The dashboard and more advanced browser-based analysis capabilities are still under development.

## Planned Development

The project is intended to evolve toward a more complete legal-text analysis system, including:

- More detailed identification of potentially concerning clauses
- Improved explanations of legal terminology
- Analysis of hidden fees and potentially unfair terms
- Cross-site text extraction from Terms of Service and similar web content
- Scan history and user profiles
- A dedicated web dashboard
- More structured analysis results
- Improved extension interface and user experience

## Disclaimer

ClearContract is an experimental software project and is **not a substitute for professional legal advice**.

AI-generated analysis may be incomplete or inaccurate and should not be relied upon as legal advice.

## Project Status

This project is being actively developed and used as a learning project to explore:

- AI application development
- Browser extension development
- Full-stack web development
- REST API design
- MongoDB integration
- Authentication
- Generative AI integration
