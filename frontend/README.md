# Frontend (React + Vite)

## Run (Windows PowerShell)
From `E:\\ipl2\\frontend`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open:
- `http://localhost:8080/`

## Backend connection
Frontend calls the backend using `VITE_API_BASE_URL` from `.env` (default `http://127.0.0.1:8000`).
