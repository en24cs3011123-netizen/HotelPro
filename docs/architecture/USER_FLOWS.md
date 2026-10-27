# HotelPro — User Flows & Operational Workflows

## 1. Overview & Architectural Integrity

This document defines the core user journeys and system state progressions for **HotelPro**. Each workflow diagrams the interaction between the User (Guest, Staff, or Admin), the React Frontend, the Express/Node.js Application Tier, the Persistence Tier, and External Services (Razorpay, Nodemailer).

### Critical Vulnerability Rectified
The initial legacy user-flow diagram illustrated a direct transition: `SignUp → Login → Admin`. This allowed unvetted public visitors to gain root administrative access to all hotels, bookings, and users.
In the refined architecture:
- Public sign-ups are strictly restricted to the `guest` role.
- Privileged roles (`staff`, `admin`) can only be provisioned through secure command-line bootstrap scripts or explicitly authorized, audit-logged super-admin delegation.
- All routes, views, and data queries enforce server-side authorization boundaries regardless of client-side routing.

---

## 2. Flow A: Registration, Authentication & Role-Based Routing

```mermaid
flowchart TD
    Start([Visitor Visits HotelPro]) --> Browse[Browse Public Rooms / Hotels]
    Browse --> AuthChoice{Action?}
    
    AuthChoice -->|Register| RegisterForm[Enter Name, Email, Phone, Password]
    RegisterForm --> RegSubmit[Submit POST /api/v1/auth/register]
    RegSubmit --> ServerRegVal{Backend Validation Passed?}
    
    ServerRegVal -->|No: Weak pwd / Duplicate email| RegError[Return 400 Bad Request / 409 Conflict]
    RegError --> RegisterForm
    
    ServerRegVal -->|Yes| CreateGuest[Hash Password with bcrypt<br/>Force role = 'guest'<br/>Save User to DB]
    CreateGuest --> SendWelcomeEmail[Queue Welcome & Verification Email]
    SendWelcomeEmail --> IssueTokensReg[Generate JWT Access & Refresh Tokens]
    IssueTokensReg --> GuestDash[Redirect to Guest Dashboard]

    AuthChoice -->|Login| LoginForm[Enter Email and Password]
    LoginForm --> LoginSubmit[Submit POST /api/v1/auth/login]
    LoginSubmit --> RateLimitCheck{Rate Limit Exceeded?<br/>> 5 attempts / 15m}
    
    RateLimitCheck -->|Yes| Lockout[Return 429 Too Many Requests<br/>Log Security Event]
    Lockout --> LoginForm

    RateLimitCheck -->|No| FindUser{User exists & Active?}
    FindUser -->|No| InvalidCreds[Return 401 Unauthorized]
    InvalidCreds --> LoginForm

    FindUser -->|Yes| VerifyHash{bcrypt.compareSync valid?}
    VerifyHash -->|No| InvalidCreds
    
    VerifyHash -->|Yes| GenTokens[Generate JWT Access Token<br/>Set HttpOnly Refresh Cookie]
    GenTokens --> RoleDispatch{User Role?}

    RoleDispatch -->|guest| GuestDash
    RoleDispatch -->|staff| StaffCheck{Assigned Active Hotel?}
    StaffCheck -->|Yes| StaffDash[Redirect to Staff Operations Portal]
    StaffCheck -->|No| UnassignedStaff[Show 'Pending Property Assignment' Screen]
    RoleDispatch -->|admin| AdminDash[Redirect to Admin Governance Console]
```

### Failure Modes & Recovery
- **Duplicate Registration Email**: Returns `409 Conflict`. Frontend displays an inline warning suggesting password recovery.
- **Credential Brute-Force**: IP and email identifiers are rate-limited via `express-rate-limit`. Exceeding 5 failures locks the endpoint for 15 minutes and logs an entry in `audit_logs`.
- **Session Revocation**: Logging out clears client memory and invalidates refresh token cookies server-side.

---

## 3. Flow B: Room Discovery, Dynamic Pricing & Booking Creation

