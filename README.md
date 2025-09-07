# TFZ Trading Assistant

A sophisticated personal trading assistant web application that automates options-selling strategies and integrates with Tastytrade and Google Sheets.

## 🚀 Features

### Core Functionality
- **Authentication**: Single-user login with session management
- **Market Data Integration**: Real-time price, IV/IVR, and technical indicators via Polygon.io
- **Options Scanner**: CSV upload and filtering based on customizable rules
- **Trade Recommender**: Personalized options recommendations with risk analysis
- **OCO Calculator**: Automatic take-profit and stop-loss calculations
- **Fee Engine**: Tastytrade commission and fee calculations
- **Trade Logging**: Google Sheets integration for trade tracking
- **Analytics Dashboard**: P&L tracking, win rates, and performance metrics

### Trading Rules Engine
- Days to expiry (DTE): 7-10 days
- IVR filtering: ≥25% (prefer ≥35%)
- Target delta: ~0.16 (0.15-0.20 range)
- Credit requirements: 5-7% of spread width
- Trend filtering: Call spreads when price below 10-EMA or RSI > 65
- Earnings avoidance: Skip trades within 7-14 days of earnings

## 🛠 Tech Stack

- **Frontend**: Next.js 15+ with TypeScript, App Router, Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Validation**: Zod schemas
- **UI Components**: shadcn/ui with Radix UI primitives
- **Authentication**: JWT with secure cookies
- **APIs**: Polygon.io (market data), Tastytrade (options), Google Sheets
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before setting up the application, you'll need:

1. **Polygon.io API Key**: For market data (price, IV, technical indicators)
2. **Tastytrade API Credentials**: Client ID, secret, username, password
3. **Google Sheets Service Account**: For trade logging
4. **Node.js 18+**: For development

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd tfz-web
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Authentication
APP_USER=your_username
APP_PASS=your_password

# Market Data (Polygon.io)
POLYGON_API_KEY=your_polygon_api_key

# Tastytrade API
TASTY_CLIENT_ID=your_tasty_client_id
TASTY_CLIENT_SECRET=your_tasty_client_secret
TASTY_USERNAME=your_tasty_username
TASTY_PASSWORD=your_tasty_password

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_google_sheet_id

# Session Secret
NEXTAUTH_SECRET=your_random_secret_key_here

# Optional: OpenAI for AI features
OPENAI_API_KEY=your_openai_api_key
```

### 3. Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Production Build

```bash
npm run build
npm start
```

## 🚀 Deployment on Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

## ⚠️ Disclaimer

This software is for educational and personal use only. Options trading involves significant risk and may not be suitable for all investors. Always consult with a qualified financial advisor before making investment decisions. The authors are not responsible for any financial losses incurred through the use of this software.

---

**Happy Trading! 📊💰**
