# Backend (FastAPI)

## Requirements
- Python 3.11+ recommended
- PostgreSQL running locally

## Setup (Windows PowerShell)
From `E:\\ipl2\\backend`:

```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`
- `JWT_SECRET_KEY`

## Run

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Open:
- `http://127.0.0.1:8001/docs`
- `http://127.0.0.1:8001/api/health`

