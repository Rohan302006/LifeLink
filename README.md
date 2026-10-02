# LifeLink — Doctor-Supervised Blood & Organ Donation Coordination Platform

LifeLink is a production-grade, doctor-supervised emergency coordination web platform designed to solve acute hospital blood bank deficits and facilitate guided organ pledge awareness.

> **CRITICAL REGULATORY & CLINICAL POSITIONING**
> LifeLink is a **VERIFIED COORDINATION PLATFORM**. It is **NOT** a medical decision-making system and **NOT** an organ-allocation authority.
> - **Clinical Donor Screening**: Platform interval calculations are preliminary logistical pre-screens. Final donor screening, vitals, hemoglobin level, and serological crossmatching are **always conducted on-site by a licensed hospital physician**.
> - **Organ Allocation**: Official waiting lists, patient ranking, and deceased donor organ allocations in India belong strictly to statutory authorities (**NOTTO / ROTTO / SOTTO**) under the Transplantation of Human Organs and Tissues Act (THOTA). LifeLink provides awareness, guided intent pledging (Form 7), next-of-kin witness records, and transplant coordinator counseling logs, linking out directly to NOTTO.
> - **Central Blood Bank Stock**: Real-time centralized blood bank stock levels are maintained on the Government of India portal **e-RaktKosh**. LifeLink activates specifically for emergency donor-to-patient matching when blood bank stocks are depleted.
> - **Data Privacy**: Aligned with India's **Digital Personal Data Protection (DPDP) Act 2023** principles. Donor phone numbers and exact GPS coordinates remain strictly hidden until voluntary acceptance of an emergency match.

> [!IMPORTANT]
> **Demo & Development Status Notice**:
> - **OTP Verification Under Processing**: The production SMS gateway OTP verification is currently under processing. For the demo, the generated OTP code is kept visible directly on the UI (with auto-fill / preview code) so anyone can test registration and login frictionlessly.
> - **Known Glitches Notice**: Due to strict hackathon time limits and rapid end-to-end development, the application currently contains some minor glitches and edge cases. These are actively being ironed out and will be fixed soon.

---

## 1. Technology Stack

- **Frontend**:
  - **Framework**: React 18 (SPA) via Vite
  - **Routing**: React Router DOM (v6)
  - **Styling**: Tailwind CSS (calm clinical palette: deep medical crimson, slate neutrals, accessible contrast)
  - **Icons**: Lucide React
  - **Mapping Engine**: Leaflet (v1.9) + OpenStreetMap tiles (100% free, no paid API keys required)
  - **Voice Intake**: Native Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Backend**:
  - **Runtime**: Node.js (v18+ / v24+)
  - **Framework**: Express 4 with modular ES Modules (`import`/`export`) and TypeScript (via `tsx`)
  - **Security**: `bcryptjs` (password hashing), `jsonwebtoken` (JWT bearer auth), CORS policy
  - **Rate Limiting**: Sliding-window in-memory rate limiters for OTP and emergency request creation
- **Database & Persistence**:
  - **Production Target**: PostgreSQL / NeonDB with full schema migrations, composite indexes, and Row Level Security (RLS) policies
  - **Development / Offline Engine**: Built-in zero-friction in-memory storage engine executing identical relational operations, auto-initialized with realistic seed data
- **AI Integration**:
  - **Provider**: Google Gemini API (`gemini-1.5-flash`) behind a strict server-side wrapper
  - **Safety**: Hardcoded system guardrails strictly preventing diagnosis and definitive clinical eligibility decisions

---

## 2. Users and Roles (Role-Based Access Control)

The platform enforces strict Least-Privilege Role-Based Access Control (RBAC):

