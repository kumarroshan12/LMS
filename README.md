# LendFlow — Loan Management System

LendFlow is a full-stack loan management application for borrowers and lending operations teams. Borrowers can check eligibility, submit and track a loan application, and view repayment progress. Staff work in role-specific sales, sanction, disbursement, and collection modules.

## Features

- Borrower registration and login with JWT authentication.
- Server-side eligibility checks for age, monthly salary, PAN format, and employment status.
- Loan applications with fixed 12% annual simple interest and repayment estimates.
- Salary-slip uploads (PDF, JPG, or PNG; maximum 5 MB).
- Loan lifecycle: `APPLIED → SANCTIONED → DISBURSED → CLOSED`, with rejection supported at sanction.
- One active application per borrower; customer profile details are reused for later applications.
- Repayment ledger with unique UTR numbers and automatic closure when the balance is fully paid.
- Role-based access for borrowers, sales, sanction, disbursement, collection, and administrators.

DEMO VIDEO LINK- https://drive.google.com/file/d/1dFWAqZOdVKKPqz84Kn3RnlUG5jt1g1l1/view?usp=drive_link

## Technology

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Mongoose
- **Database:** MongoDB
- **Authentication:** JWT and bcrypt

## Requirements

- Node.js 20.9 or later
- npm
- A MongoDB database, either a local MongoDB instance or MongoDB Atlas

## Local setup

### 1. Install dependencies

Run these commands from the repository root:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure the backend

Copy the sample environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

On macOS or Linux, use:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`. For local MongoDB, set `MONGO_URI` to `mongodb://127.0.0.1:27017/lms_db`. For Atlas, use the connection string from your Atlas cluster. Replace the JWT placeholder with a private random secret at least 32 characters long.

Example backend environment:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/lms_db
JWT_SECRET=replace_with_a_private_random_secret_of_at_least_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
UPLOAD_DIR=uploads
```

Do not commit `.env` or share real database credentials or JWT secrets.

### 3. Configure the frontend

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For a hosted frontend, set this variable to the deployed API base URL ending in `/api`.

### 4. Seed demo data (optional)

Only run the seed command against a **new, disposable database**. It deletes existing users, loans, and payments before creating the demo accounts and sample loans.

```bash
npm run seed
```

All seeded accounts use the password `Password@123`:

| Role / account | Email |
|---|---|
| Administrator | `admin@lms.com` |
| Sales executive | `sales@lms.com` |
| Sanction officer | `sanction@lms.com` |
| Disbursement officer | `disbursement@lms.com` |
| Collection officer | `collection@lms.com` |
| Borrower lead | `rahul.lead@lms.com` |
| Active borrower | `borrower@lms.com` |
| Sanction demo borrower | `vikram.borrower@lms.com` |
| Collection demo borrower | `ananya.borrower@lms.com` |

### 5. Start the application

Start the backend and frontend in separate terminals from the repository root:

```bash
npm run backend:dev
```

```bash
npm run frontend:dev
```

Open [http://localhost:3000](http://localhost:3000). The backend health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health).

## Build

```bash
npm run backend:build
npm run frontend:build
```

## Application structure

```text
backend/   Express API, authentication, business rules, MongoDB models, uploads
frontend/  Next.js borrower portal and employee operations portal
```

Main frontend routes:

- `/register`, `/login` — borrower registration and sign-in
- `/borrower` — borrower dashboard
- `/borrower/apply` — eligibility and loan application flow
- `/borrower/loans` — loan history and repayment details
- `/dashboard/sales` — eligible borrower leads who have not submitted an application
- `/dashboard/sanction` — review, approve, or reject applications
- `/dashboard/disbursement` — disburse sanctioned loans
- `/dashboard/collection` — record and view repayments

## Data relationships

- One borrower (`User`) can have multiple loan records over time (`Loan.borrowerId`).
- A loan can have multiple repayment records (`Payment.loanId`).
- Each payment records the collection staff member who entered it (`Payment.collectedBy`).
- Borrower profile data is saved on the user and copied into each loan application as an application snapshot.

## Notes

- Salary slips are stored in the backend upload directory. Local development uses `backend/uploads`; a hosted deployment must configure persistent or object storage if uploaded files need to survive restarts and redeploys.
- The local CORS configuration currently allows all origins. `CLIENT_URL` is present in the environment configuration but is not currently used to restrict CORS.
- Demo credentials are for local evaluation only. Change or disable them before exposing a seeded instance publicly.
