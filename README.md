# Loan Management System (LMS) — Full-Stack Fintech Platform

An enterprise-grade **Loan Management System (LMS)** built with the MERN stack, Next.js (App Router), TypeScript, and a strict **Three-Layer Backend Architecture**.

The system connects borrowers with an automated Business Rule Engine (BRE) onboarding journey and internal executives across **Sales**, **Sanction**, **Disbursement**, and **Collection** modules guarded by Role-Based Access Control (RBAC).

---

## 🏛️ System Architecture

### 1. Three-Layer Backend Architecture
```
Request ──► [Controller Layer]  (HTTP Parsing, Status Codes, DTO format)
                 │
                 ▼
            [Service Layer]     (BRE Execution, Loan Math, State Transitions, Ledger)
                 │
                 ▼
          [Repository Layer]    (Mongoose Data Access, Query Isolation, DB Operations)
                 │
                 ▼
         [MongoDB Cloud / Atlas]
```

### 2. Loan Lifecycle State Machine
```
[Registered User] ──► (Sales Lead Tracking)
         │
         ▼ (BRE Check: Age 23-50, Income >= 25k, Valid PAN, Not Unemployed)
  [Submit Slip & Config]
         │
         ▼
     [APPLIED] ──► (Sanction Module: Review Application & Salary Slip)
     ├── Approve ──► [SANCTIONED] ──► (Disbursement Module: Release Funds)
     │                                       │
     │                                       ▼
     │                                  [DISBURSED] ──► (Collection Module)
     │                                       │          (Record unique UTR repayments)
     │                                       ▼
     │                          [Total Paid == Total Due?]
     │                                ├── No  ──► Remaining Balance
     │                                └── Yes ──► [CLOSED] (Auto-Closed)
     │
     └── Reject (with reason) ──► [REJECTED]
```

---

## 🧮 Financial Mathematics & BRE Invariants

1. **Simple Interest (SI)**:
   $$\text{SI} = \frac{P \times R \times T}{365 \times 100}$$
   $$\text{Total Repayment} = P + \text{SI}$$
   * Principal ($P$): ₹50,000 to ₹5,00,000
   * Tenure ($T$): 30 to 365 days
   * Interest Rate ($R$): 12% p.a. fixed

2. **Business Rule Engine (BRE)**:
   * **Age**: 23 to 50 years inclusive (computed from Date of Birth).
   * **Monthly Salary**: Minimum ₹25,000.
   * **PAN Format**: Standard 10-char regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`.
   * **Employment Status**: Unemployed applicants are blocked.

3. **Collection Ledger**:
   * **UTR Number**: Globally unique across all payments (enforced by DB index).
   * **Overpayment Validation**: Payment amount $\le$ remaining balance.
   * **Auto-closure**: When balance reaches ₹0.

---

## 👥 Evaluator Seed Accounts & Login Credentials

All accounts are pre-configured in the database seed script:
**Default Password for all accounts**: `Password@123`

| Role | Email Address | Access Level & Module |
| :--- | :--- | :--- |
| **Super Admin** | `admin@lms.com` | Full wildcard access across all 4 operational modules |
| **Sales Executive** | `sales@lms.com` | Pre-application lead tracker (registered users who haven't applied) |
| **Sanction Officer** | `sanction@lms.com` | Underwriting queue: review slip & approve/reject with reason |
| **Disbursement Officer** | `disbursement@lms.com` | Treasury queue: disburse sanctioned loans with reference |
| **Collection Officer** | `collection@lms.com` | Collection queue: record repayment by UTR, balance tracking, auto-closure |
| **Borrower** | `borrower@lms.com` | Multi-step loan application wizard & live status tracker |
| **Borrower Lead** | `rahul.lead@lms.com` | Registered lead user without an application (visible in Sales module) |

> 💡 **Tip**: The frontend UI features a **1-Click Evaluator Quick-Switch** pill directly in the top navbar and on the sign-in page to instantly test every role without manual typing!

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js v18+ (tested on Node v22)
* MongoDB Cloud (Atlas) connection string or local MongoDB instance

---

### Step 1: Configure Backend

```bash
cd backend
npm install
```

Create or verify `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/lms_db?retryWrites=true&w=majority
JWT_SECRET=lms_super_secret_jwt_key_2026_fintech
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
UPLOAD_DIR=uploads
```

Seed the database with all evaluator accounts and sample lifecycle records:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
# Server starts at http://localhost:5000
# API Health Check: http://localhost:5000/api/health
```

---

### Step 2: Configure & Start Frontend

```bash
cd ../frontend
npm install
npm run dev
# Frontend runs at http://localhost:3000
```

---

## 🎨 Design System

Styled according to **Modern Enterprise Fintech** aesthetics:
* **Background Surfaces**: Soft-grey (`#F8FAFC`, `bg-slate-50`) and crisp white cards (`bg-white`)
* **Navigation Bar**: Deep Navy (`#0B192C`)
* **Accents**: Emerald and Teal (`#059669`, `#0D9488`) for active states and monetary figures
* **Borders & Elevation**: Thin borders (`border-slate-200`) and subtle shadows (`shadow-sm`)
* **Typography**: Clean typography with generous spacing and accessible contrast

---

## 📁 Repository Structure

```
d:\LMS\
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection and environment config
│   │   ├── constants/       # Role enums, loan status enums
│   │   ├── models/          # Layer 3: User, Loan, Payment Mongoose models
│   │   ├── repositories/    # Layer 3: UserRepo, LoanRepo, PaymentRepo
│   │   ├── services/        # Layer 2: AuthService, BreService, LoanService, OperationsService
│   │   ├── controllers/     # Layer 1: AuthController, BorrowerController, OperationsController
│   │   ├── middlewares/     # JWT Auth, RBAC (403), Multer Upload (5MB), Error Handler
│   │   ├── routes/          # Express route definitions
│   │   ├── utils/           # ApiResponse formatters, Simple Interest math
│   │   ├── seed/            # Seed script pre-populating all roles and loans
│   │   ├── app.ts           # Express application configuration
│   │   └── server.ts        # Server entrypoint
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Fintech landing & role overview
│   │   │   ├── login/page.tsx    # Sign-in & 1-click evaluator login
│   │   │   ├── borrower/page.tsx # Multi-step BRE wizard & repayment tracking
│   │   │   ├── dashboard/page.tsx# Operations Workbench (Sales, Sanction, Disbursement, Collection)
│   │   │   └── layout.tsx        # Persistent Navy Navbar & AuthProvider
│   │   ├── components/Navbar.tsx # Navigation & Evaluator role quick-switch
│   │   └── lib/                  # API client & AuthContext
│   └── package.json
│
└── README.md
```