```mermaid
flowchart TD
    GuestStart([Guest searches rooms]) --> SearchInput[Input City, Dates, Guests]
    SearchInput --> QueryAvailability[GET /api/v1/rooms/availability]
    QueryAvailability --> OverlapEngine[Availability Service checks overlapping holds & confirmed bookings]
    OverlapEngine --> ReturnRooms[Return Available Room Categories with dynamic pricing]
    ReturnRooms --> SelectRoom[Guest selects Room Category & clicks Book]
    
    SelectRoom --> AuthGate{User Authenticated?}
    AuthGate -->|No| PromptAuth[Modal: Login / Fast Checkout Registration]
    PromptAuth --> SelectRoom
    
    AuthGate -->|Yes| ReviewBooking[Review Reservation Summary & Guest Details]
    ReviewBooking --> ConfirmHold[Submit POST /api/v1/bookings]
    
    ConfirmHold --> StartTxn[Start MongoDB Multi-Document ACID Transaction]
    StartTxn --> RecheckAvail{Inventory Still Available?}
    
    RecheckAvail -->|No: Race condition lost| AbortTxn[Rollback Transaction<br/>Return 409 Conflict: Sold Out]
    AbortTxn --> ShowSoldOut[Display 'Room was just booked by another guest. Please select another.']
    
    RecheckAvail -->|Yes| CreatePendingBooking[Create Booking with status: 'pending_payment'<br/>Set holdExpiresAt = now + 15 mins]
    CreatePendingBooking --> CommitTxn[Commit MongoDB Transaction]
    CommitTxn --> CallRazorpay[Call Razorpay API: Create Order]
    CallRazorpay --> ReturnCheckout[Return bookingReference & razorpayOrderId to Client]
    ReturnCheckout --> LaunchRazorpayUI[Open Razorpay Hosted Checkout Modal]
```

### Failure Modes & Recovery
- **Double-Booking Prevention**: When two users simultaneously checkout the last room, the MongoDB transaction guarantees that only the first committed transaction succeeds. The second receives a `409 Conflict` gracefully.
- **Hold Expiry**: If checkout is abandoned or unpaid after 15 minutes, the background job releases the hold automatically, restoring inventory.

---

## 4. Flow C: Cancellation & Automated Refund Workflow

```mermaid
flowchart TD
    CancelStart([Guest visits My Bookings]) --> SelectBooking[Select Confirmed Booking to Cancel]
    SelectBooking --> ClickCancel[Click 'Request Cancellation']
    ClickCancel --> CheckEligibility[GET /api/v1/bookings/:id/cancellation-quote]
    
    CheckEligibility --> PolicyEvaluation{Policy Check:<br/>Hours before Check-in?}
    PolicyEvaluation -->|>= 48 hours| FullRefund[100% Refund Eligible]
    PolicyEvaluation -->|24 to 48 hours| PartialRefund[50% Refund Eligible]
    PolicyEvaluation -->|< 24 hours| NoRefund[Non-Refundable Window]

    FullRefund --> DisplayQuote[Display Refund Terms & Penalty Breakdown]
    PartialRefund --> DisplayQuote
    NoRefund --> DisplayQuote

    DisplayQuote --> ConfirmCancel[Guest confirms Cancellation]
    ConfirmCancel --> SubmitCancel[POST /api/v1/bookings/:id/cancel]
    
    SubmitCancel --> TxnCancel[Start MongoDB ACID Transaction]
    TxnCancel --> VerifyOwnership{Booking belongs to req.user?}
    VerifyOwnership -->|No| DenyAccess[403 Forbidden]
    
    VerifyOwnership -->|Yes| UpdateBookingStatus[Update Booking: status = 'cancelled'<br/>Record cancellationDetails]
    UpdateBookingStatus --> ReleaseInventory[Clear room hold; Inventory immediately restored]
    UpdateBookingStatus --> HasRefund{Refund Eligible?}
    
    HasRefund -->|Yes| CallRazorpayRefund[Call Razorpay API: payments.refund]
    CallRazorpayRefund --> RefundSuccess{Gateway Approved?}
    RefundSuccess -->|Yes| CreateRefundDoc[Insert Refund record with providerRefundId<br/>Status: 'processed']
    RefundSuccess -->|No| LogManualRefund[Insert Refund record: status = 'pending_manual_review']
    
    HasRefund -->|No| CommitCancelTxn[Commit Transaction]
    CreateRefundDoc --> CommitCancelTxn
    LogManualRefund --> CommitCancelTxn
    
    CommitCancelTxn --> SendCancelEmail[Queue Cancellation & Refund Receipt Email]
    SendCancelEmail --> EndCancel([Cancellation Complete])
```

