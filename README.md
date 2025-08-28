# AWS CTF Backend API Documentation

## Overview
This backend powers the AWS CTF registration and management system. It supports team and solo registrations, payment integration, role-based dashboards, join requests, and organizer/admin controls. All endpoints are RESTful and secured with JWT authentication.

---

## Authentication
- **Register:** `POST /api/auth/register`
- **Login:** `POST /api/auth/login`
- **Email Verification:** `GET /api/auth/verify-email?token=...`
- **Create Organizer:** `POST /api/auth/create-organizer` (admin only, protected by secret)

---

## Registration
- **Team Registration:** `POST /api/register/team` (leader only)
- **Solo Registration:** `POST /api/register/solo` (solo only)

---

## Payments
- **Create Order:** `POST /api/payments/create-order`
- **Webhook:** `POST /api/payments/webhook` (Cashfree callback)

---

## Dashboard (Role-Based)
- **Leader Dashboard:** `GET /api/dashboard/leader`
- **Member Dashboard:** `GET /api/dashboard/member`
- **Solo Dashboard:** `GET /api/dashboard/solo`
- **Organizer Dashboard:** `GET /api/dashboard/organizer`

---

## Join Requests
- **Solo requests to join team:** `POST /api/requests/request`
- **Leader views requests:** `GET /api/requests/leader`
- **Leader acts on request:** `POST /api/requests/leader/act`

---

## Organizer/Admin Endpoints
- **View all teams:** `GET /api/admin/teams`
- **View all solos:** `GET /api/admin/solos`
- **View all payments:** `GET /api/admin/payments`
- **Remove team:** `DELETE /api/admin/team/:id`
- **Remove user:** `DELETE /api/admin/user/:id`
- **Approve/reject join request:** `POST /api/admin/join-request/:id/act`
- **Export participants (CSV):** `GET /api/admin/export/participants`
- **Export teams (CSV):** `GET /api/admin/export/teams`
- **Registration status (open/close):** `POST /api/admin/registration-status` / `GET /api/admin/registration-status`

---

## Security & Best Practices
- All endpoints (except register/login/verify) require JWT in `Authorization: Bearer <token>` header.
- Passwords must be strong (min 8 chars, upper/lowercase, number, symbol).
- Email verification required for login.
- Rate limiting and account lockout are enforced.
- All input is validated and sanitized.

---

## Models (Simplified)
- **User:** name, registrationNumber, yearOfStudy, phoneNumber, email, residenceType, role, team, passwordHash, isEmailVerified
- **Team:** teamName, leader, members, maxSize, payment, isLocked
- **Payment:** amountInPaise, currency, status, mode, cashfreeOrderId, cashfreePaymentId, referenceId, payer
- **JoinRequest:** team, soloParticipant, status

---

## Registration Flow
1. User selects registration type (team/solo).
2. Fills form and registers.
3. Receives verification email.
4. Logs in after verifying email.
5. Proceeds to payment (Cashfree).
6. After payment, redirected to dashboard.
7. Solo can request to join teams; leaders can accept/reject.
8. Organizer can manage all data and export as needed.

---

## Contact
For any backend/API issues, contact the AWS Web DEV TEAM / Cloud captain.


Dev scripts

```bash
npm run dev
```

Environment variables

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/ticketing_system
CASHFREE_ENV=sandbox
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
JWT_SECRET=change_this_secret
```

Health check: GET `/health`

Quick start

```bash
cp .env.example .env # or create .env using vars above
npm run dev
```