# TESTZEN-PRO

Mock Test & Candidate Evaluation Platform built with the MERN stack.

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, React Router
- **Backend:** Node.js, Express, MongoDB, JWT
- **Reporting:** PDFKit (PDF), ExcelJS (Excel)

## Project Structure

```
TESTZEN-PRO/
├── backend/
│   ├── server.js
│   ├── models/
│   ├── routes/
│   └── middleware/
└── frontend/
    ├── src/
    └── public/
```

## Prerequisites

- Node.js 18+
- npm
- MongoDB (local or Atlas)

## Environment Variables

Create `backend/.env`:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:

```
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:5000
VITE_APP_NAME=TestZen
VITE_DEV_PORT=5173
```

## Installation

Install backend dependencies:

```
cd backend
npm install
```

Install frontend dependencies:

```
cd ../frontend
npm install
```

## Run Locally

Start backend (from `backend` folder):

```
npm run dev
```

Start frontend (from `frontend` folder):

```
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Build Frontend

From `frontend` folder:

```
npm run build
npm run preview
```

## Notes

- Run the initial setup endpoint once if required by auth bootstrap: `/api/auth/setup`
- For production deployment, host the frontend on `chatnexusterminal.com` and point `VITE_BACKEND_URL` / `VITE_API_BASE_URL` to the backend at `testzen.btclienterminal.com`.
