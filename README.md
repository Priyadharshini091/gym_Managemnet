# GymFlow

GymFlow is a full-stack gym management demo with a FastAPI backend and a React 18 + Vite frontend.

## Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
python seed.py
python -m uvicorn main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` in `frontend/.env`.

## Demo Accounts

- Owner: `owner@gymflow.com` / `demo123`
- Member: `member@gymflow.com` / `demo123`
