# StreamGuard AI

StreamGuard AI is a monitoring platform for identifying suspicious public streaming activity and helping teams prioritize high-risk incidents quickly.

## Overview

The project combines a FastAPI backend with a Next.js frontend to:

- collect and normalize incident signals
- score and classify risk
- surface prioritized results in a dashboard
- generate and share operational reports

## Core Capabilities

- Multi-signal incident analysis (links, domains, engagement, timing)
- Rule-based and model-assisted risk scoring
- Sport-specific monitoring views
- Incident table with drill-down context
- Executive PDF report generation and email delivery

## Project Structure

```text
backend/        FastAPI app, routers, and scoring services
frontend/       Next.js dashboard and report workflow
data/           Seed/mock incident data for fallback flows
docs/           Notes and planning artifacts
frontend-old/   Legacy frontend snapshot
```

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: FastAPI, Python
- Integrations: Reddit/public signal feeds, Gemini-compatible analysis, SMTP email

## Local Setup

### 1) Backend

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` and calls backend endpoints on `http://127.0.0.1:8000`.

## Environment Configuration

Configure frontend variables in:

`frontend/.env.local`

Common settings include:

- model/API provider values used by frontend API routes
- report email delivery values:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`

After editing `.env.local`, restart the frontend dev server.

## Notes

- Fallback datasets are used only when live sources are unavailable.
- Report generation uses current data fetch at click time and includes a generation timestamp.
