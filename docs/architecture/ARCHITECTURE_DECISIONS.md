# HotelPro — Architecture Decision Records (ADRs)

## Overview & Decision Governance

This document records the foundational architectural decisions made during the architecture refinement phase of **HotelPro**. Each record details the context, the evaluated alternatives, the final decision, and the resultant trade-offs and consequences.

---

### ADR-001: Modular Monolith vs. Microservices Architecture

- **Status:** Accepted
- **Context:** Initial architectural sketches depicted fragmented service blocks ("API Gateway", separate web servers, "Posting"). The development team needed to decide between a distributed microservices architecture or a modular monolithic backend.
- **Alternatives Considered:**
  1. *Microservices (Docker / Kubernetes, gRPC/RabbitMQ between Auth, Inventory, Booking, and Payment services)*.
  2. *Modular Monolith (Express.js single deployable unit structured by domain modules and layers)*.
- **Decision:** Adopt a **Modular Monolith**. All core domains (Auth, Hotels, Rooms, Bookings, Payments, Staff Ops, Housekeeping) reside within a structured Express codebase with strict service-layer boundaries and shared database transaction contexts.
- **Consequences & Trade-Offs:**
  - *Positive:* Eliminates network latency between services, drastically simplifies local development and testing, enables native MongoDB multi-document ACID transactions without 2-phase commit (2PC) or Saga orchestrators, and keeps operational infrastructure costs minimal.
  - *Negative:* All modules deploy together; high load on room search consumes the same compute pool as front desk operations. This can be mitigated through stateless horizontal container scaling.

---

### ADR-002: Zero-Card-Data Retention & Razorpay Hosted Checkout (PCI-DSS Scoping)

- **Status:** Accepted
- **Context:** The initial reference ER diagram included `cardDetails` (`cardNumber`, `cyvcode`, `expmonthyear`, `cardholdername`) embedded directly in the `booking` schema.
- **Security Assessment:** Storing raw credit/debit card numbers and CVV codes in a custom MongoDB database is a severe violation of **PCI-DSS Requirement 3.2** (prohibiting storage of card verification codes under any circumstance). Doing so would trigger full PCI-DSS SAQ-D audit compliance, exposing the platform to massive compliance penalties, security vulnerabilities, and legal liabilities.
- **Alternatives Considered:**
  1. *Local AES-256 encrypted card vault in MongoDB.* (Still falls under heavy PCI-DSS audit; CVV storage remains strictly illegal).
  2. *Tokenized payment gateway integration via Razorpay Hosted Checkout / Standard SDK.*
- **Decision:** Enforce a strict **Zero-Card-Data Policy**. No card numbers, expiry dates, or CVVs will ever touch or traverse the HotelPro application servers. All payment credential collection is delegated to the Razorpay SDK / hosted modal. HotelPro servers exclusively process and store:
  - `providerOrderId`
  - `providerPaymentId`
  - Cryptographic HMAC-SHA256 signature verification tokens
- **Consequences & Trade-Offs:**
  - *Positive:* Achieves the simplest PCI-DSS compliance tier (SAQ-A), eliminates catastrophic financial data leakage risks, and offloads 3D Secure / OTP processing to certified banking infrastructure.
  - *Negative:* Checkout UX relies on the gateway modal appearance; custom embedded input forms are not possible without iframe tokens.

---

### ADR-003: Elimination of Self-Promoting Admin Signup & Enforcement of Strict RBAC

- **Status:** Accepted
- **Context:** The initial legacy user-flow diagram depicted visitors registering and immediately selecting or navigating into an "Admin" portal.
- **Security Assessment:** Permitting end-users to designate administrative privileges upon registration violates core access control fundamentals and constitutes a critical privilege escalation flaw.
- **Decision:**
  1. Public registration (`POST /api/v1/auth/register`) strictly forces the `role` attribute to `'guest'`. Any incoming `role` field in the request payload is discarded.
  2. Privileged roles (`staff`, `admin`) can only be provisioned via:
     - An initial command-line seeding utility with secret master credentials (`npm run seed:admin`).
     - Explicit invitation or role-change by an authenticated `admin` user through protected administrative endpoints.
  3. Every privileged route evaluates `rbacMiddleware` and property isolation boundaries on the server.
- **Consequences:** Eliminates unauthorized privilege escalation; requires administrative onboarding workflows for hotel staff.

---

### ADR-004: Date-Range Interval Availability Engine with ACID Transactions vs. Static Room Counters