---

## 5. Flow D: Staff Front Desk & Housekeeping Operations

```mermaid
flowchart TD
    StaffStart([Staff Member Logs In]) --> StaffAuth[Verify Role in ['staff', 'admin']]
    StaffAuth --> LoadHotel[Load Assigned Hotel Dashboard]
    
    LoadHotel --> OpChoice{Operational Task}

    OpChoice -->|Guest Check-In| LookupReservation[Lookup Booking by Reference or Guest Name]
    LookupReservation --> VerifyCheckInDate{Check-in Date matches Today?}
    VerifyCheckInDate -->|No| EarlyWarning[Warn: Early Check-in or Date Mismatch]
    VerifyCheckInDate -->|Yes| VerifyPaid{Payment Status = Captured?}
    VerifyPaid -->|No| CollectPayment[Prompt Staff: Settle Outstanding Balance]
    CollectPayment --> AssignPhysicalRoom
    VerifyPaid -->|Yes| AssignPhysicalRoom[Select Clean Room from available inventory]
    AssignPhysicalRoom --> ExecuteCheckIn[POST /api/v1/staff/check-in<br/>Update Room: 'occupied'<br/>Update Booking: 'checked_in']
    ExecuteCheckIn --> IssueKeys[Generate Registration Card & Key Allocation]

    OpChoice -->|Guest Check-Out| FindOccupied[Lookup Occupied Room]
    FindOccupied --> SettleIncidentals[Review Service Requests / Incidentals]
    SettleIncidentals --> ProcessCheckOut[POST /api/v1/staff/check-out<br/>Update Booking: 'checked_out'<br/>Update Room: 'maintenance']
    ProcessCheckOut --> AutoDispatchHousekeeping[Auto-create HousekeepingTask: 'turnover', priority: 'high']

    OpChoice -->|Housekeeping| ViewTaskList[View Assigned Cleaning Tasks]
    ViewTaskList --> UpdateTask[Update Task Status: 'in_progress' → 'completed']
    UpdateTask --> InspectorVerify[Inspector verifies: Room status set to 'available']
```

---

## 6. Flow E: Admin Governance & Hotel/Inventory Management

```mermaid
flowchart TD
    AdminStart([Admin Logs In]) --> AdminAuth[Verify req.user.role == 'admin']
    AdminAuth --> AdminConsole[Load Master Governance Dashboard]
    
    AdminConsole --> AdminAction{Administrative Domain}

    AdminAction -->|Hotel Management| ManageProperties[Create / Edit Hotel Profiles, Amenities, Slugs]
    ManageProperties --> SaveHotel[Audit Logged: HOTEL_UPDATED]

    AdminAction -->|Room Category & Inventory| ManageInventory[Create RoomTypes, Set Base Prices, Add Rooms]
    ManageInventory --> SaveRooms[Enforce unique roomNumber per hotelId<br/>Audit Logged: ROOM_MODIFIED]

    AdminAction -->|Booking Governance| ViewAllBookings[Filter Bookings by Status, Property, Date Range]
    ViewAllBookings --> BookingOverride[Override Booking, Process Manual Cancellation/Refund]
    BookingOverride --> SaveOverride[Audit Logged: ADMIN_BOOKING_OVERRIDE]

    AdminAction -->|Staff Provisioning| ManageStaff[Assign Staff to Hotels & Departments]
    ManageStaff --> SaveStaff[Audit Logged: STAFF_ROLE_ASSIGNED]

    AdminAction -->|Financials & Audit| ViewReports[Generate Occupancy, ADR, RevPAR & Audit Trails]
```

