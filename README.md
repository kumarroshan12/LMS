# LendFlow — Enterprise Loan Management System (LMS)

**LendFlow** is an enterprise-grade digital lending platform built using the MERN stack, Next.js (App Router), TypeScript, and a strict **Three-Layer Backend Architecture**.

The system connects customers through an automated **Borrower Portal** and internal bank executives through an **Employee Operations Portal** guarded by granular Role-Based Access Control (RBAC).

---

## 🎨 Professional Fintech Design System

* **Primary Navy**: Deep navy blue (`#14243A`) for navigation bars and sidebar chrome
* **Accent Teal**: Rich teal (`#0F766E`, hover `#0D655E`) for action buttons and active highlights
* **Background Surface**: Light grey (`#F6F8FB`) with clean spacing
* **Card Panels**: Crisp white (`#FFFFFF`) with subtle border lines (`#E2E8F0`)
* **Typography**: Clean, accessible Inter typeface
* **Status Indicators**:
  * 🟢 Green: `SANCTIONED`, `DISBURSED`, `CLOSED`, `ACTIVE`
  * 🟡 Amber: `APPLIED`, `PENDING`, `LEAD`
  * 🔴 Red: `REJECTED`, `FAILED`

---

## 📁 System Architecture & Page Hierarchy

```
LendFlow System
├── Authentication & Public
│   ├── /                         Landing Page
│   ├── /login                    Sign In (Automatic Role Detection)
│   ├── /register                 Borrower Registration
│   └── /access-denied            HTTP 403 Forbidden Guard
│
├── Borrower Portal
│   ├── /borrower                 Borrower Dashboard (KPIs, active loan, repayments progress)
│   ├── /borrower/apply           4-Step Loan Wizard (Details → BRE Check → Upload → Review)
│   ├── /borrower/loans           My Loans Page (Search, status filter, pagination)
│   └── /borrower/loans/[id]      Loan Details & Lifecycle Tracker (APPLIED → SANCTIONED → DISBURSED → CLOSED)
│
└── Employee Operations Portal
    ├── /dashboard                Operations Dashboard (Pipeline KPIs & pending tasks)
    ├── /dashboard/sales          Sales Management (Pre-application lead tracking)
    ├── /dashboard/sanction       Loan Sanction (Underwriting desk, slip view, approve/reject dialog)
    ├── /dashboard/disbursement   Loan Disbursement (Treasury payout release & reference code)
    └── /dashboard/collection     Loan Collection (Ledger, unique UTR payments, auto-closure)
```

---

## 🔐 Role-Based Access Matrix

| Role | Borrower Portal | Sales Leads | Sanction Desk | Disbursement | Collection Ledger |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Borrower** | ✅ Full Access | ❌ `403` | ❌ `403` | ❌ `403` | ❌ `403` |
| **Sales Executive** | ❌ `403` | ✅ Full Access | ❌ `403` | ❌ `403` | ❌ `403` |
| **Sanction Officer** | ❌ `403` | ❌ `403` | ✅ Full Access | ❌ `403` | ❌ `403` |
| **Disbursement Officer**| ❌ `403` | ❌ `403` | ❌ `403` | ✅ Full Access | ❌ `403` |
| **Collection Officer** | ❌ `403` | ❌ `403` | ❌ `403` | ❌ `403` | ✅ Full Access |
| **Super Admin** | ❌ `403` | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |

---

## 🧮 Financial Mathematics & BRE Invariants

1. **Simple Interest (SI)**:
   $$\text{SI} = \frac{P \times R \times T}{365 \times 100}$$
   $$\text{Total Repayment} = P + \text{SI}$$
   * Principal ($P$): ₹50,000 to ₹5,00,000 (slider)
   * Tenure ($T$): 30 to 365 days (slider)
   * Fixed Interest Rate ($R$): 12% p.a.

2. **Business Rule Engine (BRE)**:
   * **Age**: 23 to 50 years inclusive (computed from Date of Birth).
   * **Monthly Salary**: Minimum ₹25,000.
   * **PAN Format**: Standard 10-char regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`.
   * **Employment Status**: Unemployed applicants are blocked.

3. **Repayment Ledger**:
   * **UTR Number**: Globally unique across all payments (enforced via database index).
   * **Overpayment Guard**: Payment amount $\le$ remaining balance.
   * **Auto-closure**: When remaining balance reaches ₹0.00, loan status automatically marks as `CLOSED`.

---

## 🚀 Quick Start Guide

### 1. Configure Backend Environment
In `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/lms_db
# For MongoDB Atlas Cloud, specify your connection string:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/lms_db?retryWrites=true&w=majority
JWT_SECRET=lms_super_secret_jwt_key_2026_fintech
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
UPLOAD_DIR=uploads
```

### 2. Seed Pre-Configured Accounts
```bash
cd backend
npm run seed
```

All accounts use password: `Password@123`
* Super Admin: `admin@lms.com`
* Sales Executive: `sales@lms.com`
* Sanction Officer: `sanction@lms.com`
* Disbursement Officer: `disbursement@lms.com`
* Collection Officer: `collection@lms.com`
* Borrower Account: `borrower@lms.com`

### 3. Start Backend & Frontend

**Backend** (port 5000):
```bash
cd backend
npm run dev
```

**Frontend** (port 3000):
```bash
cd frontend
npm run dev
```
