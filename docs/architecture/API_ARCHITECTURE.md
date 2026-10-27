# HotelPro — REST API Architecture Specification (v1)

## 1. Global API Conventions & Standards

The **HotelPro REST API** is designed according to OpenAPI 3.0 / RESTful best practices. All endpoints are prefixed with `/api/v1`.

### 1.1 HTTP Status Codes
- `200 OK`: Successful read or idempotent update.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Malformed payload, invalid JSON, or schema validation failure.
- `401 Unauthorized`: Missing, invalid, or expired JWT token.
- `403 Forbidden`: Authenticated user lacks required role or property ownership.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Business rule violation (e.g., room inventory already reserved, duplicate email).
- `422 Unprocessable Entity`: Semantic validation failure.
- `429 Too Many Requests`: Rate limiter triggered.
- `500 Internal Server Error`: Unhandled server exception (sanitized in production).

### 1.2 Envelope & Response Structure

#### Success Response Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "totalRecords": 142,
    "totalPages": 8
  }
}
```

#### Error Response Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "checkOutDate",
      "message": "checkOutDate must be strictly after checkInDate"
    }
  ]
}
```

### 1.3 Pagination, Sorting & Filtering Protocol
All collection listing endpoints support standard query parameters:
- `page`: 1-based index (default `1`).
- `limit`: Number of records per page (default `20`, max `100`).
- `sortBy`: Field name to order by (e.g., `createdAt`, `basePrice`).
- `order`: Sort direction (`asc` or `desc`, default `desc`).
- `search`: Free-text search string.

---

## 2. API Endpoint Inventory

### Group 1: Authentication & Identity (`/api/v1/auth`)

#### 1.1 Register New Guest
- **Route:** `POST /api/v1/auth/register`
- **Auth:** Public
- **Validation:**
  - `name`: string, 2-100 chars, required.
  - `email`: valid email format, lowercase, required.
  - `password`: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char.
  - `phone`: valid 10-15 digit string, required.
- **Behavior:** Strictly assigns `role = 'guest'`. Password hashed via bcrypt (12 rounds).
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "User registered successfully",
    "data": {
      "user": {
        "_id": "65e01f...",
        "name": "Aarav Sharma",
        "email": "aarav@example.com",
        "role": "guest"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5c..."
    }
  }
  ```
- **Errors:** `400 Bad Request` (validation failed), `409 Conflict` (email already registered).

#### 1.2 User Login
- **Route:** `POST /api/v1/auth/login`
- **Auth:** Public (Rate limit: 5 requests / 15 minutes per IP)
- **Validation:** `email` (valid email), `password` (non-empty string).
- **Behavior:** Compares bcrypt hash. Issues JWT access token in response body and sets secure `HttpOnly` refresh token cookie.
- **Response `200 OK`:** User object, role, access token, expiration metadata.
- **Errors:** `401 Unauthorized` (invalid credentials or deactivated account), `429 Too Many Requests`.

#### 1.3 Get Current Profile
- **Route:** `GET /api/v1/auth/me`
- **Auth:** Bearer JWT required (Guest, Staff, Admin)
- **Response `200 OK`:** Full profile of authenticated user.

#### 1.4 Logout
- **Route:** `POST /api/v1/auth/logout`
- **Auth:** Bearer JWT required
- **Behavior:** Clears refresh token cookie server-side.

#### 1.5 Password Recovery Workflows
- `POST /api/v1/auth/forgot-password`: Generates secure crypto token; dispatches reset email.
- `POST /api/v1/auth/reset-password`: Accepts token and new password; invalidates token.

---

### Group 2: Hotels & Properties (`/api/v1/hotels`)

#### 2.1 List Active Hotels
- **Route:** `GET /api/v1/hotels`
- **Auth:** Public
- **Query Params:** `city`, `amenities`, `page`, `limit`
- **Response `200 OK`:** Array of active hotel summaries with cover imagery and location.

#### 2.2 Get Hotel Details by ID or Slug
- **Route:** `GET /api/v1/hotels/:idOrSlug`
- **Auth:** Public
- **Response `200 OK`:** Hotel profile, amenities, contact details, gallery, and available room types.

#### 2.3 Create Hotel Property
- **Route:** `POST /api/v1/hotels`
- **Auth:** Admin only (`role == 'admin'`)
- **Body:** `name`, `description`, `address`, `city`, `state`, `country`, `contactDetails`, `amenities`, `photos`
- **Response `201 Created`:** Created Hotel document.

#### 2.4 Update Hotel Details
- **Route:** `PUT /api/v1/hotels/:hotelId`
- **Auth:** Admin only
- **Response `200 OK`:** Updated Hotel document.

---

### Group 3: Rooms, Categories & Availability (`/api/v1/rooms`)

#### 3.1 Search Room Availability
- **Route:** `GET /api/v1/rooms/availability`
- **Auth:** Public
- **Query Params:**
  - `hotelId`: ObjectId, required.
  - `checkInDate`: ISO8601 Date, required (must be >= today).
  - `checkOutDate`: ISO8601 Date, required (must be > checkInDate).
  - `guests`: Number, min 1 (default 1).
- **Behavior:** Invokes `AvailabilityService`. Scans physical room counts minus conflicting reservations and active holds.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "roomTypeId": "65e02a...",
        "name": "Deluxe Sea View Suite",
        "basePrice": 6500,
        "calculatedPricePerNight": 7200,
        "totalNights": 3,
        "totalEstimate": 25488,
        "availableUnits": 4,
        "maxOccupancy": 3,
        "amenities": ["Balcony", "King Bed", "Sea View", "WiFi"],
        "photos": ["https://..."]
      }
    ]
  }
  ```

