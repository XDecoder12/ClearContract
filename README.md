# ClearContract AI Guardian 🛡️

ClearContract is an AI-powered Chrome Extension designed to protect users from predatory legal agreements. It instantly scans Terms of Service and contracts to identify "dark patterns," hidden fees, and unfair clauses using Google's Gemini AI.

## 🚀 Tech Stack
* **Frontend:** React.js, Chrome Extension APIs
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas (Mongoose)
* **AI Integration:** Google Gemini 3.1 Flash-Lite
* **Authentication:** JSON Web Tokens (JWT) & bcryptjs

## 📂 Project Structure
* `/backend` - The Node.js/Express API that connects to MongoDB and Google Gemini.
* `/extension` - *(Coming Soon)* The React-based Chrome Extension UI.

## 🛠️ Local Setup Instructions

### Prerequisites
* Node.js (v18+ recommended)
* A MongoDB Atlas Cluster
* A Google Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   * Duplicate `.env.example` and rename it to `.env`
   * Fill in your `MONGO_URI`, `GEMINI_API_KEY`, and `JWT_SECRET`
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5001`*

## 💡 Core Features (In Development)
- [x] Backend Express Server Setup
- [x] MongoDB Connection
- [x] Gemini AI Analysis Endpoint
- [ ] User Authentication (JWT & bcrypt)
- [ ] Chrome Extension UI
- [ ] Cross-site DOM text scraping
- [ ] Save scan history to user profile

## 🤝 Contributing
This project is currently under active development by the ClearContract team.