- **Status:** Accepted
- **Context:** The initial ER diagram placed `fromdate`, `todate`, and a static `count` field on the `room` document to calculate availability.
- **Assessment:** Hotels do not sell a static number of items; they sell date-interval rights to physical units. A static counter cannot represent variable booking lengths (e.g., Guest A stays Nov 1–4; Guest B stays Nov 3–6).
- **Decision:**
  1. Model availability as a dynamic query:
     $$\text{Available} = \text{Total Category Rooms} - \text{Active Holds \& Confirmed Overlaps in Interval}$$
  2. Implement a 15-minute temporary hold state (`pending_payment` with `holdExpiresAt`).
  3. Execute hold reservation inside a **MongoDB Multi-Document ACID Transaction** (`session.startTransaction()`) with read/write locks on booking intervals to prevent double-booking race conditions under high concurrent demand.
  4. Schedule a background job to release expired unconfirmed holds automatically.
- **Consequences:** Completely prevents double bookings; requires MongoDB 7.0+ Replica Set configuration (readily provided by MongoDB Atlas or local 3-node replica set).

---

### ADR-005: Normalization of Database Entities (14 Collections vs. Baseline 3)

- **Status:** Accepted
- **Context:** The legacy specification attempted to model an entire hotel booking and operations platform across only 3 collections (`user`, `room`, `booking`).
- **Assessment:** Real hotel management requires multi-room bookings, property boundaries, housekeeping operations, service requests, payment reconciliation, audit trails, and review moderation. Forcing these disparate concerns into 3 collections creates unbounded document growth, schema bloat, and concurrency contention.
- **Decision:** Implement **14 Normalized Collections**:
  1. `users`
  2. `hotels`
  3. `room_types`
  4. `rooms`
  5. `bookings`
  6. `booking_rooms`
  7. `payments`
  8. `refunds`
  9. `reviews`
  10. `notifications`
  11. `staff_assignments`
  12. `housekeeping_tasks`
  13. `service_requests`
  14. `audit_logs`
- **Consequences:** Clean schema validation, isolated indexing strategies, high query performance, and straightforward data migration paths.

---

### ADR-006: Separation of Physical Room Inventory from Room Categories (`RoomType`)

- **Status:** Accepted
- **Context:** Guests book a *category* (e.g., "Deluxe Ocean Suite"), while staff assign a *specific physical unit* (e.g., "Room 304").
- **Decision:** Split room representation into two distinct entities:
  - `RoomType`: Marketing description, maximum occupancy, bed configuration, base pricing, amenities, and photo gallery.
  - `Room`: Physical room number, floor, physical maintenance status (`available`, `occupied`, `maintenance`, `out_of_order`), and foreign key to `RoomType`.
- **Consequences:** Enables flexible front desk allocation (rooms can be assigned at check-in rather than rigidly locked at purchase) and facilitates offline room maintenance without disrupting category listings.

---

### ADR-007: Dual-Token JWT Strategy with Server-Side Refresh Invalidation

- **Status:** Accepted
- **Context:** Stateless authentication must balance user convenience (staying logged in) with security (immediate revocation upon suspicious activity or logout).
- **Decision:**
  - **Access Token:** Short-lived JWT (15 minutes expiry) containing user ID, role, and assigned hotels. Transmitted via `Authorization: Bearer <token>` in Axios headers. Kept in React memory.
  - **Refresh Token:** Long-lived cryptographically random token (7 days expiry) stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
  - Token refresh endpoint rotates refresh tokens and detects reuse attempts.
- **Consequences:** Minimizes token theft impact; eliminates vulnerability to XSS attacks targeting local storage tokens.

---

### ADR-008: Property-Level Multi-Tenancy for Staff Operations

- **Status:** Accepted
- **Context:** While the system initially targets a single flagship hotel, the architecture must support seamless expansion to multiple hotel properties without rewriting backend query filters.
- **Decision:**
  - Every resource (`RoomType`, `Room`, `Booking`, `HousekeepingTask`, `ServiceRequest`) has an explicit `hotelId` attribute.
  - Staff members are bound to specific properties via the `staff_assignments` collection.
  - Staff controllers automatically inject `hotelId` scoping from the authenticated user's assignment record, preventing cross-property data leaks.
- **Consequences:** Ready for multi-hotel SaaS expansion on day one with zero architectural debt.

---

### ADR-009: UI Styling via Bootstrap 5 Foundation + Custom Design Tokens

- **Status:** Accepted
- **Context:** The frontend requires a responsive, high-fidelity luxury hotel visual identity that is straightforward to maintain and customize.
- **Decision:** Use **Bootstrap 5** for its proven responsive grid, accessible modal primitives, and form layout utilities, coupled with a bespoke **Custom CSS Design Token System** (`variables.css`, `components.css`).
- **Consequences:** Provides rock-solid mobile-to-desktop responsiveness while avoiding generic framework aesthetics through customized typography (Outfit/Inter), luxury gold/navy color palettes, sleek card elevation, and smooth micro-animations.