| Role | Responsibilities & Access Permissions |
|---|---|
| **Requester (Patient or Attendant)** | - Creates emergency blood/component requests with patient details, hospital, blood group, component, units, and urgency.<br>- Uses AI free-text/voice intake to draft requests.<br>- Monitors real-time status timeline (Pending → Verified → Broadcast → Fulfilled).<br>- Views matched donors with phone numbers locked until donor acceptance.<br>- Receives direct contact phone unlock upon voluntary donor acceptance. |
| **Donor (Volunteer)** | - Registers with blood group, city locality, last donation date, and DPDP consent.<br>- Toggles live emergency availability (`Active` vs `Paused`).<br>- Views interval eligibility cooldown timer (e.g. 90-day whole blood recovery).<br>- Receives location-matched emergency alerts (~1.2 km away).<br>- Accepts or declines emergency requests. Accepting mutually unlocks direct contact info. |
| **Doctor / Hospital Verifier** | - Accesses the **Doctor Verification Queue** for affiliated hospital.<br>- Reviews clinical crossmatch forms, admission bed tags, and medical indications.<br>- Approves requests to trigger donor broadcast, or rejects requests with clinical reasoning.<br>- Performs on-site physical donor screening.<br>- Logs completed donations on-site, updating the donor's cooldown interval and marking requests fulfilled. |
| **Platform Admin** | - Monitors system-wide impact metrics (fulfillment rate, average coordination response time, active donor pool).<br>- Configures hospital medical interval gap policies (custom whole blood, plasma, platelet recovery days).<br>- Inspects tamper-evident DPDP compliance and medical verification audit logs. |

---

## 3. Key Features & Business Logic

### 3.1 Primary Blood Flow (Doctor-Supervised)
1. **Mandatory Doctor Verification Queue**:
   - Requesters can register emergency requisitions, but **unverified requests are strictly never broadcast to donors**.
   - Hospital physicians review clinical indications to eliminate hoax alarms and social media panics.
2. **Duplicate Request Detection**:
   - The API checks if an active request (`pending` or `verified`) exists for the same `patient_name`, `hospital_id`, and `blood_group` within the last 24 hours. Duplicate submissions are rejected with a link to the existing active record.
3. **Blood Group Compatibility Matrix**:
   - The matching engine enforces strict hematological rules across components:
     - **Red Blood Cells / Whole Blood**:
       - `O-`: Universal donor (can donate to all groups)
       - `O+`: Donates to O+, A+, B+, AB+
       - `A-`: Donates to A-, A+, AB-, AB+
       - `A+`: Donates to A+, AB+
       - `B-`: Donates to B-, B+, AB-, AB+
       - `B+`: Donates to B+, AB+
       - `AB-`: Donates to AB-, AB+
       - `AB+`: Universal recipient (can receive from all groups)
     - **Platelets & Plasma**:
       - Implements reverse agglutination compatibility (AB is the universal plasma donor).
4. **Configurable Eligibility Cooldown Engine**:
   - Computes calendar interval days since the donor's `last_donation_date`.
   - Thresholds are configurable per hospital policy (default: 90 days for Whole Blood, 14 days for Plasma, 7 days for Platelets).
   - Generates status labels: *"Eligible by interval (pending doctor screening)"* or *"Cooldown active (X days remaining)"*.
5. **Emergency Escalation Worker**:
   - A background worker monitors critical emergency requests. If no compatible donor accepts within 30 minutes, it automatically widens the search radius from 25 km to 50 km and alerts the hospital coordinator and admin.

### 3.2 Strict Privacy-by-Design (DPDP Act 2023)
- When donors are matched and requests are broadcast:
  - `donor.phone` is serialized as `null` or masked (`🔒 Locked until accepted`).
  - Exact coordinates (`lat`, `lng`) are replaced with approximate neighborhood area descriptions (e.g. *"Bandra West (~1.2 km away)"*).
- **Mutual Contact Reveal**: Direct phone numbers and route navigation pins are unlocked **only after the donor explicitly clicks "Accept Emergency Request"**.
- **Right to Erasure / Consent Withdrawal**: Donors can withdraw their consent at any time via the footer, which anonymizes their personal data and deactivates matching records.

### 3.3 Organ Donation Awareness & Guided Pledging
- Plain-English educational guide explaining brain-stem death determination, the 4-doctor certification panel, and why next-of-kin legal consent is mandatory in India.
- **Pledge Intent Form**: Captures donor organ preferences (Corneas, Kidneys, Liver, Heart, Lungs, Pancreas) and creates a verified **Next-of-Kin Witness Record**.
- **Transplant Coordinator Log**: Allows hospital coordinators to document family counseling sessions and NOTTO nodal communications without any recipient matching or allocation functionality.
- Direct statutory links to the official **NOTTO National Registry**.

