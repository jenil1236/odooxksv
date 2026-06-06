# VendorBridge — Procurement & Vendor Management ERP

<div align="center">

![VendorBridge Banner](https://img.shields.io/badge/VendorBridge-ERP-2563eb?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTMgOWgxOE0zIDE1aDE4TTEyIDN2MTgiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==)

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=flat-square&logo=prisma)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-22B573?style=flat-square)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=json-web-tokens)

**A full-stack Procurement & Vendor Management ERP built with Next.js 15 App Router, PostgreSQL, and Prisma ORM.**

[Live Demo](#) • [API Reference](#api-routes) • [Database Schema](#database-schema)

</div>

---

## Table of Contents

1. [Vision & Problem Statement](#1-vision--problem-statement)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema & Entity Relationships](#3-database-schema--entity-relationships)
4. [Authentication Implementation](#4-authentication-implementation)
5. [Role-Based Access Control (RBAC)](#5-role-based-access-control-rbac)
6. [Procurement Workflow](#6-procurement-workflow)
7. [Module Breakdown](#7-module-breakdown)
8. [Email Service](#8-email-service)
9. [API Routes Reference](#9-api-routes-reference)
10. [Getting Started](#10-getting-started)
11. [Database Seeding](#11-database-seeding)
12. [Project Structure](#12-project-structure)

---

## 1. Vision & Problem Statement

### The Problem

Traditional procurement operations in organizations suffer from:

| Pain Point | Impact |
|---|---|
| Manual, paper-based workflows | Slow procurement cycles, lost documents |
| Fragmented vendor communication | No single source of truth for bids |
| Lack of a structured approval chain | Unauthorized or unchecked spending |
| No audit trail | Zero accountability and compliance risk |
| Disjointed PO and invoice management | Delays in payment cycles |
| No real-time visibility | Management has no procurement overview |

### The Solution

**VendorBridge** is a centralized Procurement & Vendor Management ERP that digitizes the full procurement lifecycle:

- **Multi-organization architecture** allowing independent tenants to manage their own procurement/ERP isolated from others
- **Centralized vendor registry** with status tracking, categories, and GST data
- **Structured RFQ workflows** with multi-vendor invitations and deadline management
- **Vendor quotation portal** with itemized pricing and draft/submit states
- **Side-by-side quotation comparison** for data-driven vendor selection
- **Approval workflow engine** with role-based routing, remarks, and audit timelines
- **Automated PO & invoice generation** with GST calculations, PDF export, and email delivery
- **Real-time activity logs and notifications** for complete audit trails
- **Reports & analytics** for spend visibility and vendor performance

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Full-stack React framework with server components |
| **Language** | TypeScript | Type safety across frontend and backend |
| **Database** | PostgreSQL | Relational database for structured procurement data |
| **ORM** | Prisma ORM (v6) | Type-safe database access, migrations, schema |
| **Auth** | JWT + HTTP-only Cookies | Stateless session management |
| **Email** | Nodemailer (SMTP/Gmail) | Credential emails, invoice delivery |
| **PDF** | jsPDF + html2canvas | Client-side invoice PDF generation |
| **Styling** | Vanilla CSS (custom design system) | No framework dependencies, full control |
| **Fonts** | Google Fonts (Inter) | Clean, readable typography |
| **Middleware** | Next.js Middleware (`middleware.ts`) | Route protection and RBAC enforcement |
| **Password** | bcryptjs | Secure password hashing (12 salt rounds) |
| **Validation** | Native TypeScript | Request body validation in route handlers |

---

## 3. Database Schema & Entity Relationships

### Entity Relationship Overview

```mermaid
erDiagram
    Organization ||--o{ User : "has"
    Organization ||--o{ Vendor : "has"

    User ||--o| Vendor : "may be"
    User ||--o{ RFQ : "creates"
    User ||--o{ Approval : "requests (ApprovalRequested)"
    User ||--o{ Approval : "actions (ApprovalApprover)"
    User ||--o{ ActivityLog : "generates"
    User ||--o{ Notification : "receives"
    User ||--o{ PurchaseOrder : "approvedBy (POApprovedBy)"

    VendorCategory ||--o{ Vendor : "categorizes"

    Vendor ||--o{ RFQInvitation : "invited to"
    Vendor ||--o{ Quotation : "submits"
    Vendor ||--o{ PurchaseOrder : "receives"
    Vendor ||--o{ Invoice : "billed on"

    RFQ ||--o{ RFQItem : "contains"
    RFQ ||--o{ RFQInvitation : "invites vendors via"
    RFQ ||--o{ RFQAttachment : "has files"
    RFQ ||--o{ Quotation : "receives"
    RFQ ||--o| Quotation : "selectedQuotation"
    RFQ ||--o{ Approval : "has"
    RFQ ||--o{ PurchaseOrder : "generates"
    RFQ ||--o{ Invoice : "linked to"

    Quotation ||--o{ QuotationItem : "has"
    Quotation ||--o{ Approval : "approved via"
    Quotation ||--o{ PurchaseOrder : "becomes"

    PurchaseOrder ||--o{ PurchaseOrderItem : "has"
    PurchaseOrder ||--o| Invoice : "generates"

    Invoice ||--o{ InvoiceItem : "has"
```

### Table Descriptions

#### `Organization`
Top-level tenant entity. All users and vendors belong to an organization.

| Column | Type | Description |
|---|---|---|
| `id` | cuid | Primary key |
| `name` | String | Organization name |
| `details` | String? | Optional description |

#### `User`
All platform users — Admin, Procurement Officer, Manager, and Vendor logins.

| Column | Type | Description |
|---|---|---|
| `id` | cuid | Primary key |
| `firstName / lastName` | String | Display name |
| `email` | String (unique) | Login identifier |
| `passwordHash` | String | bcrypt hash |
| `role` | Enum | `ADMIN \| PROCUREMENT_OFFICER \| MANAGER_APPROVER \| VENDOR` |
| `isActive` | Boolean | Soft-disable account |
| `organizationId` | FK | Belongs to Organization |

#### `VendorCategory`
Taxonomy for classifying vendors (e.g., IT, Construction, Logistics).

#### `Vendor`
Vendor company record, linked 1:1 to a `User` for login purposes.

| Column | Type | Description |
|---|---|---|
| `id` | cuid | Primary key |
| `companyName` | String | Registered company name |
| `gstNumber` | String? | GST registration number |
| `contactEmail` | String (unique) | Primary contact |
| `status` | Enum | `PENDING \| ACTIVE \| BLOCKED \| INACTIVE` |
| `userId` | FK (unique) | Linked User account |
| `categoryId` | FK | Vendor category |

#### `RFQ` (Request for Quotation)
The central procurement document created by Procurement Officers.

| Column | Type | Description |
|---|---|---|
| `id` | cuid | Primary key |
| `title` | String | RFQ title / procurement purpose |
| `category` | String | Procurement category label |
| `deadline` | DateTime | Quote submission deadline |
| `status` | Enum | `DRAFT \| PUBLISHED \| CLOSED \| APPROVED \| REJECTED` |
| `selectedQuotationId` | FK (unique)? | Winning quotation reference |

#### `RFQItem`
Individual line items within an RFQ (products/services requested).

| Column | Type | Description |
|---|---|---|
| `itemName` | String | Product or service name |
| `quantity` | Float | Requested quantity |
| `unit` | String | Unit of measure (units, kg, lump sum, etc.) |

#### `RFQInvitation`
Junction table — which vendors are invited to which RFQs.

#### `RFQAttachment`
File attachments (specifications, SOW docs) uploaded to an RFQ.

#### `Quotation`
A vendor's price response to an RFQ.

| Column | Type | Description |
|---|---|---|
| `status` | Enum | `DRAFT \| SUBMITTED \| REVISED \| SELECTED \| REJECTED` |
| `subtotal` | Float | Sum of line items |
| `gstPercent` | Float | GST % applied |
| `grandTotal` | Float | Subtotal + GST |
| `paymentTerms` | String? | Payment terms from vendor |

#### `QuotationItem`
Line-item pricing for each `RFQItem` within a quotation.

| Column | Type | Description |
|---|---|---|
| `unitPrice` | Float | Per-unit quoted price |
| `quantity` | Float | Quantity priced |
| `deliveryDays` | Int | Quoted delivery timeline |
| `total` | Float | unitPrice × quantity |

#### `Approval`
Approval request record for a selected quotation.

| Column | Type | Description |
|---|---|---|
| `status` | Enum | `PENDING \| APPROVED \| REJECTED` |
| `requestedById` | FK | Procurement Officer who raised the request |
| `approverId` | FK? | Manager who actioned it |
| `remarks` | String? | Manager's notes on decision |
| `approvedAt / rejectedAt` | DateTime? | Timestamp of action |

#### `PurchaseOrder`
Official procurement document generated after approval.

| Column | Type | Description |
|---|---|---|
| `poNumber` | String (unique) | Auto-generated (e.g., `PO-2025-0001`) |
| `status` | Enum | `GENERATED \| SENT \| FULFILLED \| CANCELLED` |
| `subtotal / gstPercent / grandTotal` | Float | Financial summary |
| `approvedById` | FK | User who approved (denormalized for the PO doc) |

#### `Invoice`
Financial invoice generated from a Purchase Order.

| Column | Type | Description |
|---|---|---|
| `invoiceNumber` | String (unique) | Auto-generated (e.g., `INV-2025-0001`) |
| `status` | Enum | `DRAFT \| ISSUED \| SENT \| PAID \| OVERDUE` |
| `cgstPercent / sgstPercent` | Float | Split GST (CGST + SGST, each typically 9%) |
| `cgstAmount / sgstAmount / grandTotal` | Float | Calculated amounts |
| `dueDate` | DateTime | Payment due date |

#### `ActivityLog`
Immutable audit log of every significant action in the system.

#### `Notification`
In-app notification records per user, with read/unread state.

---

## 4. Authentication Implementation

### Architecture

VendorBridge uses **JWT-based stateless authentication** with **HTTP-only cookies** for security.

```mermaid
sequenceDiagram
    participant Client
    participant API as Auth API
    participant DB as PostgreSQL
    participant JWT as JWT Service
    participant MW as Middleware
    participant Route as Protected Route

    %% Login Flow
    Client->>API: POST /api/auth/login
    API->>DB: Find user by email
    DB-->>API: User record + password hash
    API->>API: Verify password (bcrypt)

    API->>JWT: signJWT({userId, email, role})
    JWT-->>API: Signed token

    API-->>Client: Set HttpOnly Cookie (vb_session)

    %% Protected Request Flow
    Client->>MW: Request protected page/API
    MW->>JWT: verifyJWT(vb_session)
    JWT-->>MW: {userId, email, role}

    MW->>MW: Validate RBAC permissions

    alt Authorized
        MW->>Route: Forward request
        Route-->>Client: Protected response
    else Unauthorized
        MW-->>Client: Redirect to /login
    end
```

### Key Files

| File | Responsibility |
|---|---|
| [`lib/jwt.ts`](./lib/jwt.ts) | `signJWT()`, `verifyJWT()`, `getSession()` — token creation and validation |
| [`lib/auth.ts`](./lib/auth.ts) | `requireAuth(roles[])` — helper used in route handlers to gate access |
| [`lib/password.ts`](./lib/password.ts) | `hashPassword()`, `comparePassword()`, `generatePassword()` using bcryptjs |
| [`middleware.ts`](./middleware.ts) | Next.js middleware — runs on every request, validates JWT, enforces RBAC at edge |
| [`app/api/auth/login/route.ts`](./app/api/auth/login/route.ts) | Login endpoint — validates credentials, issues JWT cookie |
| [`app/api/auth/signup/route.ts`](./app/api/auth/signup/route.ts) | Signup endpoint — hashes password, creates User record |
| [`app/api/auth/logout/route.ts`](./app/api/auth/logout/route.ts) | Clears the `vb_session` cookie |
| [`app/api/auth/me/route.ts`](./app/api/auth/me/route.ts) | Returns current session user details |

### JWT Payload Structure

```typescript
type SessionPayload = {
  userId: string;   // User's cuid from database
  email:  string;   // User's email
  role:   string;   // ADMIN | PROCUREMENT_OFFICER | MANAGER_APPROVER | VENDOR
}
```

### Cookie Configuration

```typescript
// Cookie name: vb_session
// Settings: HttpOnly, SameSite=Lax, Secure (in production)
// Expiry: 7 days (configurable via JWT_EXPIRES_IN env)
```

### Forgot Password Flow

```mermaid
sequenceDiagram
    Client->>API: POST /api/auth/forgot-password { email }
    API->>DB: Find user by email
    API->>API: Generate secure reset token (crypto.randomBytes)
    API->>DB: Store hashed token + expiry on user record
    API->>Nodemailer: Send reset link email
    Client->>API: POST /api/auth/reset-password { token, newPassword }
    API->>DB: Verify token + check expiry
    API->>API: Hash new password with bcrypt
    API->>DB: Update passwordHash, clear reset token
    API-->>Client: Success — redirect to login
```

---

## 5. Role-Based Access Control (RBAC)

### Role Definitions

```mermaid
graph TB
    subgraph Roles["User Roles"]
        A[👑 ADMIN]
        B[🧑‍💼 PROCUREMENT_OFFICER]
        C[✅ MANAGER_APPROVER]
        D[🏪 VENDOR]
    end

    subgraph Modules["Platform Modules"]
        M1[User Management]
        M2[Vendor Management]
        M3[RFQ Management]
        M4[Quotation Portal]
        M5[Approval Workflow]
        M6[Purchase Orders]
        M7[Invoices]
        M8[Reports & Analytics]
        M9[Activity Logs]
    end

    A -->|Full Access| M1
    A -->|Full Access| M2
    A -->|Read| M3
    A -->|Read| M5
    A -->|Full Access| M8
    A -->|Full Access| M9

    B -->|Create / Publish| M3
    B -->|Compare / Select| M4
    B -->|Request Approval| M5
    B -->|Generate| M6
    B -->|Generate / Send| M7
    B -->|View| M8
    B -->|Read Vendors| M2

    C -->|Approve / Reject| M5
    C -->|View| M3
    C -->|View| M6
    C -->|View| M8

    D -->|Submit Quotations| M4
    D -->|View Own RFQs| M3
    D -->|View Own POs| M6
    D -->|Manage Profile| M2
```

### RBAC Enforcement Layers

VendorBridge enforces RBAC at **two layers**:

#### Layer 1 — Next.js Middleware (Edge, `middleware.ts`)

The middleware runs before any route handler. It:
1. Reads the `vb_session` JWT cookie
2. Verifies the token signature
3. Checks path prefixes against role permissions
4. Blocks with `403 Forbidden` if role is insufficient
5. Forwards `x-user-id` and `x-user-role` headers to route handlers

```typescript
// middleware.ts — simplified logic
const ADMIN_PATHS = ["/admin", "/api/admin"];

if (isAdminPath(pathname) && session.role !== "ADMIN") {
  // Exception: PROCUREMENT_OFFICER & MANAGER_APPROVER can read vendor list
  const isVendorReadApi = pathname.startsWith("/api/admin/vendors");
  const allowedRoles = ["PROCUREMENT_OFFICER", "MANAGER_APPROVER"];
  if (!isVendorReadApi || !allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
```

#### Layer 2 — Route Handler Guards (`requireAuth`)

Every API route handler also calls `requireAuth()` as a second line of defense:

```typescript
// lib/auth.ts
export async function requireAuth(allowedRoles?: Role[]): Promise<SessionPayload | null> {
  const session = await getSession();          // reads & verifies JWT cookie
  if (!session) return null;                   // unauthenticated
  if (allowedRoles && !allowedRoles.includes(session.role as Role)) return null;
  return session;
}

// Usage in a route handler:
export async function POST(req: NextRequest) {
  const session = await requireAuth(["PROCUREMENT_OFFICER", "ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // ... proceed
}
```

### RBAC Permission Matrix

| Feature | Admin | Procurement Officer | Manager Approver | Vendor |
|---|:---:|:---:|:---:|:---:|
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Register Vendors | ✅ | ❌ | ❌ | ❌ |
| View Vendor List | ✅ | ✅ | ✅ | ❌ |
| Create RFQ | ❌ | ✅ | ❌ | ❌ |
| Publish RFQ | ❌ | ✅ | ❌ | ❌ |
| View RFQ (own org) | ✅ | ✅ | ✅ | ✅ (invited only) |
| Submit Quotation | ❌ | ❌ | ❌ | ✅ |
| Select Winning Quote | ❌ | ✅ | ❌ | ❌ |
| Request Approval | ❌ | ✅ | ❌ | ❌ |
| Approve / Reject | ❌ | ❌ | ✅ | ❌ |
| Generate PO | ❌ | ✅ | ❌ | ❌ |
| Generate Invoice | ❌ | ✅ | ❌ | ❌ |
| Mark Invoice Paid | ❌ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ |
| Activity Logs | ✅ | ✅ | ✅ | ❌ |

---

## 6. Procurement Workflow

### Full Lifecycle Flow

```mermaid
flowchart TD
    A([🧑‍💼 Procurement Officer]) --> B[Create RFQ\nwith line items & vendor invitations]
    B --> C{RFQ Status:\nDRAFT}
    C --> D[Publish RFQ]
    D --> E{RFQ Status:\nPUBLISHED}

    E --> F([🏪 Vendor receives invitation])
    F --> G[Submit Quotation\nwith itemized pricing]
    G --> H{Quotation Status:\nSUBMITTED}

    H --> I[Procurement Officer\nCompares Quotations]
    I --> J[Select Winning Quotation]
    J --> K{Quotation Status:\nSELECTED}

    K --> L[Request Manager Approval]
    L --> M([✅ Manager Approver])

    M --> N{Decision}
    N -->|APPROVE| O{Approval Status:\nAPPROVED}
    N -->|REJECT| P{Approval Status:\nREJECTED}

    P --> Q[Procurement Officer\nReviews & can re-submit]

    O --> R[Generate Purchase Order]
    R --> S{PO Status:\nGENERATED / SENT}

    S --> T[Generate Invoice from PO]
    T --> U{Invoice Status:\nISSUED}

    U --> V{Invoice Actions}
    V --> W[📥 Download PDF]
    V --> X[🖨️ Print Invoice]
    V --> Y[📧 Email Invoice to Vendor]
    V --> Z[✅ Mark as PAID]

    Z --> AA{Invoice Status:\nPAID}
```

### Status State Machines

#### RFQ Status
```mermaid
stateDiagram-v2
    [*] --> DRAFT : Created
    DRAFT --> PUBLISHED : Officer publishes
    PUBLISHED --> CLOSED : Deadline passed / manually closed
    PUBLISHED --> APPROVED : Approval granted
    PUBLISHED --> REJECTED : Approval rejected
    APPROVED --> [*]
    REJECTED --> PUBLISHED : Re-submitted
```

#### Quotation Status
```mermaid
stateDiagram-v2
    [*] --> DRAFT : Vendor starts quote
    DRAFT --> SUBMITTED : Vendor submits
    SUBMITTED --> REVISED : Vendor revises before deadline
    SUBMITTED --> SELECTED : Officer selects as winner
    SELECTED --> [*]
    SUBMITTED --> REJECTED : Not selected
```

#### Approval Status
```mermaid
stateDiagram-v2
    [*] --> PENDING : Officer requests approval
    PENDING --> APPROVED : Manager approves
    PENDING --> REJECTED : Manager rejects with remarks
    APPROVED --> [*]
    REJECTED --> [*]
```

---

## 7. Module Breakdown

### Module 1 — Authentication (`/login`, `/signup`, `/forgot-password`)
- Email + password login with bcrypt verification
- Signup with role selection (defaults to PROCUREMENT_OFFICER)
- Forgot password with time-limited token emailed to user
- JWT session stored in HTTP-only cookie `vb_session`
- Client-side form validation + server-side validation

### Module 2 — Dashboard (`/dashboard`)
- Real-time procurement summary cards (Active RFQs, Pending Approvals, PO Value, Invoices)
- Recent RFQs, purchase orders, and invoices tables
- Quick action buttons (Create RFQ, View Vendors)
- Role-aware — Vendor sees their quotations; Officer sees procurement overview

### Module 3 — Vendor Management (`/vendors`)
- Admin: register new vendors (generates login credentials, emails them)
- List with search, status filter, and category filter
- Individual vendor profiles with GST, contact details, address
- Vendor status management (ACTIVE, BLOCKED, PENDING, INACTIVE)

### Module 4 — RFQ Management (`/rfqs`)
- Create RFQs with dynamic line item forms
- Attach files (spec sheets, SOW documents)
- Invite specific vendors from the registered vendor pool
- Publish RFQs to make them visible to invited vendors
- View all submitted quotations per RFQ

### Module 5 — Quotation Portal (Vendor-side: `/vendor/rfqs`)
- Vendors see only RFQs they were invited to
- Itemized quotation form (per-RFQ-item pricing)
- Draft save and final submission
- View submitted quotation status

### Module 6 — Quotation Comparison (`/rfqs/[id]/comparison`)
- Side-by-side vendor comparison
- Lowest price per line item highlighted in green
- Delivery timeline comparison
- Total cost ranking
- One-click winner selection

### Module 7 — Approval Workflow (`/approvals`)
- Procurement Officer requests approval after selecting a winner
- Manager sees all PENDING approvals in a queue
- Approve with one click, or Reject with mandatory remarks
- Full approval timeline with timestamps
- Notifications sent on approve/reject

### Module 8 — Purchase Orders (`/purchase-orders`)
- Auto-generated on approval (PO number: `PO-YYYY-NNNN`)
- PO contains all line items, vendor details, GST breakdown
- Status management: GENERATED → SENT → FULFILLED
- Link to generated invoice

### Module 9 — Invoices (`/invoices`)
- Generated from PO with split CGST + SGST calculation
- Invoice number: `INV-YYYY-NNNN`
- Download as PDF (jsPDF + html2canvas)
- Print directly from browser
- Email invoice to vendor via Nodemailer
- Status: DRAFT → ISSUED → SENT → PAID → OVERDUE

### Module 10 — Reports & Analytics (`/reports`)
- Procurement spending summary
- Monthly trend charts
- Spend by vendor category (pie/bar)
- Top vendors by order value
- Exportable reports (CSV)

### Module 11 — Activity Logs & Notifications (`/activity-logs`, `/notifications`)
- Every action (create RFQ, approve, generate PO, etc.) creates an `ActivityLog`
- In-app notification bell with unread count (powered by background polling for real-time updates)
- Mark individual or all notifications as read
- Full activity timeline with timestamps and actor details

---

## 8. Email Service

VendorBridge uses **Nodemailer** with SMTP (configured for Gmail/any SMTP provider).

### Configuration

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="VendorBridge <your@gmail.com>"
```

### Email Triggers

| Trigger | Recipient | Content |
|---|---|---|
| Vendor registered by Admin | Vendor | Company name, login email, auto-generated password |
| Invoice emailed | Vendor | Invoice PDF attachment with full breakdown |
| Forgot password | User | Time-limited password reset link |

### Email Implementation

```typescript
// lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendCredentialsEmail(email, name, password) { ... }
export async function sendInvoiceEmail(email, name, invoiceHtml) { ... }
```

---

## 9. API Routes Reference

### Auth Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate and issue JWT cookie |
| POST | `/api/auth/signup` | Public | Register a new user |
| POST | `/api/auth/logout` | Any | Clear session cookie |
| GET | `/api/auth/me` | Any | Get current user details |
| POST | `/api/auth/forgot-password` | Public | Send password reset email |

### Admin Routes (ADMIN only)

| Method | Path | Description |
|---|---|---|
| GET / POST | `/api/admin/vendors` | List vendors / Register new vendor |
| GET / PATCH / DELETE | `/api/admin/vendors/[id]` | Vendor detail, update, delete |
| GET / POST | `/api/admin/vendor-categories` | Manage vendor categories |
| GET / POST | `/api/admin/users` | List users / Create user |
| GET | `/api/admin/activity-logs` | System-wide audit log |

### RFQ Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET / POST | `/api/rfqs` | Officer/Admin | List RFQs / Create RFQ |
| GET / PATCH / DELETE | `/api/rfqs/[id]` | Officer/Admin | RFQ detail, update, delete |
| POST | `/api/rfqs/[id]/publish` | Officer | Publish RFQ to vendors |
| GET / POST | `/api/rfqs/[id]/vendors` | Officer | Manage vendor invitations |
| GET | `/api/rfqs/[id]/quotations` | Officer | List quotations for RFQ |
| GET | `/api/rfqs/[id]/comparison` | Officer | Comparison view data |
| POST | `/api/rfqs/[id]/approval-request` | Officer | Request manager approval |
| GET | `/api/rfqs/[id]/approval-timeline` | Officer/Manager | Approval history |
| POST | `/api/rfqs/[id]/purchase-order` | Officer | Generate PO after approval |
| GET / POST | `/api/rfqs/[id]/attachments` | Officer | Upload / list attachments |

### Quotation Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET / PATCH | `/api/quotations/[id]` | Officer/Vendor | Quotation detail / update |
| POST | `/api/quotations/[id]/select` | Officer | Select as winning quotation |

### Vendor-side Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/vendor/rfqs` | Vendor | List invited RFQs |
| GET | `/api/vendor/rfqs/[id]` | Vendor | RFQ detail with items |
| POST | `/api/vendor/rfqs/[id]/quotation` | Vendor | Submit quotation |
| GET / PATCH | `/api/vendor/quotations/[id]` | Vendor | Own quotation management |
| GET / PATCH | `/api/vendor/profile` | Vendor | View / update vendor profile |

### Approval Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/approvals` | Manager/Officer | List approvals |
| POST | `/api/approvals/[id]/approve` | Manager | Approve request |
| POST | `/api/approvals/[id]/reject` | Manager | Reject with remarks |

### Purchase Order Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/purchase-orders` | Officer/Manager | List POs |
| GET | `/api/purchase-orders/[id]` | Officer/Manager | PO detail |
| PATCH | `/api/purchase-orders/[id]/status` | Officer | Update PO status |
| POST | `/api/purchase-orders/[id]/invoice` | Officer | Generate invoice from PO |

### Invoice Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/invoices` | Officer/Manager | List invoices |
| GET | `/api/invoices/[id]` | Officer/Manager | Invoice detail |
| PATCH | `/api/invoices/[id]/paid` | Officer | Mark as paid |
| POST | `/api/invoices/[id]/email` | Officer | Email invoice to vendor |
| GET | `/api/invoices/[id]/pdf` | Officer | PDF generation data |

### Utility Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Any | User notifications |
| PATCH | `/api/notifications/[id]/read` | Any | Mark notification read |
| PATCH | `/api/notifications/read-all` | Any | Mark all read |
| GET | `/api/activity-logs` | Officer/Manager/Admin | User activity logs |
| GET | `/api/reports/summary` | Officer/Manager/Admin | Procurement summary |
| GET | `/api/reports/monthly-trends` | Officer/Manager/Admin | Monthly trend data |
| GET | `/api/reports/spend-by-category` | Officer/Manager/Admin | Category spend |
| GET | `/api/reports/top-vendors` | Officer/Manager/Admin | Top vendors by PO value |
| GET | `/api/reports/export` | Officer/Manager/Admin | Export data as CSV |

---

## 10. Getting Started

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** (local or cloud — Neon, Railway, Supabase)
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/vendorbridge.git
cd vendorbridge

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vendorbridge"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# SMTP (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASS="your-google-app-password"
SMTP_FROM="VendorBridge <your@gmail.com>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Running the App

```bash
# Development server
npm run dev

# Open http://localhost:3000
```

---

## 11. Database Seeding

Seeding is a two-step process to maintain data consistency:

### Step 1 — Master Data (Direct SQL)

Seeds the Organization, Users, Vendor Categories, and Vendors directly via PostgreSQL:

```bash
npm run db:seed
```

This creates:

| Role | Email | Password |
|---|---|---|
| Admin | admin@vendorbridge.com | Admin@123 |
| Procurement Officer | officer@vendorbridge.com | Officer@123 |
| Manager Approver | manager@vendorbridge.com | Manager@123 |
| Vendor (IT) | vendor@technova.com | Vendor@123 |
| Vendor (Office) | vendor@officeedge.com | Vendor@123 |
| Vendor (Construction) | vendor@buildright.com | Vendor@123 |
| Vendor (Print) | vendor@printpro.com | Vendor@123 |
| Vendor (Logistics) | vendor@logitrack.com | Vendor@123 |

### Step 2 — Workflow Data (API-based)

Drives the complete procurement cycle through live HTTP API calls (requires dev server running):

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run db:seed:workflow
```

This seeds **7 complete procurement scenarios**:

| RFQ | Final State | Scenario |
|---|---|---|
| Laptop & Workstation Procurement | PO SENT · Invoice **PAID** | Full cycle, happy path |
| Annual Office Supplies | PO SENT · Invoice **ISSUED** | Outstanding invoice |
| HQ Canteen Renovation | PO **FULFILLED** · Invoice PAID | Completed project |
| Q3 Inbound Freight | PO SENT · Invoice **ISSUED** | Ongoing contract |
| Annual Report Printing | Approval **REJECTED** | Budget overrun scenario |
| IT Helpdesk AMC | **PUBLISHED** · No quotation | Open invite state |
| Housekeeping Contract | **DRAFT** | Never published |

### Seeding Architecture

```mermaid
flowchart LR
    A[prisma/seed.mjs\nDirect PG SQL] -->|Step 1| B[(PostgreSQL\nOrg, Users,\nCategories, Vendors)]
    
    C[scripts/seed-workflow.mjs\nHTTP API calls] -->|Step 2| D[Next.js API Routes]
    D --> B
    
    C --> E{Workflow Steps}
    E --> F[1. Login all actors]
    F --> G[2. Create 7 RFQs]
    G --> H[3. Publish RFQs]
    H --> I[4. Vendors submit quotes]
    I --> J[5. Select winners]
    J --> K[6. Request approvals]
    K --> L[7. Manager approves/rejects]
    L --> M[8. Generate POs]
    M --> N[9. Generate Invoices]
    N --> O[10. Set final statuses]
```

---

## 12. Project Structure

```
vendorbridge/
├── app/
│   ├── page.tsx                    # Landing page (hero)
│   ├── layout.tsx                  # Root layout (Inter font, metadata)
│   ├── globals.css                 # Design system (CSS variables, components)
│   ├── (auth)/                     # Auth pages group (no sidebar)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/                # Dashboard pages group (with sidebar)
│   │   ├── layout.tsx              # Sidebar + topbar shell
│   │   ├── dashboard/page.tsx
│   │   ├── vendors/
│   │   ├── rfqs/
│   │   ├── approvals/
│   │   ├── purchase-orders/
│   │   ├── invoices/
│   │   ├── reports/
│   │   ├── activity-logs/
│   │   └── admin/                  # Admin-only pages
│   └── api/                        # API route handlers
│       ├── auth/
│       ├── admin/
│       ├── rfqs/
│       ├── quotations/
│       ├── vendor/
│       ├── approvals/
│       ├── purchase-orders/
│       ├── invoices/
│       ├── notifications/
│       ├── activity-logs/
│       └── reports/
├── lib/
│   ├── jwt.ts                      # JWT sign/verify/getSession
│   ├── auth.ts                     # requireAuth() guard helper
│   ├── password.ts                 # bcrypt helpers
│   ├── email.ts                    # Nodemailer transport & templates
│   ├── activity.ts                 # logActivity() & createNotification()
│   └── prisma.ts                   # Prisma singleton client
├── middleware.ts                   # Edge middleware (RBAC enforcement)
├── prisma/
│   ├── schema.prisma               # Database schema (14 models, 7 enums)
│   ├── migrations/                 # Migration history
│   └── seed.mjs                    # Master data seeder (direct SQL)
├── scripts/
│   └── seed-workflow.mjs           # Workflow seeder (API-driven)
├── generated/
│   └── prisma/                     # Auto-generated Prisma client
├── prisma.config.ts                # Prisma configuration
├── next.config.ts                  # Next.js configuration
└── package.json
```

---

## Design Decisions

### Why HTTP-only Cookies for JWT?
Storing JWT in `localStorage` is vulnerable to XSS attacks. HTTP-only cookies are inaccessible to JavaScript, making them the secure choice for session storage.

### Why Two-Layer RBAC?
The middleware provides fast edge-level protection (before any DB query runs). The route handler `requireAuth()` provides defense-in-depth for direct API calls that may bypass middleware in certain configurations.

### Why API-based Seeding?
Running the workflow seeder through actual API routes ensures all business logic (GST calculations, status state machines, activity log creation, notifications) is exercised exactly as production would. Direct DB inserts would skip all this logic and leave the data in an inconsistent state.

### Why Vanilla CSS?
The custom design system gives full control over the UI without Tailwind's class explosion or Chakra/MUI's abstraction overhead. All design tokens (colors, radius, shadow, spacing) are CSS custom properties, making global theming trivial.

---

## 13. Future Scope for Scalability

As VendorBridge grows to handle high-volume procurement across multiple organizations, the following architectural enhancements are planned:

- **Redis Caching**: Implement Redis to cache frequently accessed data (e.g., active RFQs, vendor profiles, configuration data) to reduce database load and improve response times.
- **Asynchronous Task Queuing**: Offload heavy operations like PDF generation and email dispatch to a background worker queue (e.g., BullMQ or AWS SQS) rather than blocking the main thread.
- **WebSockets / Server-Sent Events (SSE)**: Replace the current notification polling mechanism with persistent WebSocket connections (e.g., via Socket.io or Pusher) for instant, low-overhead real-time updates.
- **Database Read Replicas**: Separate read queries (like reporting and dashboard analytics) from write operations to ensure high availability during peak procurement cycles.
- **Microservices Architecture**: Extract heavy modules (such as the Invoice/PO generation and email services) into separate microservices to scale them independently from the core monolithic API.

---

<div align="center">

Built with ❤️ using **Next.js**, **PostgreSQL**, **Prisma ORM**, and **Nodemailer**

</div>
