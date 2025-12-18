DataNiaga
=========

AI-powered retail decision support system that forecasts demand, surfaces market-basket insights, and generates merchandising recommendations for Indonesian islands.

What makes it great
--------------------
- Multi-island focus: separate models per pulau to capture regional demand patterns.
- End-to-end pipeline: upload sales data → validate → forecast → MBA rules → recommendations.
- In-memory workflow: fast experimentation without external databases.
- Decision insights: stockout risk flags, bundling opportunities, and prioritized actions.
- Modern stack: FastAPI backend, Vite/React + Tailwind frontend.

Key features
------------
- Forecasting: weekly demand forecasts with LightGBM, plus accuracy metrics (MAE/MAPE).
- Market Basket Analysis: FP-Growth rules with lift/support/confidence filters.
- Recommendations: derived-demand, dead-stock actions, and bundling suggestions with priority levels.
- Dashboard: summary KPIs, island/product filters, charts, and rules/recs tables.

Prerequisites
-------------
- Python 3.10+
- Node.js 18+
- npm or pnpm

How to run (development)
------------------------
Backend
1) Create/activate a virtual env (optional but recommended).
2) Install deps: `pip install -r backend/requirements.txt`.
3) Run API: `cd backend && uvicorn main:app --reload` (serves at http://127.0.0.1:8000).

Frontend
1) Install deps: `cd frontend && npm install`.
2) Run dev server: `npm run dev` (default http://127.0.0.1:5173).
3) Ensure CORS origins match your frontend URL (see backend/main.py ALLOWED_ORIGINS).

Sample flow
-----------
1) Start backend (step above).
2) Start frontend (step above).
3) Upload your sales data (CSV/XLSX with InvoiceNo, InvoiceDate, PULAU, PRODUCT_CATEGORY, Quantity).
4) Explore dashboard charts, MBA rules, and recommendations by pulau/product filters.

Deploy notes
------------
- Backend: container-friendly (Dockerfile included).
- Frontend: Vite build ready for static hosting; adjust API base URL in frontend config.

Video Demo Link :
https://drive.google.com/file/d/1u9aEDse9mqp3AkT1oHvKL_JrkUnR-Ihf/view?usp=sharing  