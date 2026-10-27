# HotelPro — Role-Based Access Control (RBAC) & Authorization Matrix

## 1. Authorization Architecture & Trust Boundaries

Security in **HotelPro** enforces the **Principle of Least Privilege (PoLP)** and **Defense-in-Depth**. Authorization is strictly decoupled from presentation: hiding a button, route, or link in the React user interface is treated solely as a UX convenience, never a security boundary.

Every protected API endpoint evaluates a multi-tier authorization gate:
1. **Authentication Gate (`authMiddleware`)**: Validates the cryptographic integrity and expiration of the JWT, populating `req.user`.
2. **Role Gate (`rbacMiddleware([...roles])`)**: Asserts that `req.user.role` matches the permissible roles for the requested operation.
3. **Resource & Tenant Boundary Gate (`ownershipMiddleware`)**: Asserts that guests only access records where `resource.userId == req.user._id`, and staff members only access operational records where `resource.hotelId` matches an active assignment in `staff_assignments`.

---

## 2. Definitive Role-Permission Matrix

The table below enumerates all core system resources and operations, defining access rights across `guest`, `staff`, and `admin` roles.

| Resource Domain | Specific Operation | Endpoint / Action | Guest | Staff | Admin | Authorization Rule & Context Constraint |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Authentication** | Register / Login | `POST /auth/register`, `/auth/login` | Permitted | Permitted | Permitted | Public access; registration auto-assigns `role = 'guest'`. |
| | Refresh Token / Logout | `POST /auth/refresh`, `/auth/logout` | Permitted | Permitted | Permitted | Authenticated user only. |
| | Request Password Reset | `POST /auth/forgot-password` | Permitted | Permitted | Permitted | Rate-limited by IP/email. |
| **User Management** | View Own Profile | `GET /users/me` | Permitted | Permitted | Permitted | Accesses only `req.user._id`. |
| | Update Own Profile | `PUT /users/me` | Permitted | Permitted | Permitted | Cannot change role, emailVerifiedAt, or accountStatus. |
| | List All Users | `GET /admin/users` | Denied | Denied | Permitted | Global user listing with pagination. |
| | Modify User Role/Status | `PATCH /admin/users/:id/role` | Denied | Denied | Permitted | Admin only; logged in `audit_logs`. |
| **Hotels & Properties** | Browse Active Hotels | `GET /hotels`, `GET /hotels/:id` | Permitted | Permitted | Permitted | Public read of active properties. |
| | Create / Edit Hotel | `POST /hotels`, `PUT /hotels/:id` | Denied | Denied | Permitted | Admin only; system-level configuration. |
| | Update Hotel Status | `PATCH /hotels/:id/status` | Denied | Denied | Permitted | Admin only. |
| **Rooms & Categories** | View Available Categories | `GET /rooms/availability` | Permitted | Permitted | Permitted | Public read. |
| | View Room Category Detail | `GET /room-types/:id` | Permitted | Permitted | Permitted | Public read. |
| | Create / Edit Room Types | `POST /room-types`, `PUT /room-types/:id` | Denied | Denied | Permitted | Admin only. |
| | Add Physical Rooms | `POST /rooms` | Denied | Denied | Permitted | Admin only; validates unique `roomNumber` per hotel. |
| | Update Room Op Status | `PATCH /rooms/:id/status` | Denied | Permitted | Permitted | Staff restricted to their assigned `hotelId`. |
| **Bookings** | Create Temporary Hold | `POST /bookings` | Permitted | Denied | Permitted | Creates hold with 15-minute expiry. |
| | View Own Bookings | `GET /bookings/my` | Permitted | Denied | Denied | Strictly scoped to `userId == req.user._id`. |
| | View Booking Details | `GET /bookings/:id` | Own Only | Assigned Hotel | Permitted | Guest if owner; Staff if assigned to `hotelId`; Admin global. |
| | Cancel Booking | `POST /bookings/:id/cancel` | Own Only | Denied | Permitted | Guest subject to cancellation policy; Admin can override. |
| | List Property Bookings | `GET /staff/bookings` | Denied | Assigned Hotel | Permitted | Staff scoped strictly to assigned `hotelId`. |
| | List All Global Bookings | `GET /admin/bookings` | Denied | Denied | Permitted | Unrestricted administrative review. |
| **Payments & Refunds** | Create Payment Order | `POST /payments/create-order` | Own Only | Denied | Permitted | Guest for their own pending booking. |
| | Verify Payment Signature| `POST /payments/verify` | Own Only | Denied | Permitted | Direct verification of cryptographic signature. |
| | Webhook Ingestion | `POST /payments/webhook` | System | System | System | Secret HMAC verified; no user session required. |
| | Process Manual Refund | `POST /admin/payments/:id/refund` | Denied | Denied | Permitted | Admin only; creates immutable audit log. |
| **Front Desk Ops** | Lookup Reservation | `GET /staff/lookup` | Denied | Assigned Hotel | Permitted | Staff lookup by reference or guest name within assigned hotel. |
| | Execute Check-In | `POST /staff/check-in` | Denied | Assigned Hotel | Permitted | Requires payment confirmation; assigns physical clean room. |
| | Execute Check-Out | `POST /staff/check-out` | Denied | Assigned Hotel | Permitted | Dispatches turnover housekeeping task. |
| **Housekeeping** | View Assigned Tasks | `GET /staff/housekeeping` | Denied | Assigned Hotel | Permitted | Filterable by assigned staff or department. |
| | Update Cleaning Status | `PATCH /staff/housekeeping/:id` | Denied | Assigned Hotel | Permitted | Staff marks in_progress/completed; supervisor verifies. |
| **Service Requests** | Create Request | `POST /service-requests` | Own Stay | Permitted | Permitted | Guest must hold an active 'checked_in' booking. |
| | Resolve Request | `PATCH /service-requests/:id` | Denied | Assigned Hotel | Permitted | Assigned hotel staff only. |
| **Reviews & Ratings** | Submit Review | `POST /reviews` | Verified Guest | Denied | Denied | One review per completed ('checked_out') booking. |
| | Moderate / Hide Review | `PATCH /admin/reviews/:id/status` | Denied | Denied | Permitted | Admin only. |
| **Governance & Audit** | View Audit Logs | `GET /admin/audit-logs` | Denied | Denied | Permitted | Admin only; strictly immutable read-only view. |
| | View Analytics / Reports | `GET /admin/reports/occupancy` | Denied | Denied | Permitted | Admin only. |

