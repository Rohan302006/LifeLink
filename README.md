# LifeLink — Doctor-Supervised Emergency Blood Coordination Platform

[![Tests](https://img.shields.io/badge/tests-22%2F22%20passing-brightgreen.svg)](https://github.com/)
[![React](https://img.shields.io/badge/react-18.3.1-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-6.0.3-646CFF.svg)](https://vitejs.dev/)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-339933.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/express-4.21.2-000000.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/database-Neon%20PostgreSQL-336791.svg)](https://neon.tech/)
[![Deployment](https://img.shields.io/badge/deployment-Vercel%20%2B%20Render-black.svg)](https://vercel.com/)

LifeLink is a doctor-supervised, privacy-first emergency blood coordination platform designed to bridge critical hospital blood shortages directly to verified, cooldown-eligible donors while completely eliminating unverified social media forwards, panic broadcasts, and spam calls.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Architecture](#database-architecture)
- [Clinical & Security Protocols](#clinical--security-protocols)
- [Default Demo Credentials](#default-demo-credentials)
- [Screenshots & UI Showcase](#screenshots--ui-showcase)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
---

## Overview

During emergency medical surgeries, trauma admissions, or obstetric hemorrhages, families often resort to broadcasting desperate blood requisitions across messaging apps. This causes chaotic donor responses, outdated forwards, and harassment of patients.

**LifeLink eliminates this chaos by establishing a verified clinical pipeline:**
1. **Physician Verification First**: No emergency broadcast is transmitted to any volunteer until an attending hospital doctor reviews the medical requisition and government ID.
2. **Clinical Cooldown Integrity**: Donor eligibility and 90-day cooldown timers are calculated **strictly** from doctor-verified prior donation dates.
3. **Privacy by Design**: Volunteer donor contact numbers remain concealed until the donor explicitly accepts a verified blood match. Uploaded government identity proofs and medical requisitions are stored in a private directory and streamed only via authenticated endpoints.
4. **Universal Emergency Flexibility**: Real-world bidirectional participation allows registered donors to submit emergency requisitions for their families, and receivers to volunteer as donors once stabilized.

---

## Key Features

### 1. Multi-Step Onboarding Wizards
- **Donor Wizard**: Personal profile confirmation, government ID upload (JPG/PNG/PDF up to 5 MB), previous donation date with certificate verification, or first-time donor declaration.
- **Receiver Wizard**: Patient and attendant profile confirmation, government ID proof upload, official hospital requisition upload, and initial emergency blood request creation.

### 2. 3-Section Platform Administration Portal (`/admin`)
- **Doctor Section**: Real-time management across *All*, *Pending*, *Verified*, and *Rejected* physician registrations. Features 1-click verified filtering, detailed credential modals (license number, hospital, city, document preview), 1-click approvals, rejections with mandatory clinical reasons, and safe deletions with audit logging.
- **User Section**: Master directory of all registered Donors and Emergency Receivers. Displays live KPI counters (*Total Users*, *Donors*, *Receivers*), filter pills, personal profile modals, clinical donation history, and irreversible deletion modals with required reasons.
- **Hospital Section**: Directory of affiliated healthcare centers across Maharashtra and beyond. Includes live search, hospital metadata (type, bed capacity, emergency helpline), and an *Add Hospital* modal that automatically populates the doctor registration dropdown. Hospital deletion is intentionally disabled to safeguard physician credential integrity.

### 3. Doctor Clinical Triage Queue (`/doctor/dashboard`)
- Gated by administrative approval (`requireDoctorApproved`). Unapproved doctors see a clean verification pending screen.
- **Donors Tab**: List of all donors with blood group, city, verification status, and mathematical cooldown status.
- **Receivers Tab**: List of all receivers with active emergency requests and submitted verification files.
- **Requisitions Tab**: Live triage queue of all hospital blood requests. Doctors can review clinical notes, approve and trigger broadcast to compatible donors, or reject with mandatory reasons.
- **Full Person Profile Modal**: In-app inspection of personal details, donation history, and uploaded PDF/JPG documents with approve/reject controls.

### 4. Mathematical Cooldown Engine & RBC Matching
- **Automated RBC Compatibility Matrix**: Supports all 8 ABO/Rh blood groups ($O^-, O^+, A^-, A^+, B^-, B^+, AB^-, AB^+$). Universal donors ($O^-$) and universal recipients ($AB^+$) are matched according to clinical transfusion rules.
- **90-Day Clinical Cooldown**: Evaluated strictly against doctor-verified dates (`last_donation_date_status === 'verified'`). Self-reported unverified dates remain in `pending_verification` state.

### 5. Mobile-First Responsive Experience
- Touch-optimized hamburger navigation drawer with role badges and profile details.
- Data tables wrapped in `.table-responsive` with `-webkit-overflow-scrolling: touch` and minimum column widths to prevent cell squishing on mobile screens.
- Modals adapt to native bottom-sheet drawers on viewports $\le 768\text{px}$ with stacked full-width touch actions.
- Automatic prevention of iOS Safari input zoom through responsive font-size enforcement.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite)"]
        UI["Mobile-First UI & Dashboards"]
        AuthContext["Auth Context & JWT Storage"]
        API["API Service Client (api.js)"]
    end

    subgraph Server["Backend Server (Node.js + Express 4)"]
        Router["Express API Router"]
        AuthMiddleware["JWT & Role Authorization Guard"]
        Storage["Private Storage Service (Multer)"]
        Engine["Clinical Cooldown & RBC Compatibility Engines"]
    end

    subgraph Database["Persistence Layer"]
        NeonDB[("Neon PostgreSQL / Local Memory Fallback")]
        Uploads[("server/uploads/private (Protected Files)")]
    end

    UI --> AuthContext
    AuthContext --> API
    API -->|REST / CORS| Router
    Router --> AuthMiddleware
    AuthMiddleware --> Engine
    Router --> Storage
    Storage --> Uploads
    Engine --> NeonDB
```

### Complete Emergency Coordination Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Receiver as Receiver / Attendant
    actor Doctor as Attending Doctor
    actor Donor as Compatible Donor
    participant System as LifeLink Platform

    Receiver->>System: Upload ID + Hospital Requisition & Submit Request
    Note over System: Status: PENDING (No alerts broadcasted)
    Doctor->>System: Inspect Requisition & Patient ID in In-App Viewer
    Doctor->>System: Approve Requisition with Clinical Notes
    Note over System: Status: VERIFIED. Executes RBC Matrix Match.
    System->>Donor: Broadcast Emergency Match Alert
    Donor->>System: Accept Emergency Match
    Note over System: Phone numbers unlocked for coordination.
    Donor->>Doctor: Arrives at Hospital Blood Bank for Phlebotomy
    Doctor->>System: Mark Request FULFILLED
    Note over System: Resets Donor Cooldown to 90 Days.
```

---

## Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) (`18.3.1`)
- **Build Tool**: [Vite 6](https://vitejs.dev/) (`6.0.3`) with `@vitejs/plugin-react`
- **Routing**: [React Router DOM v6](https://reactrouter.com/) (`6.28.0`)
- **Icons**: [Lucide React](https://lucide.dev/) (`0.468.0`)
- **Styling**: Plain Vanilla CSS (`client/src/index.css`) with custom properties, responsive flexbox/grid, and zero external CSS runtime overhead
- **Language**: Pure JavaScript (`.jsx` / `.js`)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v18.0.0+ recommended)
- **Web Framework**: [Express 4](https://expressjs.com/) (`4.21.2`, standard ES Modules)
- **Authentication**: [JSON Web Tokens](https://jwt.io/) (`jsonwebtoken` `9.0.2`) and [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (`3.0.2`, 10 salt rounds)
- **File Uploads**: [Multer](https://github.com/expressjs/multer) (`2.5.0`) with disk storage and cryptographically random UUID file naming
- **CORS & Environment**: `cors` (`2.8.5`), `dotenv` (`16.4.7`)
- **Language**: Pure JavaScript (`.js`)

### Database & Storage
- **Production Database**: [Neon Serverless PostgreSQL](https://neon.tech/) (`pg` `8.13.1`) with connection pooling and SSL support
- **Development / Test Engine**: Dual-mode database layer that automatically falls back to an in-memory SQL mock engine when no database URI is supplied
- **Document Storage**: Local disk storage inside `server/uploads/private/` with access strictly gated by authenticated streaming endpoints

---

## Project Structure

```
LifeLink/
├── client/                               # Frontend Single Page Application (Vite + React)
│   ├── public/                           # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── DocumentViewerModal.jsx   # In-app PDF/image streaming viewer
│   │   │   │   ├── ProtectedRoute.jsx        # Role-based route guard
│   │   │   │   └── StatusBadge.jsx           # Semantic status indicator
│   │   │   └── layout/
│   │   │       ├── Footer.jsx                # Clinical disclaimer footer
│   │   │       └── Navbar.jsx                # Responsive navbar with mobile drawer
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx           # Global user authentication state
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx    # 3-section Admin portal (Doctors, Users, Hospitals)
│   │   │   ├── doctor/
│   │   │   │   └── DoctorDashboard.jsx   # Doctor triage queue, profile modal & approval
│   │   │   ├── donor/
│   │   │   │   └── DonorDashboard.jsx    # Cooldown meter, availability & matches
│   │   │   ├── onboarding/
│   │   │   │   ├── DonorOnboarding.jsx   # 4-step donor verification wizard
│   │   │   │   └── ReceiverOnboarding.jsx# 4-step receiver verification wizard
│   │   │   ├── receiver/
│   │   │   │   └── ReceiverDashboard.jsx # Requisition tracking & match counters
│   │   │   ├── shared/
│   │   │   │   └── CreateRequestModal.jsx# Emergency blood requisition form modal
│   │   │   ├── Home.jsx                  # Public landing page with workflow cards
│   │   │   ├── Login.jsx                 # Role-aware authentication form
│   │   │   └── Register.jsx              # Registration with dynamic hospital dropdown
│   │   ├── services/
│   │   │   └── api.js                    # API client with environment-aware API_BASE
│   │   ├── App.jsx                       # Route registry and application shell
│   │   ├── index.css                     # Mobile-first design system and CSS variables
│   │   └── main.jsx                      # Vite entry point
│   ├── .env.example                      # Frontend environment variable template
│   ├── index.html                        # HTML entry point with viewport configuration
│   ├── package.json                      # Frontend dependencies and build scripts
│   ├── vercel.json                       # Vercel SPA routing rewrites configuration
│   └── vite.config.js                    # Vite bundler and development proxy setup
│
├── server/                               # Backend REST API Server (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js                    # Centralized environment variable loader
│   │   ├── db/
│   │   │   ├── database.js               # Dual-mode PostgreSQL/in-memory database engine
│   │   │   └── schema.sql                # Complete 7-table PostgreSQL database schema
│   │   ├── middleware/
│   │   │   └── auth.js                   # JWT, requireRole, and requireDoctorApproved
│   │   ├── routes/
│   │   │   ├── adminRoutes.js            # Doctor, user, and hospital administrative APIs
│   │   │   ├── authRoutes.js             # Registration, login, and session validation
│   │   │   ├── doctorRoutes.js           # Verification of donors, dates, and requests
│   │   │   ├── documentRoutes.js         # Private file upload, preview, and download
│   │   │   ├── donorRoutes.js            # Cooldown, availability, and match response
│   │   │   ├── hospitalRoutes.js         # Public listing of affiliated hospitals
│   │   │   ├── onboardingRoutes.js       # Multi-step onboarding detail submission
│   │   │   ├── receiverRoutes.js         # Receiver requisitions and status queries
│   │   │   └── requestRoutes.js          # Blood request creation and single view
│   │   ├── seeds/
│   │   │   ├── seed.js                   # Seed runner invoked on startup
│   │   │   └── seedData.js               # Seed records (10 hospitals, 5 doctors, 26 users)
│   │   ├── services/
│   │   │   ├── bloodCompatibility.js     # Hematological RBC matching matrix
│   │   │   ├── eligibilityService.js     # Mathematical 90-day cooldown calculator
│   │   │   └── storageService.js         # Multer private disk storage provider
│   │   ├── tests/
│   │   │   ├── admin.test.js             # Tests for 3-section Admin portal
│   │   │   ├── auth.test.js              # Tests for authentication and password hashing
│   │   │   ├── compatibility.test.js     # Tests for RBC compatibility matrix
│   │   │   ├── eligibility.test.js       # Tests for cooldown calculation
│   │   │   └── flow.test.js              # End-to-end clinical workflow integration tests
│   │   ├── app.js                        # Express application configuration
│   │   └── index.js                      # HTTP server bootstrapper and auto-seeder
│   ├── uploads/
│   │   └── private/                      # Storage path for confidential medical files
│   └── package.json                      # Backend dependencies and test scripts
│
├── .env.example                          # Root/backend environment variable template
├── antigravity.md                        # Project Context and Master Reference specification
├── DEMO_CREDENTIALS.txt                  # Full catalog of pre-seeded test accounts
├── package.json                          # Root workspace orchestrator (concurrently)
├── README.md                             # Project documentation
└── render.yaml                           # Render Web Service deployment blueprint
```

---

## Prerequisites

Before running LifeLink locally or in production, ensure your environment meets the following requirements:

- **Node.js**: `v18.0.0` or higher (`v20.x` LTS recommended)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: (Optional for local development) Neon Serverless PostgreSQL instance or local PostgreSQL `v14+`. If omitted, the server runs on its internal memory engine.
- **Git**: Installed and configured

---

## Installation & Setup

Follow these steps to set up the project locally:

### 1. Clone the Repository
```bash
git clone https://github.com/<Rohan302006>/lifelink.git
cd lifelink
```

### 2. Install Root and Subproject Dependencies
Install backend dependencies:
```bash
cd server
npm install
```

Install frontend dependencies:
```bash
cd ../client
npm install
```

Return to the project root:
```bash
cd ..
```

### 3. Configure Environment Variables
Copy the root `.env.example` file to create your local `.env`:
```bash
cp .env.example .env
```

*(Optional)* If connecting to a live Neon database, update `DATABASE_URL` in `.env`. If left blank, the application automatically runs using the in-memory engine.

---

## Environment Variables

### Backend & Database (`.env` in project root or `server/.env`)

| Variable Name | Required | Default Value | Description |
|---|:---:|---|---|
| `PORT` | No | `5000` | Port for the Express backend server |
| `NODE_ENV` | No | `development` | Runtime environment (`development` or `production`) |
| `JWT_SECRET` | **Yes** | *fallback dev key* | Secret key used to sign and verify JSON Web Tokens |
| `DATABASE_URL` | No | `""` *(empty)* | PostgreSQL connection string. When omitted, the local memory engine activates automatically |
| `DEMO_PASSWORD` | No | `Password123!` | Synchronized password applied to all seeded demo accounts |
| `UPLOAD_DIR` | No | `server/uploads/private` | Directory path where private medical documents are stored |

#### Sample `.env` Format:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
DATABASE_URL=postgresql://user:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/lifelink?sslmode=require
DEMO_PASSWORD=Password123!
UPLOAD_DIR=server/uploads/private
```

### Frontend (`client/.env`)

| Variable Name | Required | Default Value | Description |
|---|:---:|---|---|
| `VITE_API_URL` | In Prod | `""` *(empty)* | Backend base URL in production (e.g., `https://lifelink-api.onrender.com`). In local development, leave empty to utilize the Vite proxy |

#### Sample `client/.env` Format:
```env
VITE_API_URL=https://lifelink-backend.onrender.com
```

---

## Running the Application

### 1. Development Mode (Concurrent)
From the root workspace, run both backend (`http://localhost:5000`) and frontend (`http://localhost:5173`) simultaneously:
```bash
npm run dev
```

### 2. Running Services Individually

In Terminal 1 (Backend Server):
```bash
npm --prefix server run dev
```

In Terminal 2 (Frontend Client):
```bash
npm --prefix client run dev
```

### 3. Database Seeding
To manually synchronize or reset demo users, doctors, and hospitals:
```bash
npm --prefix server run seed
```

### 4. Running Automated Tests
The project features 22 automated tests covering admin operations, password authentication, blood group compatibility, mathematical cooldown eligibility, and clinical request triage:
```bash
npm test
```
*Or execute directly inside the server folder:*
```bash
npm --prefix server test
```

### 5. Production Build (Frontend)
Compile the React application into production-ready static assets:
```bash
npm --prefix client run build
```
Compiled output will be placed in `client/dist/`.

---

## API Documentation

All protected endpoints require an `Authorization: Bearer <JWT>` header unless designated as **Public**.

### 1. Health & Public Discovery

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System health check and readiness probe |
| `GET` | `/api/hospitals` | Public | Returns list of all verified partner hospitals |

### 2. Authentication (`/api/auth`)

| Method | Endpoint | Access | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `{ email, password, full_name, phone, role, age, gender, blood_group, city, medical_license_number, hospital_name }` | Register new Donor, Receiver, or Doctor account |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | Authenticate credentials and receive JWT |
| `GET` | `/api/auth/me` | JWT | *None* | Get authenticated user record, profile, and documents |

### 3. Onboarding (`/api/onboarding`)

| Method | Endpoint | Access | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/api/onboarding/details` | JWT | `{ age, gender, blood_group, city }` | Save wizard personal & clinical details |
| `POST` | `/api/onboarding/complete` | JWT | *None* | Mark user onboarding status as complete |

### 4. Document Management (`/api/documents`)

| Method | Endpoint | Access | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/api/documents/upload` | JWT | `multipart/form-data` (`file`, `doc_type`) | Upload ID proof, donation certificate, or requisition |
| `GET` | `/api/documents/user/:userId`| Owner/Doc/Admin | *None* | Retrieve document metadata list for a user |
| `GET` | `/api/documents/:id/view` | Owner/Doc/Admin | *None* | Stream document inline for in-app previewer |
| `GET` | `/api/documents/:id/download`| Owner/Doc/Admin | *None* | Download private document file |
| `POST` | `/api/documents/:id/review` | Doctor/Admin | `{ status, rejection_reason }` | Approve or reject submitted document |

### 5. Donor Services (`/api/donors`)

| Method | Endpoint | Access | Request Body | Description |
|---|---|---|---|---|
| `GET` | `/api/donors/dashboard` | JWT | *None* | Returns donor eligibility status, cooldown, and matches |
| `PUT` | `/api/donors/availability` | JWT | `{ is_available }` | Toggle donor availability status |
| `POST` | `/api/donors/donation-date` | JWT | `{ last_donation_date }` | Update last donation date (sets status to pending) |
| `POST` | `/api/donors/matches/:id/respond`| JWT | `{ action }` (`accepted` / `declined`) | Accept or decline emergency blood match |

### 6. Receiver Services (`/api/receivers`)

| Method | Endpoint | Access | Request Body | Description |
|---|---|---|---|---|
| `GET` | `/api/receivers/dashboard` | JWT | *None* | Returns receiver requests, document status, and matched donor counts |

### 7. Emergency Blood Requests (`/api/requests`)

| Method | Endpoint | Access | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/api/requests` | JWT | `{ patient_name, blood_group, units_needed, hospital_name, city, urgency }` | Submit emergency blood requisition |
| `GET` | `/api/requests/my` | JWT | *None* | Retrieve list of requests created by current user |
| `GET` | `/api/requests/:id` | JWT | *None* | Retrieve single request with matched donor response counts |

### 8. Doctor Verification Queue (`/api/doctor`)

*Requires approved physician role (`requireDoctorApproved`).*

| Method | Endpoint | Request Body | Description |
|---|---|---|---|
| `GET` | `/api/doctor/donors` | *None* | List all registered donors with clinical cooldown status |
| `GET` | `/api/doctor/receivers` | *None* | List all registered receivers and active requests |
| `GET` | `/api/doctor/requests` | *None* | List all hospital blood requisitions for clinical triage |
| `GET` | `/api/doctor/profile/:userId`| *None* | Retrieve full person record with attached document files |
| `POST` | `/api/doctor/verify-document` | `{ document_id, status, rejection_reason }` | Clinically approve or reject identity/requisition document |
| `POST` | `/api/doctor/verify-donation-date`| `{ donor_id, status, rejection_reason }` | Clinically approve or reject last donation date |
| `POST` | `/api/doctor/verify-request` | `{ request_id, status, rejection_reason, doctor_notes }` | Approve requisition & trigger automatic RBC match broadcast |

### 9. Platform Administration (`/api/admin`)

*Strictly restricted to Admin role (`requireRole(['admin'])`).*

| Method | Endpoint | Request Body | Description |
|---|---|---|---|
| `GET` | `/api/admin/doctors` | *Query `?status=`* | List all doctor accounts with license and hospital info |
| `GET` | `/api/admin/doctors/:id` | *None* | Full doctor profile with uploaded medical license document |
| `POST` | `/api/admin/approve-doctor/:id` | *None* | Approve doctor license and activate verification queue |
| `POST` | `/api/admin/reject-doctor/:id` | `{ rejection_reason }` | Reject doctor registration with mandatory reason |
| `DELETE` | `/api/admin/doctors/:id` | `{ reason }` | Irreversibly delete doctor account and associated records |
| `GET` | `/api/admin/users` | *None* | List all registered donors and receivers with profile info |
| `GET` | `/api/admin/users/:id` | *None* | Full profile of donor/receiver including clinical history |
| `DELETE` | `/api/admin/users/:id` | `{ reason }` | Irreversibly delete donor/receiver account with cascade |
| `GET` | `/api/admin/hospitals` | *None* | Retrieve all affiliated healthcare institutions |
| `POST` | `/api/admin/hospitals` | `{ name, city, state, address, contact_phone }` | Register new hospital into registration directory |

---

## Database Architecture

LifeLink utilizes a relational PostgreSQL schema designed for integrity and cascading cleanups.

```mermaid
erDiagram
    users ||--o| doctor_profiles : "has"
    users ||--o| donor_profiles : "has"
    users ||--o{ documents : "owns"
    users ||--o{ blood_requests : "requests"
    blood_requests ||--o{ request_matches : "generates"
    users ||--o{ request_matches : "matched to"

    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR role
        VARCHAR full_name
        VARCHAR phone
        INTEGER age
        VARCHAR gender
        VARCHAR blood_group
        VARCHAR city
        VARCHAR status
        BOOLEAN onboarding_completed
        TIMESTAMP created_at
    }

    doctor_profiles {
        UUID id PK
        UUID user_id FK
        VARCHAR medical_license_number UK
        VARCHAR hospital_name
        VARCHAR hospital_city
        VARCHAR approval_status
        TEXT rejection_reason
        TIMESTAMP reviewed_at
    }

    donor_profiles {
        UUID id PK
        UUID user_id FK
        DATE last_donation_date
        VARCHAR last_donation_date_status
        TEXT last_donation_rejection_reason
        BOOLEAN is_available
        BOOLEAN is_verified
    }

    documents {
        UUID id PK
        UUID user_id FK
        VARCHAR doc_type
        VARCHAR file_name
        VARCHAR original_name
        VARCHAR mime_type
        INTEGER file_size
        TEXT storage_path
        VARCHAR status
        TEXT rejection_reason
    }

    blood_requests {
        UUID id PK
        UUID requester_id FK
        VARCHAR patient_name
        VARCHAR blood_group
        INTEGER units_needed
        VARCHAR hospital_name
        VARCHAR city
        VARCHAR urgency
        VARCHAR status
        TEXT doctor_notes
        TIMESTAMP fulfilled_at
    }

    request_matches {
        UUID id PK
        UUID request_id FK
        UUID donor_id FK
        VARCHAR status
        TIMESTAMP notified_at
        TIMESTAMP responded_at
    }

    hospitals {
        UUID id PK
        VARCHAR name UK
        VARCHAR city
        VARCHAR state
        TEXT address
        VARCHAR contact_phone
        TIMESTAMP created_at
    }
```

### Automatic Migration & Seeding
When the backend boots (`server/src/index.js`), it invokes `initDatabase()` which automatically reads `server/src/db/schema.sql` and creates all 7 tables and indexes if they do not exist. It then invokes `runSeed()` which safely synchronizes all demo accounts and hospitals. Zero manual SQL migration steps are required.

---

## Clinical & Security Protocols

1. **Doctor-First Gating**: A doctor registration remains in `pending` status until an Admin reviews their medical license and explicitly approves the account. Unapproved doctors cannot access any patient data.
2. **Strict Cooldown Enforcement**: A donor's cooldown status is calculated using:
   $$\text{Days Remaining} = 90 - (\text{Current Date} - \text{Doctor-Verified Donation Date})$$
   Self-reported donation dates without physician review remain non-eligible.
3. **No Unsolicited Donor Contact**: Donor phone numbers are masked and revealed only when the donor accepts an emergency alert.
4. **Protected File Storage**: Files uploaded to `server/uploads/private/` are never exposed through static web servers. Access requires session authorization through `/api/documents/:id/view`.
5. **Bidirectional Role Capability**: Donors whose family members experience an emergency can create blood requests; receivers can volunteer as blood donors once medically stable.

---

## Default Demo Credentials

All seeded test accounts use the synchronized password configured in `DEMO_PASSWORD` (`Password123!`).

### Platform Administrator
| Role | Full Name | Email Address | Password |
|---|---|---|---|
| **ADMIN** | System Administrator | `admin@lifelink.org` | `Password123!` |

### Verified Hospital Doctors
| Hospital Affiliation | Doctor Name | Email Address | Password |
|---|---|---|---|
| Lilavati Hospital & Research Centre, Mumbai | Dr. Rajesh Sharma, MD | `doctor@hospital.org` | `Password123!` |
| Kokilaben Dhirubhai Ambani Hospital, Mumbai | Dr. Priya Kulkarni, MS | `dr.priya.kulkarni@hospital.org` | `Password123!` |
| Ruby Hall Clinic, Pune | Dr. Vikramaditya Shinde, MD | `dr.vikram.shinde@hospital.org` | `Password123!` |
| Tata Memorial Hospital, Mumbai | Dr. Anjali Deshmukh, MD | `dr.anjali.deshmukh@hospital.org` | `Password123!` |
| Deenanath Mangeshkar Hospital, Pune | Dr. Suresh Joshi, MD | `dr.suresh.joshi@hospital.org` | `Password123!` |

### Sample Blood Donors & Receivers
| Role | Name | Email Address | Blood Group | Status |
|---|---|---|---|---|
| **DONOR** | Aarav Patil | `donor@example.com` | $O^-$ | Verified (Eligible) |
| **DONOR** | Rohan Kulkarni | `rohan.kulkarni@example.com` | $O^-$ | Verified (Eligible) |
| **DONOR** | Aditya Deshmukh | `aditya.deshmukh@example.com` | $A^+$ | Verified (Eligible) |
| **DONOR** | Nikhil Shinde | `nikhil.shinde@example.com` | $B^+$ | Verified (Cooldown Active) |
| **RECEIVER** | Priya Deshmukh | `receiver@example.com` | $B^+$ | Verified (Requisition Active) |
| **RECEIVER** | Neha Kulkarni | `neha.kulkarni@example.com` | $O^-$ | Verified (Requisition Active) |

*(For the complete list of all 26 seeded donors, receivers, and doctors, refer to [DEMO_CREDENTIALS.txt](DEMO_CREDENTIALS.txt)).*

---

## Screenshots & UI Showcase

Below are actual production screenshots highlighting key user interfaces, administrative tools, clinical modals, and mobile responsive layouts.

### 1. Platform Administration Portal (User Directory)
Comprehensive user management interface displaying registered blood donors and emergency receivers with live KPI metrics, status filters, and administrative action triggers.

![Admin Portal — Registered Users Directory](screenshots/admin_dashboard_users.png)

- **3-Module Tab Navigation**: Rapid switching between **1. Doctor Section**, **2. User Section**, and **3. Hospital Section**.
- **Real-Time KPI Counters**: Immediate count of *All Users*, *Donors*, and *Receivers*.
- **Quick Sub-Filters**: Filter users by *All*, *Donors*, *Receivers*, *Verified*, or *Pending* status.
- **Action Triggers**: One-click access to **View Profile** (opening full clinical details) and **Delete User** (with mandatory reason dialog).

---

### 2. Full User Profile & Document Inspection Modal
Detailed modal view accessible by Platform Admins and Licensed Doctors to inspect personal details, clinical donation history, and uploaded government credentials.

![User Profile & Clinical Document Review Modal](screenshots/user_profile_modal.png)

- **Personal Profile**: Displays full name, email, contact phone, age, gender, blood group, and registration timestamp.
- **Clinical Donor Status**: Real-time verification badge, active donation availability indicator, and doctor-verified last donation date.
- **Verification Documents**: In-app listing of uploaded identity proofs (Aadhaar/PAN/Voter ID) and medical requisitions with inline verification badges and preview buttons.
- **Safety Controls**: Admin can review credentials or trigger irreversible user deletion with an audit reason.

---

### 3. Emergency Blood Request Lifecycle & Live Progress Timeline
Real-time tracking interface displayed on the Receiver Dashboard showing clinical progression from initial submission to physician verification and donor matching.

![Live Emergency Blood Requisition Timeline](screenshots/blood_request_timeline.png)

- **3-Stage Clinical Timeline**:
  1. **1. Submitted**: Government ID and medical prescription uploaded by attendant.
  2. **2. Doctor Verified**: Licensed physician has clinically verified the requisition and authorized donor broadcast.
  3. **3. Fulfilled**: Final state indicating blood units have been collected and transfused on-site at the hospital.
- **Live Match Counters**: Real-time counter displaying verified donors notified and volunteer acceptances (e.g., `Matched verified donors notified: 10 • Accepted: 2`).
- **Urgency Indicator**: Prominently highlights requisition urgency level (`CRITICAL`, `URGENT`, or `PLANNED`).

---

### 4. Mobile-First Responsive Experience
Optimized mobile interface delivering touch-friendly navigation, bottom-sheet dialogs, and clear clinical protocol guidance on handheld devices.

<p align="center">
  <img src="screenshots/mobile_receiver_dashboard.jpg" alt="Mobile Receiver Dashboard & Verification Protocol" width="360" />
</p>

- **Touch-Friendly Controls**: Full-width action buttons for creating emergency requests or volunteering to donate.
- **Doctor Verification Protocol**: Visible clinical disclaimer explaining review stages (*Pending*, *Verified*, *Fulfilled*) to prevent panic and hoarders.
- **Mobile Bottom-Sheet Modals**: Modals dock smoothly from the bottom on small viewports with full touch support.
- **Horizontal Scrolling Tables**: Wide data grids scroll horizontally with native inertia without squeezing column content.

---

## Production Deployment

LifeLink is architected for continuous cloud deployment across **Neon**, **Render**, and **Vercel**.

```mermaid
flowchart LR
    A["Browser Client"] -->|"HTTPS / React SPA"| B["Vercel Frontend"]
    B -->|"REST API / CORS"| C["Render Backend (Node.js)"]
    C -->|"SSL Connection Pool"| D["Neon Serverless PostgreSQL"]
    C -->|"Private Disk"| E["server/uploads/private/"]
```

### 1. Database Deployment on Neon
1. Create a project on [Neon Console](https://console.neon.tech).
2. Copy your pooled connection string with `?sslmode=require`:
   ```
   postgresql://<user>:<password>@<endpoint-pooler>.neon.tech/<dbname>?sslmode=require
   ```
3. *No manual SQL setup is needed.* The application automatically runs schema initialization and demo seeding on first boot.

### 2. Backend Deployment on Render
1. Create a new **Web Service** on [Render](https://dashboard.render.com) and link your GitHub repository.
2. Set configuration:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
3. Configure environment variables in the Render dashboard:
   ```env
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your_generated_production_jwt_secret_key
   DATABASE_URL=postgresql://<user>:<password>@<endpoint-pooler>.neon.tech/<dbname>?sslmode=require
   DEMO_PASSWORD=Password123!
   ```
4. Deploy the service and copy the live URL (e.g., `https://lifelink-backend.onrender.com`).

### 3. Frontend Deployment on Vercel
1. Create a new **Project** on [Vercel](https://vercel.com) and import the repository.
2. Set configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the environment variable:
   ```env
   VITE_API_URL=https://lifelink-backend.onrender.com
   ```
4. Deploy. The pre-configured `client/vercel.json` rewrite rules ensure that all client-side routes (e.g. `/admin`, `/doctor/dashboard`) route seamlessly on browser refresh.

---

## Troubleshooting

### 1. Database Connection Timeout or SSL Warning
- **Symptom**: `⚠️ NeonDB connection failed, falling back to local memory engine`.
- **Cause**: The connection string is missing `?sslmode=require` or network access is restricted.
- **Solution**: Ensure your connection URI in `DATABASE_URL` ends with `?sslmode=require`. The server automatically falls back to its in-memory engine so development is never blocked.

### 2. Client Routing 404 on Refresh in Production
- **Symptom**: Refreshing `/doctor/dashboard` or `/onboarding/donor` on Vercel returns 404.
- **Cause**: Client-side single page applications need server rewrites to route non-file requests to `index.html`.
- **Solution**: Ensure `client/vercel.json` contains:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

### 3. CORS Error Between Vercel and Render
- **Symptom**: `Access to fetch at ... from origin ... has been blocked by CORS policy`.
- **Cause**: Backend origin header rejection.
- **Solution**: The backend `server/src/app.js` is pre-configured with `cors({ origin: true, credentials: true })`. Ensure `VITE_API_URL` on Vercel matches your Render URL without a trailing slash.

### 4. Uploaded Document Shows 404 on Preview
- **Symptom**: Document thumbnail fails to load in previewer.
- **Cause**: File was created in a transient container that was redeployed.
- **Solution**: `server/src/routes/documentRoutes.js` includes an automatic clinical fallback that safely streams `sample-document.jpg` if sample demo files are absent on disk.

### 5. iOS Mobile Zooming on Input Focus
- **Symptom**: Safari on iPhone zooms into form fields when tapping inputs.
- **Cause**: iOS Safari triggers auto-zoom on inputs with font sizes below 16px.
- **Solution**: Already solved in `client/src/index.css` via media query enforcing `font-size: 16px !important` on screens $\le 480\text{px}$.

---