ThetaFlowz — Personal Trading Assistant

A private web app to help me run my options-selling strategies with discipline and automation.
Built on Next.js + Vercel, integrated with Tastytrade API (options chains, greeks, orders), Google Sheets (journal + analytics), and AI coaching.

⸻

🚀 Features

Core (MVP)
	•	🔑 Single-user login (env-based)
	•	📊 Watchlist upload + scanner (7–10 DTE, Δ≈0.16, IVR ≥ 25, trend filter)
	•	🎯 Trade recommender: exact strikes from Tastytrade chains
	•	📐 OCO calculator (TP 50–75%, SL 2× credit, T-2 rule)
	•	💰 Tastytrade commission & fee auto-calculator
	•	📑 Google Sheets integration for journaling trades

Phase 2
	•	📈 Analytics dashboard (P/L, win rate, fees drag, per-ticker stats)
	•	🔄 Roll helper (Δ > 0.35 or strike tagged)
	•	📝 Close-trade flow (exit → update sheet with realized P/L)
	•	📤 Exportable trade cards (PDF/PNG)

AI Assistant (Phase 2–3)
	•	🤖 Explain Trade → PASS/FAIL + reasons + fixes
	•	🔍 Natural-Language Screener → English → scanner params
	•	📔 Journal Coach → weekly insights from trade history

⸻

🛠 Tech Stack
	•	Frontend/UI: Next.js (App Router), TailwindCSS, shadcn/ui
	•	State/Data: TanStack Query, Zustand, Zod
	•	Backend: Next.js API routes (Vercel serverless)
	•	Data Sources:
	•	Tastytrade API (OAuth2) → chains, greeks, positions
	•	Polygon / TwelveData → quotes, EMA/RSI, IV/IVR
	•	Google Sheets API → trade logs
	•	AI: JSON-only endpoints for explain/screener/journal

⸻

⚙️ Setup

1. Clone & Install

git clone https://github.com/YOUR-USER/tfz-web.git
cd tfz-web
npm install

2. Configure Environment Variables

Create .env.local:

# App login
APP_USER=josh
APP_PASS=supersecret

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_JSON={...one-line JSON key...}
SPREADSHEET_ID=your_google_sheet_id
TRADES_TAB=trades

# Tastytrade OAuth2
TASTY_CLIENT_ID=...
TASTY_CLIENT_SECRET=...
TASTY_REDIRECT_URI=http://localhost:3000/api/auth/callback
TASTY_AUTH_URL=https://my.tastytrade.com/auth.html
TASTY_TOKEN_URL=https://api.tastyworks.com/oauth/token
TASTY_SCOPES=read

# Market data
POLYGON_API_KEY=...

3. Run locally

npm run dev

Open http://localhost:3000.

4. Deploy to Vercel
	•	Push repo to GitHub
	•	Import into Vercel → add env vars → deploy

⸻

📂 Structure (planned)

/app
  /login
  /dashboard
  /scanner
  /recommend
  /api
    /auth/login
    /auth/callback
    /auth/refresh
    /trades/log
    /chains
    /quotes
    /ai
/components
/lib
  sheets.ts    # Google Sheets client
  tasty.ts     # Tastytrade client
  data.ts      # Market data client
  oco.ts       # OCO math
  fees.ts      # tastytrade fees
  rules.ts     # trading rules
  schema.ts    # Zod schemas


⸻

✅ Built-in Trading Rules
	•	Entry: 7–10 DTE, Δ≈0.16, IVR ≥ 25, credit ≥ 5–7% width, skip earnings (T-7/T-14)
	•	Exit: TP 50–75%, SL 2× credit, time stop T-2
	•	Risk: ≤1% account risk per spread, diversify tickers/sectors
	•	Mgmt: roll if Δ > 0.35 or strike tagged, only for credit

⸻

📅 Roadmap (30 Days)

Week 1 — Scaffold + Core Flows
	•	Next.js repo, login gate, Google Sheets logging, OCO/fees calc, deploy

Week 2 — Data + Scanner
	•	Tastytrade chains, Polygon/TwelveData quotes, scanner logic, AI Explain Trade

Week 3 — Trade Management
	•	Close-trade flow, roll helper, analytics dashboard, AI Screener

Week 4 — Polish & AI Coach
	•	Strategy presets, PDF trade cards, Supabase option, AI Journal Coach, docs + QA

⸻

Would you like me to also generate the .env.example file (matching this README) so you can drop it straight into your repo?