---

## 4. Map Integration (Leaflet + OpenStreetMap)

LifeLink utilizes **Leaflet.js** integrated with **OpenStreetMap** raster tiles:
- **Zero Paid Dependencies**: Requires no Google Maps API keys or billing configurations.
- **Hospital Markers**: Verified hospital locations rendered with medical facility pins.
- **Privacy-Safe Approximate Circles**: Before match acceptance, nearby donors are represented as generalized blue circular radius zones (~800 m radius over neighborhood localities) to safeguard exact residential addresses.
- **Unlocked Direct Route Pin**: Once a donor accepts an emergency match, the exact donor pin is unlocked on the map for route coordination.

---

## 5. AI Subsystem (Gemini API Server-Side Wrapper)

LifeLink includes an AI assistant integrated exclusively behind server-side Express routes (`/api/ai/intake` and `/api/ai/faq`):

### 5.1 Strict Medical Safety Guardrails
Both the prompt engineering and fallback engine enforce strict clinical boundaries:
- **No Medical Diagnosis**: The AI is forbidden from evaluating symptoms, diagnosing diseases, or recommending treatments.
- **No Eligibility Determinations**: The AI never declares a user medically eligible or ineligible to donate; it explains standard guidelines and instructs the user that on-site physician screening is mandatory.
- **Mandatory Disclaimers**: Every response appends the official LifeLink statutory disclaimer.

### 5.2 Emergency Voice & Free-Text Intake (`/api/ai/intake`)
- Users or attendants can speak or paste an unstructured emergency description (e.g., *"Urgent! 2 units O negative blood needed for Suresh Deshmukh at Lilavati Hospital Mumbai immediately for bypass surgery"*).
- The AI parses the text into structured JSON:
  - `patient_name`: "Suresh Deshmukh"
  - `blood_group`: "O-"
  - `component`: "whole_blood"
  - `units_needed`: 2
  - `hospital_name`: "Lilavati Hospital & Research Centre"
  - `urgency`: "critical_immediate"
- The structured draft is presented to the user for human confirmation before populating the request form, which still requires attending doctor verification.

### 5.3 Multilingual FAQ Assistant (`/api/ai/faq`)
- Fully supports three languages with instant UI switching:
  - **English (EN)**
  - **Hindi (हिन्दी - HI)**
  - **Marathi (मराठी - MR)**
- Provides answers to common queries regarding donation intervals, plateletpheresis, NOTTO organ pledge processes, and e-RaktKosh central stock checks.
- Includes an intelligent offline fallback engine so all queries return localized answers even when running without an internet connection or Gemini API key.

### 5.4 Voice Search & Dictation
- Integrated with the browser's native **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`).
- Users can click the microphone icon in the AI Assistant or Emergency Intake modal to dictate questions or emergency requisitions in real time.

---

## 6. Authentication & Security

- **Dual-Mode Login**:
  - **Email + Password**: Hashed with `bcryptjs` (salt rounds: 10).
  - **OTP Login**: Mobile number OTP login powered by an adapter pattern. *(Note: Full SMS gateway verification is currently under processing, so for the demo the generated OTP is kept visible directly on the UI for easy evaluation; pluggable for Twilio, Gupshup, or AWS SNS).*
- **Session Management**: Stateless JSON Web Tokens (JWT) signed with `JWT_SECRET`, transmitted via standard `Authorization: Bearer <token>` headers.
- **Password Recovery**: Secure forgot-password flow dispatching single-use verification codes.
- **Rate Limiting**: Sliding-window rate limiters prevent brute-force attacks on OTP endpoints (max 5 requests/min) and request creation (max 10 requests/5 min).
- **Zero PHI Logging**: Personal health information and contact numbers are never logged to console outputs.

---

## 7. Database Schema & Row Level Security (RLS)