---

## 3. Implementation of Authorization & Tenant Isolation

### 3.1 Role Verification Middleware (`rbacMiddleware.js`)
```javascript
const ApiError = require('../utils/ApiError');

/**
 * Restricts route access to specified roles
 * @param {...string} allowedRoles - 'guest', 'staff', 'admin'
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: Insufficient privileges for this resource.'));
    }
    next();
  };
};

module.exports = authorize;
```

### 3.2 Property & Ownership Isolation Guard (`tenantGuard.js`)
```javascript
const StaffAssignment = require('../models/StaffAssignment');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');

/**
 * Asserts property-level multi-tenancy access boundaries
 */
const requireHotelAccess = async (req, res, next) => {
  const user = req.user;
  const targetHotelId = req.params.hotelId || req.body.hotelId || req.query.hotelId;

  if (user.role === 'admin') {
    return next(); // Admins maintain cross-property oversight
  }

  if (user.role === 'staff') {
    const assignment = await StaffAssignment.findOne({
      userId: user._id,
      hotelId: targetHotelId,
      isActive: true
    });
    if (!assignment) {
      return next(new ApiError(403, 'Forbidden: You are not assigned to this hotel property.'));
    }
    req.staffAssignment = assignment;
    return next();
  }

  return next(new ApiError(403, 'Forbidden: Unauthorized property access.'));
};

/**
 * Asserts resource ownership for guests
 */
const requireBookingOwner = async (req, res, next) => {
  const user = req.user;
  const bookingId = req.params.bookingId || req.params.id;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new ApiError(404, 'Booking not found.'));
  }

  if (user.role === 'admin') {
    req.booking = booking;
    return next();
  }

  if (user.role === 'staff') {
    const assignment = await StaffAssignment.findOne({
      userId: user._id,
      hotelId: booking.hotelId,
      isActive: true
    });
    if (assignment) {
      req.booking = booking;
      return next();
    }
  }

  if (user.role === 'guest' && booking.userId.toString() === user._id.toString()) {
    req.booking = booking;
    return next();
  }

  return next(new ApiError(403, 'Forbidden: You do not own or manage this reservation.'));
};

module.exports = { requireHotelAccess, requireBookingOwner };
```