#### 3.2 List Physical Rooms for a Hotel
- **Route:** `GET /api/v1/hotels/:hotelId/rooms`
- **Auth:** Staff (assigned to hotel) or Admin
- **Response `200 OK`:** Detailed list of physical rooms with `operationalStatus`.

#### 3.3 Create Physical Room Inventory
- **Route:** `POST /api/v1/rooms`
- **Auth:** Admin only
- **Body:** `hotelId`, `roomTypeId`, `roomNumber`, `floor`, `operationalStatus`
- **Validation:** Compound uniqueness of `(hotelId, roomNumber)`.
- **Response `201 Created`:** Physical Room record.

#### 3.4 Update Room Operational Status
- **Route:** `PATCH /api/v1/rooms/:roomId/status`
- **Auth:** Staff (assigned hotel) or Admin
- **Body:** `{ "operationalStatus": "maintenance" | "available" | "out_of_order" }`

---

### Group 4: Bookings & Reservations (`/api/v1/bookings`)

#### 4.1 Create Reservation / Temporary Inventory Hold
- **Route:** `POST /api/v1/bookings`
- **Auth:** Authenticated Guest or Admin
- **Body:**
  ```json
  {
    "hotelId": "65e01b...",
    "checkInDate": "2026-11-10",
    "checkOutDate": "2026-11-13",
    "guestCount": 2,
    "roomSelections": [
      { "roomTypeId": "65e02a...", "quantity": 1 }
    ],
    "guestDetails": {
      "fullName": "Aarav Sharma",
      "email": "aarav@example.com",
      "phone": "+919876543210",
      "specialRequests": "Late check-in requested"
    }
  }
  ```
- **Behavior:** Executes inside a MongoDB ACID transaction. Re-verifies availability, computes server-authoritative pricing, creates `Booking` with `bookingStatus = 'pending_payment'`, sets `holdExpiresAt = now + 15m`, calls Razorpay SDK to generate `providerOrderId`.
- **Response `201 Created`:** Booking summary, reference ID, Razorpay order configuration.

#### 4.2 Get Guest's Own Bookings
- **Route:** `GET /api/v1/bookings/my`
- **Auth:** Guest (strictly returns bookings where `userId == req.user._id`)
- **Query Params:** `status`, `page`, `limit`
- **Response `200 OK`:** Paginated array of personal bookings.

#### 4.3 Get Booking by ID / Reference
- **Route:** `GET /api/v1/bookings/:id`
- **Auth:** Guest (owner), Assigned Staff, or Admin
- **Response `200 OK`:** Detailed booking document, room breakdown, payment status, invoice metadata.

#### 4.4 Request Booking Cancellation
- **Route:** `POST /api/v1/bookings/:id/cancel`
- **Auth:** Guest (owner) or Admin
- **Body:** `{ "reason": "Travel plans postponed" }`
- **Behavior:** Evaluates cancellation policy window, updates booking status to `cancelled`, immediately releases room inventory, initiates Razorpay refund if eligible.
- **Response `200 OK`:** Cancellation confirmation with refund amount and status.

---

### Group 5: Payments & Gateways (`/api/v1/payments`)