The complete SQL schema is defined in [`server/src/db/schema.sql`](file:///e:/Olympus2K26/server/src/db/schema.sql) and is fully compatible with **PostgreSQL** and **NeonDB**:

### Tables
1. `users`: Core account profiles, role enums, hashed passwords, phone verification flags.
2. `hospitals`: Verified hospital registry, registration numbers, GPS coordinates, emergency contacts.
3. `doctors`: Hospital-affiliated verifiers, state medical council license numbers, specializations.
4. `donors`: Blood group, locality, coordinates, last donation date, availability status, DPDP consent.
5. `blood_requests`: Patient name, hospital, blood group, component, units, urgency, status (`pending`, `verified`, `rejected`, `fulfilled`, `expired`), doctor notes.
6. `request_matches`: Junction table recording donor notifications, distance in km, status (`notified`, `accepted`, `declined`), response timestamps.
7. `donations`: Verified phlebotomy records logged by doctors, units collected, notes.
8. `organ_pledges`: Pledge intention records, organs selected, next-of-kin details, consent timestamps.
9. `coordinator_logs`: Hospital transplant counseling records, family members present, outcome notes.
10. `notifications`: In-app notification queue and dispatch history.
11. `audit_logs`: Immutable security audit trail recording user actions, IP addresses, resource IDs.
12. `hospital_policies`: Configurable cooldown rules (gap days for whole blood, plasma, platelets, escalation timeout).

### Row Level Security (RLS) Policies
- All tables have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- **Users**: Users can view and modify only their own profile; admins can inspect all accounts.
- **Donors**: Public/anonymous queries cannot read `phone` or exact coordinates. Contact numbers are unlocked only when an accepted match record exists.
- **Blood Requests**: Requesters manage their own requests; hospital doctors can view pending requests for their facility; donors can view only `status = 'verified'` requests.
- **Audit Logs**: Insert-only for application services; read-only for system administrators.

---

## 8. Project Directory Structure

```
Olympus2K26/
├── client/                             # React 18 (Vite) Frontend Application
│   ├── public/                         # Static assets and icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/
│   │   │   │   ├── AiAssistantModal.tsx    # Multilingual FAQ voice/text assistant
│   │   │   │   └── EmergencyIntakeModal.tsx # Natural language to structured draft modal
│   │   │   ├── common/
│   │   │   │   └── StatusTimeline.tsx      # Medical lifecycle status timeline
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx              # Navigation bar with role switcher & disclaimers
│   │   │   │   └── Footer.tsx              # Statutory disclaimers, NOTTO links, DPDP withdrawal
│   │   │   └── maps/
│   │   │       └── LeafletMap.tsx          # Leaflet map with privacy radius & hospital pins
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx             # Authentication, JWT, and persona switcher context
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.tsx      # Impact dashboard, policy editor, audit logs
│   │   │   ├── doctor/
│   │   │   │   ├── DoctorQueue.tsx         # Doctor verification queue & approval modal
│   │   │   │   └── LogDonation.tsx         # On-site phlebotomy logging & cooldown reset
│   │   │   ├── donor/
│   │   │   │   └── DonorDashboard.tsx      # Availability toggle, cooldown timer, match alerts
│   │   │   ├── organ/
│   │   │   │   ├── CoordinatorLog.tsx      # Transplant coordinator family counseling log
│   │   │   │   └── OrganPledgeGuide.tsx    # Plain-English guide & Form 7 intent pledge
│   │   │   ├── requester/
│   │   │   │   ├── CreateRequest.tsx       # Emergency blood request form with duplicate check
│   │   │   │   ├── RequestDetail.tsx       # Live status timeline, map, privacy contact unlock
│   │   │   │   └── RequestsList.tsx        # Filterable requests feed
│   │   │   ├── Home.tsx                    # Emergency-first landing page (2 big actions)
│   │   │   ├── Login.tsx                   # Email/Password + OTP login & password recovery
│   │   │   └── Register.tsx                # Role-specific registration with DPDP consent
│   │   ├── services/
│   │   │   └── api.ts                      # Centralized API client with JWT attachment
│   │   ├── types/
│   │   │   └── index.ts                    # TypeScript data models and interfaces
│   │   ├── App.tsx                         # Client route configuration
│   │   ├── index.css                       # Tailwind CSS directives & clinical styles
│   │   └── main.tsx                        # React application bootstrap
│   ├── index.html                          # HTML template with Google Fonts (Inter)
│   ├── package.json
│   ├── tailwind.config.js                  # Clinical color system configuration
│   ├── tsconfig.json
│   └── vite.config.ts                      # Vite configuration with API proxy
│
├── server/                             # Node.js + Express Backend Application
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts                      # Environment variable loader
│   │   ├── db/
│   │   │   ├── database.ts                 # Dual-mode DB adapter (Postgres/NeonDB + InMemory SQL)
│   │   │   └── schema.sql                  # Complete PostgreSQL schema with RLS & indexes
│   │   ├── middleware/
│   │   │   ├── auth.ts                     # JWT authentication & RBAC middleware
│   │   │   └── rateLimiter.ts              # Sliding-window rate limiters
│   │   ├── routes/
│   │   │   ├── adminRoutes.ts              # Impact metrics, policy updates, audit logs
│   │   │   ├── aiRoutes.ts                 # Gemini emergency intake & FAQ endpoints
│   │   │   ├── authRoutes.ts               # Registration, login, OTP, password reset, DPDP
│   │   │   ├── bloodRequestRoutes.ts       # Request creation, duplicate check, doctor verify
│   │   │   ├── donationRoutes.ts           # Doctor donation verification & cooldown reset
│   │   │   ├── donorRoutes.ts              # Profile, availability toggle, match accept/decline
│   │   │   └── organRoutes.ts              # Pledge intent, next-of-kin alerts, coordinator logs
│   │   ├── seeds/
│   │   │   ├── seed.ts                     # Standalone database seed runner
│   │   │   └── seedData.ts                 # 50 geocoded donors, 3 hospitals, 2 doctors, 5 requests
│   │   ├── services/
│   │   │   ├── bloodCompatibility.ts       # Hematological compatibility tables (RBC / Plasma)
│   │   │   ├── eligibilityService.ts       # Mathematical interval calculation engine
│   │   │   ├── emailAdapter.ts             # Email notification & event dispatcher
│   │   │   ├── escalationWorker.ts         # Background escalation scheduler (radius widener)
│   │   │   ├── geminiService.ts            # Server-side Gemini API wrapper with guardrails
│   │   │   ├── matchingService.ts          # Haversine distance matching with privacy filter
│   │   │   └── otpAdapter.ts               # Pluggable OTP adapter with preview code
│   │   ├── tests/
│   │   │   ├── eligibility.test.ts         # Unit tests: Cooldown interval calculations
│   │   │   ├── matching.test.ts            # Unit tests: Compatibility matrix & Haversine distance
│   │   │   └── privacy.test.ts             # Unit tests: Pre-acceptance contact masking rules
│   │   ├── app.ts                          # Express application setup & middleware
│   │   └── index.ts                        # Server entry point & escalation worker startup
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example                        # Template for environment variables
├── package.json                        # Root package.json for workspace orchestration
└── README.md                           # Project documentation
```

---

## 9. Setup and How to Run Locally

###  9.1 Prerequisites
- **Node.js**: v18.0.0 or higher (v24 supported)
- **npm**: v9.0.0 or higher

### 9.2 Installation
Clone or navigate to the project directory:

```bash
# 1. Install Backend Dependencies
cd server
npm install

# 2. Install Frontend Dependencies
cd ../client
npm install
```

### 9.3 Environment Configuration
Create a `.env` file in the `server` directory (or use `.env.example` as a template):

```bash
cp .env.example server/.env
```

Default configuration variables:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=lifelink-hackathon-super-secret-key-2026

# Optional: NeonDB PostgreSQL connection string
# Leave blank to use the high-speed built-in local database engine (zero cloud setup required)
DATABASE_URL=

# Optional: Google Gemini API Key for live AI Assistant & voice intake
# If left blank, the intelligent local rule-based assistant & multilingual fallbacks activate automatically
GEMINI_API_KEY=

# OTP Provider ('mock' or 'twilio')
OTP_PROVIDER=mock
```

### 9.4 Running Backend & Frontend

Start both services using two terminal tabs:

**Terminal 1 (Backend API Server)**:
```bash
cd server
npm run dev
```
*Backend initializes on `http://localhost:5000` with the background escalation worker running.*

**Terminal 2 (Frontend Client)**:
```bash
cd client
npm run dev
```
*Frontend opens on `http://localhost:5173` with automated API proxying to port 5000.*

Open your browser and visit: **http://localhost:5173**

---

## 10. Automated Test Suite

Run the automated test suite verifying blood compatibility, configurable interval calculation, and strict privacy masking:

```bash
cd server
npm test
```

### Verified Test Coverage
```
▶ Donor Eligibility Interval Tests
  ✔ First-time donor (null last_donation_date) is marked eligible by interval
  ✔ Donor who donated 100 days ago is eligible under 90-day whole blood policy
  ✔ Donor who donated 30 days ago is in cooldown under 90-day whole blood policy
  ✔ Configurable policy works properly for Platelets (7 days) and Plasma (14 days)
✔ Donor Eligibility Interval Tests (4/4 passed)

▶ Blood Compatibility & Matching Tests
  ✔ O- is universal red blood cell donor
  ✔ AB+ can receive whole blood / RBC from all blood groups
  ✔ Incompatible blood groups are strictly rejected
  ✔ Plasma compatibility adheres to reverse agglutination rules
  ✔ Haversine distance calculation is accurate within metro scale
✔ Blood Compatibility & Matching Tests (5/5 passed)

▶ Strict Privacy-by-Design Tests
  ✔ Privacy Rule 1: findNearbyCompatibleDonors ALWAYS redacts phone and exact GPS coordinates
  ✔ Privacy Rule 2: sanitizeDonorPrivacy masks contact when match status is "notified" or "declined"
  ✔ Privacy Rule 3: sanitizeDonorPrivacy reveals contact ONLY after explicit acceptance by donor
✔ Strict Privacy-by-Design Tests (3/3 passed)

ℹ Total: 12 passed | 0 failed
```

---

## 11. Pre-Seeded Realistic Metro Dataset

The database initializes with realistic seed data across the Mumbai metropolitan area:
- **50 Geolocated Donors**: Distributed across Bandra West, Khar, Parel, Dadar, Andheri, and Colaba covering all blood groups (`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`) with varying donation history dates.
- **3 Major Verified Hospitals**:
  - *Lilavati Hospital & Research Centre* (Bandra West)
  - *Tata Memorial Hospital* (Parel)
  - *King Edward Memorial (KEM) Hospital* (Parel)
- **2 Attending Physicians**:
  - Dr. Ananya Sharma, MD (Lilavati Hospital)
  - Dr. Rajesh Mehta, FRCPath (Tata Memorial Hospital)
- **5 Blood Requests in Varied States**:
  - `req-001`: Suresh Deshmukh (O- Whole Blood, Verified, Lilavati Hospital)
  - `req-002`: Asha Mhatre (AB- Platelets, Pending Doctor Verification, Tata Memorial Hospital)
  - `req-003`: Rajesh Solanki (B+ Whole Blood, Verified Trauma, KEM Hospital)
  - `req-004`: Meena Kamat (A+ Plasma, Fulfilled, Lilavati Hospital)
  - `req-005`: Farhan Sayed (O+ Whole Blood, Expired, Tata Memorial Hospital)

### Pre-Configured Demo Credentials
All seeded users share the password: `LifeLink2026!`

| Persona | Name | Email | Role |
|---|---|---|---|
| **Patient Attendant** | Priya Deshmukh | `priya.attendant@gmail.com` | Requester |
| **Volunteer Donor (O-)** | Aarav Patil | `aarav.patil1@example.com` | Donor |
| **Attending Doctor** | Dr. Ananya Sharma, MD | `dr.ananya@lilavati.com` | Doctor |
| **Platform Administrator** | Dr. Vivek Rane | `admin@lifelink.org` | Admin |

> **Tip**: You can use the **Role Switcher** in the top navigation bar to switch between any of these personas with a single click.