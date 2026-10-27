# HotelPro — Hotel Booking & Management System

> **Enterprise-grade, full-stack MERN Hotel Booking and Management System built for seamless guest reservations, front-desk staff operations, and administrative governance.**

---

## 🏛️ Project Architecture & Documentation Index

The complete architectural blueprint is established and maintained as the Single Source of Truth (SSOT) across all development phases:

All architectural specifications reside in [`docs/architecture/`](file:///d:/My%20Final%20Projects/HotelPro/docs/architecture/):

| Document | Purpose & Description |
| :--- | :--- |
| **[SYSTEM_ARCHITECTURE.md](file:///d:/My%20Final%20Projects/HotelPro/docs/architecture/SYSTEM_ARCHITECTURE.md)** | Modular Monolith 6-tier architecture, component flows, technology stack, directory layout, and multi-tenant scaling strategy. |
| **[ER_DIAGRAM.md](file:///d:/My%20Final%20Projects/HotelPro/docs/architecture/ER_DIAGRAM.md)** | Corrected 14-entity Mermaid ER diagram, data dictionaries, compound indexes, dynamic date-range availability formula, and soft-delete policies. |
| **[USER_FLOWS.md](file:///d:/My%20Final%20Projects/HotelPro/docs/architecture/USER_FLOWS.md)** | End-to-end Mermaid state machines for Guest Registration, Booking Hold & Checkout, Cancellations & Refunds, Staff Operations, Admin Oversight, and Payment Verification. |
| **[RBAC_MATRIX.md](file:///d:/My%20Final%20Projects/HotelPro/docs/architecture/RBAC_MATRIX.md)** | Exhaustive role-permission matrix across Guest, Staff, and Admin roles, with server-side property isolation and ownership middleware. |
| **[API_ARCHITECTURE.md](file:///d:/My%20Final%20Projects/HotelPro/docs/architecture/API_ARCHITECTURE.md)** | Complete `/api/v1` RESTful API endpoint inventory with request schemas, responses, status codes, query filters, and error models. |
| **[ARCHITECTURE_DECISIONS.md](file:///d:/My%20Final%20Projects/HotelPro/docs/architecture/ARCHITECTURE_DECISIONS.md)** | Architecture Decision Records (ADR-001 through ADR-009) explaining trade-offs, security assessments, and framework selections. |
| **[SECURITY_ARCHITECTURE.md](file:///d:/My%20Final%20Projects/HotelPro/docs/architecture/SECURITY_ARCHITECTURE.md)** | STRIDE threat model, Zero-Card-Data retention (PCI-DSS compliance via Razorpay), HMAC signature verification, NoSQL injection mitigations, and audit logging. |
| **[IMPLEMENTATION_ROADMAP.md](file:///d:/My%20Final%20Projects/HotelPro/docs/architecture/IMPLEMENTATION_ROADMAP.md)** | 6-phase engineering plan defining dependencies, milestones, and testing exit criteria for Phases 1 through 6. |

---

## 🚀 Technology Stack

### Frontend (`Client/`)
- **Core:** React 19 (JSX), Vite v8
- **Navigation:** React Router v7 (`react-router-dom`)
- **HTTP Client:** Axios (configured with interceptors & credential support)
- **Styling:** Bootstrap 5.3 + Bespoke Luxury Hotel CSS Tokens (`variables.css`, `global.css`)
- **Notifications:** React Toastify (`react-toastify`)

### Backend (`Server/`)
- **Runtime:** Node.js (v24 LTS / LTS v20+)
- **Framework:** Express.js (v5.x / v4.x modular monolith)
- **Database Modeling:** Mongoose 9.x / 8.x
- **Security & Headers:** Helmet, CORS, Express-Rate-Limit, Cookie-Parser, Bcryptjs, JSONWebToken
- **Validation:** Zod / Express-Validator
- **Integrations:** Nodemailer (Transactional email), Multer (Memory-buffered file uploads), Razorpay SDK (Payments)
- **Development Engine:** Nodemon

---

## 📁 Repository Directory Structure

```text
HotelPro/
├── Client/                               # React Single Page Application (Vite)
│   ├── public/                           # Static assets, favicon
│   ├── src/
│   │   ├── assets/                       # Brand logos, placeholder graphics
│   │   ├── components/                   # Reusable UI primitives (Navbar, Footer, Modals)
│   │   ├── layouts/                      # Layout wrappers (MainLayout, StaffLayout, AdminLayout)
│   │   ├── pages/                        # Page views (HomePage, Rooms, Booking, Admin)
│   │   ├── features/                     # Feature domain modules
│   │   │   ├── auth/
│   │   │   ├── hotels/
│   │   │   ├── rooms/
│   │   │   ├── bookings/
│   │   │   ├── payments/
│   │   │   ├── staff/
│   │   │   └── admin/
│   │   ├── services/                     # Centralized Axios client & health check API
│   │   │   ├── api.js
│   │   │   └── healthApi.js
│   │   ├── hooks/                        # Custom React hooks (useAuth, useAvailability)
│   │   ├── routes/                       # React Router configuration (AppRoutes)
│   │   ├── utils/                        # Formatting utilities (currency, dates)
│   │   ├── styles/                       # Luxury design tokens and global styles
│   │   │   ├── variables.css
│   │   │   └── global.css
│   │   ├── App.jsx                       # Root component with ToastContainer & Router
│   │   └── main.jsx                      # Application entry point
│   ├── .env                              # Local runtime variables (git-ignored)
│   ├── .env.example                      # Template for client environment variables
│   ├── index.html                        # HTML entry point with metadata
│   ├── package.json                      # Client dependencies & scripts
│   └── vite.config.js                    # Vite bundler configuration
│
├── Server/                               # Express.js Modular Monolith Backend
│   ├── config/                           # Database, payment, and mailer configs
│   ├── models/                           # 14 Mongoose domain schemas
│   ├── controllers/                      # HTTP request & response handlers
│   ├── routes/                           # Versioned route declarations (/api/v1)
│   ├── services/                         # Business domain logic (availability, pricing, hold)
│   ├── middleware/                       # Auth, RBAC, tenant isolation, rate-limit, error handlers
│   ├── validators/                       # Input validation schemas
│   ├── integrations/                     # 3rd-party adapters
│   │   ├── payments/                     # Razorpay order & signature verification
│   │   ├── email/                        # Nodemailer transactional email templates
│   │   └── storage/                      # Cloudinary / S3 cloud storage
│   ├── utils/                            # Custom ApiError, response wrappers
│   ├── tests/                            # Automated test suites
│   ├── server.js                         # Application server entry point & health check
│   ├── .env                              # Local server environment configuration (git-ignored)
│   ├── .env.example                      # Template for server environment variables
│   └── package.json                      # Server dependencies & scripts
│
├── docs/                                 # Architectural specifications (SSOT)
│   └── architecture/
├── .gitignore                            # Root version control exclusions
└── README.md                             # Master project documentation entry point
```

---

## ⚡ Prerequisites

- **Node.js:** v20.x or higher (Node.js v24 LTS verified).
- **npm:** v10.x or higher (npm v11.x verified).
- **MongoDB:** MongoDB Community Server or MongoDB Atlas Replica Set (configured in Phase 4).

---

## 🛠️ Installation & Setup

### 1. Backend Installation
```bash
cd Server
npm install
```

### 2. Frontend Installation
```bash
cd Client
npm install
```

---

## 🔑 Environment Configuration

### Frontend Configuration (`Client/.env`)
Copy `Client/.env.example` to `Client/.env`:
```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
```
> **Security Notice:** Vite exposes variables prefixed with `VITE_` to the browser bundle. Never place database credentials, JWT secrets, or payment private keys in client environment variables.

### Backend Configuration (`Server/.env`)
Copy `Server/.env.example` to `Server/.env`:
```dotenv
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/hotelpro
JWT_SECRET=your_secure_development_jwt_secret_min_32_chars
JWT_EXPIRES_IN=15m

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

CLOUD_STORAGE_NAME=
CLOUD_STORAGE_API_KEY=
CLOUD_STORAGE_API_SECRET=
```

---

## 🏃 Running the Application

### 1. Start the Backend Server
From the `Server` directory:
```bash
npm run dev
```
- **Local API Base:** `http://localhost:5000/api/v1`
- **Health Check Endpoint:** `http://localhost:5000/api/v1/health`

### 2. Start the Frontend Client
From the `Client` directory:
```bash
npm run dev
```
- **Local Client Application:** `http://localhost:5173/`

---

## 🔍 Verifying Frontend-to-Backend Connectivity

1. Open `http://localhost:5173/` in your web browser.
2. The homepage includes a live **Backend API Connection Status** monitor.
3. When the backend server is active on port 5000, the status badge reflects:
   ```json
   {
     "success": true,
     "statusCode": 200,
     "service": "HotelPro Backend API",
     "status": "healthy",
     "environment": "development"
   }
   ```
4. Clicking the **"↻ Retest API Connection"** button dispatches a real-time request to `http://localhost:5000/api/v1/health` via Axios.

---

## 🔧 Troubleshooting Guide

| Issue | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **Backend port conflict (EADDRINUSE)** | Another process is utilizing port 5000. | Change `PORT` in `Server/.env` or terminate the conflicting process. |
| **CORS blocked in browser** | Frontend origin does not match backend `CLIENT_URL`. | Verify `CLIENT_URL=http://localhost:5173` in `Server/.env` matches the port Vite assigned. |
| **Frontend Network Error on Health Check** | Express backend server is not running. | Run `npm run dev` in `Server` and confirm `Listening on http://localhost:5000`. |
| **Rate limit triggered (429)** | Exceeded 300 requests / 15 mins per IP. | Wait 15 minutes or adjust the window in `Server/server.js`. |

---

## 📅 Development Roadmap

- [x] **Phase 1: Project Architecture & Technical Refinement**
- [x] **Phase 2: Project Setup and Configuration**
- [x] **Phase 3: Backend Development (11 Modules, JWT Auth, RBAC, Razorpay Gateway)**
- [x] **Phase 4: Database Development & Mongoose Schemas**
  - [x] Part 1: MongoDB Connection Manager, Lifecycle Events, Credential Sanitization
  - [x] Part 2: Normalized Schemas & Models (`User`, `Room`, `Booking`, `Payment`, `Hotel`, `Review`, `Notification`, `ServiceRequest`)
  - [x] Bidirectional field compatibility (`rent` / `pricePerNight`, `count` / `totalInventory`, `type` / `roomType`, `photos` / `images`, `roomId` / `room`, `userId` / `user`, `fromDate` / `checkIn`, `toDate` / `checkOut`, `totalDays` / `numberOfNights`, `userType` / `role`)
  - [x] Proactive PCI-DSS protection against raw card data retention (`cardDetails`, `cardNumber`, `cvvcode`, `pin`)
  - [x] Server-authoritative calculations (nights, subtotal, 18% GST) & half-open interval overlap detection
  - [x] 53/53 automated tests passing (`npm test`) across 7 test suites
- [x] **Phase 5: Frontend Development (React 19, AuthContext, Room Discovery, Reservation Checkout, Guest Dashboard, Staff Front-Desk, Admin Analytics)**
  - [x] React 19, Vite, Bootstrap 5 luxury design tokens (`--hp-dark-navy`, `--hp-primary-gold`, `--hp-light-bg`), and responsive navbar with role-aware avatar dropdown
  - [x] Reactive `AuthContext` with automatic HttpOnly refresh token session restoration and standardized error interceptor
  - [x] Room Discovery & Search: Interactive filtering by room type, guest capacity, price range, with live availability badges and room cards
  - [x] Room Details View: Photo gallery carousel, amenity tags, policies checklist, and direct booking initiation
  - [x] Reservation Checkout: 15-minute temporary hold countdown timer, server-authoritative 18% GST tax breakdown, Razorpay test mode payment flow, and instant confirmation
  - [x] Guest Dashboard (`/my-bookings`): Reservation history, status badges (`confirmed`, `checked_in`, `checked_out`, `cancelled`), cancellation modal with refund calculation, and printable receipt voucher
  - [x] Staff Front-Desk Portal (`/admin/bookings`): Guest reservation registry with search by reference/guest/phone, and status updates (`checked_in`, `checked_out`, `confirmed`, `cancelled`)
  - [x] Executive Admin Console (`/admin`): Real-time occupancy KPI cards, financial reports (`/admin/reports`), physical room inventory management (`/admin/rooms`), and user role administration (`/admin/users`)
  - [x] Production bundle verified: `npm run build` succeeds in 2.56s with 0 errors across 119 modules
- [x] **Phase 6: Project Execution, Validation & End-to-End Testing**
  - [x] 54/54 automated backend unit, integration, and security tests passing (`npm test`) across 8 test suites
  - [x] Playwright browser end-to-end automation suite in Google Chrome (`playwright_login_test.js`) verifying valid credentials, invalid credentials, Demo Guest login, Demo Admin login, and dashboard navigation
  - [x] Dual-port CORS and preflight compliance: `OPTIONS /api/v1/auth/login` verified with HTTP 204, credentials support, and explicit origin reflection for ports 5174 and 5173
  - [x] Browser console audit: 0 CORS errors, 0 Network errors, 0 failed HTTP requests
  - [x] Zero-Card-Data retention (PCI-DSS compliance) audited and enforced throughout client and server pipelines