#### 5.1 Initialize Payment Order
- **Route:** `POST /api/v1/payments/create-order`
- **Auth:** Guest (must own target pending booking)
- **Body:** `{ "bookingId": "65e03f..." }`
- **Response `200 OK`:** Razorpay `orderId`, `amount`, `currency`, and public key.

#### 5.2 Client Payment Verification
- **Route:** `POST /api/v1/payments/verify`
- **Auth:** Authenticated Guest
- **Body:**
  ```json
  {
    "bookingId": "65e03f...",
    "razorpayOrderId": "order_OG78...",
    "razorpayPaymentId": "pay_OG89...",
    "razorpaySignature": "4a2b9c..."
  }
  ```
- **Behavior:**
  1. Computes server HMAC SHA256 of `order_id + "|" + payment_id` using `RAZORPAY_KEY_SECRET`.
  2. Compares signature cryptographically (`crypto.timingSafeEqual`).
  3. Verifies payment status directly with Razorpay API.
  4. Idempotently updates `Payment` to `'captured'` and `Booking` to `'confirmed'`.
  5. Dispatches confirmation email and voucher.
- **Response `200 OK`:** Confirmation receipt and booking status `'confirmed'`.
- **Errors:** `400 Bad Request` (signature verification failed), `409 Conflict`.

#### 5.3 Gateway Webhook Ingestion
- **Route:** `POST /api/v1/payments/webhook`
- **Auth:** Unauthenticated public webhook; signature verified via `X-Razorpay-Signature` header and secret.
- **Body:** Raw Razorpay webhook payload.
- **Behavior:** Idempotent reconciliation of `payment.captured`, `order.paid`, and `refund.processed` events.
- **Response `200 OK`:** `{ "received": true }`.

---

### Group 6: Staff & Front Desk Operations (`/api/v1/staff`)

#### 6.1 Reservation Lookup
- **Route:** `GET /api/v1/staff/lookup`
- **Auth:** Staff (assigned hotel) or Admin
- **Query Params:** `query` (booking reference, phone number, guest name)
- **Response `200 OK`:** Matching reservations for assigned hotel.

#### 6.2 Process Guest Check-In
- **Route:** `POST /api/v1/staff/check-in`
- **Auth:** Staff (assigned hotel) or Admin
- **Body:** `{ "bookingId": "65e03f...", "roomId": "65e04a..." }`
- **Behavior:** Asserts booking is `'confirmed'`, assigns clean physical room, updates booking to `'checked_in'`, marks room `'occupied'`.
- **Response `200 OK`:** Check-in confirmation.

#### 6.3 Process Guest Check-Out
- **Route:** `POST /api/v1/staff/check-out`
- **Auth:** Staff (assigned hotel) or Admin
- **Body:** `{ "bookingId": "65e03f..." }`
- **Behavior:** Verifies incidental charges, sets booking to `'checked_out'`, sets room to `'maintenance'`, auto-dispatches housekeeping cleaning task.
- **Response `200 OK`:** Check-out invoice summary.

#### 6.4 Housekeeping Task Management
- `GET /api/v1/staff/housekeeping`: List tasks filtered by room, status, priority.
- `PATCH /api/v1/staff/housekeeping/:id`: Update cleaning status (`in_progress` -> `completed` -> `verified`).

---

### Group 7: Administration & Governance (`/api/v1/admin`)

#### 7.1 Master Dashboard Analytics
- **Route:** `GET /api/v1/admin/analytics`
- **Auth:** Admin only
- **Response `200 OK`:** Key Performance Indicators (KPIs): Total Revenue, Occupancy Rate, RevPAR, Average Daily Rate (ADR), Pending Check-ins.

#### 7.2 Manage User Accounts & Privileges
- `GET /api/v1/admin/users`: Search and filter all registered users.
- `PATCH /api/v1/admin/users/:id/status`: Suspend or activate user accounts.
- `POST /api/v1/admin/staff/assign`: Assign user to staff role and hotel property.

#### 7.3 Financial Reports & Refund Overrides
- `GET /api/v1/admin/payments`: Global payment transaction register with gateway reference cross-check.
- `POST /api/v1/admin/payments/:id/refund`: Execute administrative manual refund.

#### 7.4 Compliance Audit Logs
- **Route:** `GET /api/v1/admin/audit-logs`
- **Auth:** Admin only
- **Query Params:** `actorId`, `action`, `resourceType`, `fromDate`, `toDate`, `page`, `limit`
- **Response `200 OK`:** Paginated, read-only immutable audit trail.