---

## 7. Flow F: Payment Verification & Gateway Webhook Processing

```mermaid
flowchart TD
    subgraph Client_Browser [Client Browser Checkout]
        OpenModal[Razorpay Checkout Modal Loaded]
        UserPays[User Enters Payment Details & Authorizes]
        GatewayCallback[Razorpay Returns: razorpay_payment_id, order_id, signature]
        ClientPost[Client calls POST /api/v1/payments/verify]
    end

    subgraph Direct_Verification [Synchronous Client Verification Path]
        ClientPost --> VerifyHMAC{HMAC SHA256 Signature Matches?<br/>key_secret + order_id + payment_id}
        VerifyHMAC -->|No: Tampered Signature| TamperReject[Reject with 400 Bad Request<br/>Log Security Incident]
        VerifyHMAC -->|Yes| FetchGatewayStatus[Call Razorpay API: Fetch Payment by ID]
        FetchGatewayStatus --> CheckPaidStatus{Gateway status == 'captured'?}
        CheckPaidStatus -->|Yes| IdempotentUpdate[Idempotent Update: Transition Booking to 'confirmed']
        IdempotentUpdate --> NotifySuccess[Send Instant Confirmation to Client]
    end

    subgraph Webhook_Fallback [Asynchronous Gateway Webhook Path]
        WebhookTrigger([Razorpay Webhook: order.paid / payment.captured]) --> VerifyWebhookSig{Verify X-Razorpay-Signature<br/>using WEBHOOK_SECRET}
        VerifyWebhookSig -->|Invalid| DropWebhook[Drop Request with 401 Unauthorized]
        VerifyWebhookSig -->|Valid| CheckAlreadyProcessed{Payment / Booking already 'confirmed'?}
        CheckAlreadyProcessed -->|Yes: Idempotent| AckWebhook[Return 200 OK: Already Processed]
        CheckAlreadyProcessed -->|No: Network dropped client| ExecuteWebhookUpdate[Transition Booking to 'confirmed'<br/>Update Payment doc]
        ExecuteWebhookUpdate --> AckWebhook
        ExecuteWebhookUpdate --> SendAsyncReceipt[Queue Transactional Voucher Email]
    end
```

---

## 8. Flow G: Security, RBAC & Context Isolation Enforcement

```mermaid
flowchart TD
    IncomingRequest([Incoming HTTP Request]) --> ParseToken[Extract Bearer JWT from Authorization Header]
    
    ParseToken --> HasToken{Token Present?}
    HasToken -->|No| IsPublicRoute{Is Route in Public Whitelist?}
    IsPublicRoute -->|Yes| AllowPublic[Allow Route Execution]
    IsPublicRoute -->|No| Deny401[Return 401 Unauthorized]

    HasToken -->|Yes| VerifyJWT{Verify JWT Signature & Expiry}
    VerifyJWT -->|Invalid / Expired| Deny401
    
    VerifyJWT -->|Valid| FetchUser[Fetch User Record from DB]
    FetchUser --> AccountActive{User status == 'active'?}
    AccountActive -->|No: Suspended| Deny403Suspended[Return 403 Forbidden: Account Suspended]
    
    AccountActive -->|Yes| AttachReqUser[Attach User to req.user]
    AttachReqUser --> CheckRole{req.user.role in allowedRoles?}
    
    CheckRole -->|No| Deny403Role[Return 403 Forbidden: Insufficient Permissions]
    
    CheckRole -->|Yes| CheckTenantBoundary{Requires Property / Resource Ownership?}
    CheckTenantBoundary -->|No| ExecuteController[Forward to Controller]
    CheckTenantBoundary -->|Yes| VerifyOwnership{Guest owns resource OR<br/>Staff assigned to target hotelId OR<br/>Role == admin?}
    
    VerifyOwnership -->|Yes| ExecuteController
    VerifyOwnership -->|No: Cross-tenant breach attempt| LogViolation[Record Security Breach in AuditLog<br/>Return 403 Forbidden]
```
