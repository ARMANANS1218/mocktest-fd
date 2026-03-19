# TestZen - Bitmax

Mock Test & Candidate Evaluation Platform built with the MERN stack.

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, React Router v6
- **Backend:** Node.js, Express, MongoDB Atlas, JWT Auth
- **Reports:** PDFKit (PDF), ExcelJS (Excel)

## Features

- Organization & role-based question papers (Agent / TL / QA)
- MCQ, True/False, and Written question types
- Timed tests (full-test or per-question timer)
- Shareable test links — auto-uses live URL after deployment
- Auto-evaluation for objective questions
- Manual evaluation for written answers (with edit/re-evaluate)
- PDF & Excel reports (individual + combined)
- Role-based access: **Admin**, **Sub-Admin**, **Report Viewer**
- Bulk import questions via Excel
- Analytics dashboard with score distribution & question analysis

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
node server.js
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:5000
VITE_APP_NAME=TestZen - Bitmax
VITE_DEV_PORT=5173
```

```bash
npx vite
```

### First Run

Hit the `/api/auth/setup` endpoint once to create the initial admin account.

## Deployment

1. Build frontend: `cd frontend && npx vite build`
2. Serve `frontend/dist` via a static host (Vercel, Netlify, etc.)
3. Deploy backend to any Node.js host (Render, Railway, etc.)
4. Update `FRONTEND_URL` in backend `.env` to your live domain
5. Update `VITE_BACKEND_URL` in frontend `.env` to your live API URL

> Test links use `window.location.origin` — they automatically become live URLs after deployment. No manual changes needed.

## Roles

| Role | Access |
|------|--------|
| Admin | Full access + user management |
| Sub-Admin | Full access, no user management |
| Report Viewer | Org-scoped evaluated reports only |

## Project Structure

```
backend/
  models/       # Mongoose schemas
  routes/       # Express route handlers
  middleware/   # Auth & role middleware
  server.js     # Entry point
frontend/
  src/
    components/ # Reusable UI components
    pages/      # Route pages
    context/    # Auth context
    api.js      # Axios instance
```

---

Built by **Bitmax Technology**
