Below is a **complete API list (production-level)** for your **Multi-Party NBFC Lending Platform**, including:

* Loan lifecycle
* Interest engine
* EMI management
* Payment flows
* Audit logs
* Account ledger
* Admin operations
* Dashboards
* Notifications
* KYC
* Dealer collections
* Lender approvals

This is **ONLY API LISTING** (as you requested) — **no implementation**.

---

# Complete API List – NBFC Lending Platform

## 1. Authentication APIs

Handles login, session, and role-based authentication.

```
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh-token
POST   /auth/change-password
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/profile
PUT    /auth/profile/update
```

---

# 2. User Management (Admin)

```
POST   /admin/users
GET    /admin/users
GET    /admin/users/:userId
PUT    /admin/users/:userId
DELETE /admin/users/:userId

PUT    /admin/users/:userId/activate
PUT    /admin/users/:userId/deactivate

GET    /admin/users/roles
```

---

# 3. Dealer Management

```
POST   /dealers
GET    /dealers
GET    /dealers/:dealerId
PUT    /dealers/:dealerId
DELETE /dealers/:dealerId

GET    /dealers/:dealerId/loans
GET    /dealers/:dealerId/collections
GET    /dealers/:dealerId/earnings
```

---

# 4. Lender Management

```
POST   /lenders
GET    /lenders
GET    /lenders/:lenderId
PUT    /lenders/:lenderId
DELETE /lenders/:lenderId

GET    /lenders/:lenderId/portfolio
GET    /lenders/:lenderId/collections
```

---

# 5. Customer Management

```
POST   /customers
GET    /customers
GET    /customers/my — query: page, limit, startDate, endDate, **search** (optional; matches name, phone, or email, case-insensitive partial)
GET    /customers/:customerId
PUT    /customers/:customerId
DELETE /customers/:customerId

GET    /customers/:customerId/loans
GET    /customers/:customerId/emis
GET    /customers/:customerId/payments
```

---

# 6. KYC Management

```
POST   /kyc/upload
GET    /kyc/:customerId
PUT    /kyc/:customerId/verify
PUT    /kyc/:customerId/reject

POST   /kyc/pan-verify
POST   /kyc/aadhar-verify
```

---

# 7. Loan Product Management

```
POST   /loan-products
GET    /loan-products
GET    /loan-products/:productId
PUT    /loan-products/:productId
DELETE /loan-products/:productId
```

---

# 8. Interest Rate Management

Lenders configure rates.

```
POST   /interest-rates
GET    /interest-rates
GET    /interest-rates/:rateId
PUT    /interest-rates/:rateId
DELETE /interest-rates/:rateId
       `processingFee` on interest-rate config = **percentage of loan principal** (0–100), not a fixed fee.

GET    /interest-rates/lender/:lenderId
GET    /interest-rates/by-category
       Admin, lender, dealer. All rates grouped by `productCategory` (`byCategory` map + `categories[]` with counts).
       Each rate: `id`, `productCategory`, `interestRate`, `processingFee`, `createdAt` — no `lenderId`; use `id` as `rateId` for EMI preview.
```

---

# 9. Loan Application APIs

```
POST   /loans/calculate-emi-preview
       Dealer only. Body: `loanAmount`, `tenureMonths`, `rateId` (interest_rates _id).
       Reads annual % and file-charge % from that row; returns `monthlyEmi`, `processingFeeAmount`, `schedule[]` (not stored).

POST   /loans/apply
GET    /loans
GET    /loans/:loanId

PUT    /loans/:loanId/update
DELETE /loans/:loanId/cancel

GET    /loans/status/:status
```

Loan statuses

```
APPLIED
KYC_PENDING
UNDER_REVIEW
APPROVED
REJECTED
DISBURSED
CLOSED
DEFAULTED
```

---

# 10. Loan Approval APIs (Lender)

```
PUT   /loans/:loanId/approve
      Body `processingFee` (optional): **% of loan principal** override. If omitted, uses lender’s `interest_rates` row for the loan product’s category.
      Contract stores rupee fee as `processingFee` and the % used as `processingFeePercent`.
PUT   /loans/:loanId/reject

GET   /lender/loan-approvals
```

---

# 11. Loan Disbursement APIs

```
POST   /loans/:loanId/disburse

GET    /disbursements
GET    /disbursements/:loanId
```

---

# 12. EMI Schedule APIs

```
GET   /loans/:loanId/emi-schedule
POST  /loans/:loanId/generate-emi

GET   /emis
      Dealer: query `pendingDueMonth` = `current` (default) | `previous` | `all`.
      Returns only unpaid EMIs (PENDING, OVERDUE, PARTIAL); default = due in current calendar month.
GET   /emis/:emiId
GET   /emis/loan/:loanId
```

---

# 13. EMI Payment APIs

```
POST   /emis/:emiId/pay

POST   /payments/create
GET    /payments
GET    /payments/:paymentId
GET    /payments/loan/:loanId
```

---

# 14. Razorpay Payment APIs

```
POST   /payments/razorpay/create-order
POST   /payments/razorpay/webhook
POST   /payments/razorpay/verify
```

---

# 15. Dealer Cash Collection APIs

```
POST   /dealer/collections/record

GET    /dealer/collections
GET    /dealer/collections/:collectionId
```

Status Flow

```
COLLECTED
PENDING_LENDER_CONFIRMATION
APPROVED
REJECTED
```

---

# 16. Lender Cash Approval APIs

```
GET   /lender/collections/pending

PUT   /lender/collections/:collectionId/approve
PUT   /lender/collections/:collectionId/reject
```

---

# 17. Early Payment / Prepayment APIs

```
POST   /loans/:loanId/prepayment

GET    /loans/:loanId/prepayment-calc
```

Triggers:

```
Regenerate EMI schedule
Reduce principal
Update ledger
```

---

# 18. NPA Monitoring APIs

```
GET   /npa/30days
GET   /npa/60days
GET   /npa/90days

GET   /npa/loans
```

---

# 19. Dashboard APIs

## Admin Dashboard

```
GET   /dashboard/admin/overview
GET   /dashboard/admin/disbursement
GET   /dashboard/admin/collections
GET   /dashboard/admin/npa
```

---

## Lender Dashboard

```
GET   /dashboard/lender/portfolio
GET   /dashboard/lender/disbursement
GET   /dashboard/lender/outstanding
GET   /dashboard/lender/npa
GET   /dashboard/lender/pending-collections
```

---

## Dealer Dashboard

```
GET   /dashboard/dealer/sales-funnel
GET   /dashboard/dealer/collections
GET   /dashboard/dealer/earnings
```

---

## Customer Dashboard

```
GET   /dashboard/customer/loans
GET   /dashboard/customer/emis
GET   /dashboard/customer/payment-history
```

---

# 20. Notification APIs

```
POST   /notifications/send
GET    /notifications
GET    /notifications/:id
```

Channels

```
SMS
EMAIL
WHATSAPP
PUSH
```

---

# 21. Document Management APIs

```
POST   /documents/upload
GET    /documents/:documentId
DELETE /documents/:documentId
```

---

# 22. Audit Log APIs (VERY IMPORTANT)

Tracks **every action** in system.

```
GET   /audit-logs
GET   /audit-logs/:id
GET   /audit-logs/user/:userId
GET   /audit-logs/entity/:entityId
```

Audit event examples

```
USER_LOGIN
USER_CREATED
LOAN_APPLIED
LOAN_APPROVED
LOAN_REJECTED
LOAN_DISBURSED
EMI_PAYMENT
CASH_COLLECTION
LENDER_APPROVAL
KYC_VERIFIED
```

---

# 23. Account Ledger APIs (Financial Accounting)

This is **double entry ledger system**.

```
GET   /ledger/accounts
GET   /ledger/accounts/:accountId

POST  /ledger/entries

GET   /ledger/entries
GET   /ledger/entries/:entryId
GET   /ledger/entries/loan/:loanId
```

---

Ledger account types

```
CUSTOMER_LOAN_ACCOUNT
LENDER_SETTLEMENT_ACCOUNT
DEALER_COMMISSION_ACCOUNT
INTEREST_INCOME_ACCOUNT
PRINCIPAL_RECEIVABLE_ACCOUNT
CASH_COLLECTION_ACCOUNT
PAYMENT_GATEWAY_ACCOUNT
```

---

# 24. Reports APIs

```
GET   /reports/disbursement
GET   /reports/collections
GET   /reports/interest-income
GET   /reports/loan-performance
GET   /reports/npa
```

---

# 25. Admin Configuration APIs

```
POST   /config
GET    /config
PUT    /config/:configId
```

Examples

```
late_fee
penalty_rate
emi_grace_days
dealer_commission_rate
```

---

# TOTAL APIs

Approx production system:

```
Authentication         ~7
User Management        ~8
Dealer                 ~7
Lender                 ~6
Customer               ~7
KYC                    ~5
Loan Products          ~5
Interest Rates         ~6
Loan Lifecycle         ~8
Disbursement           ~3
EMI                    ~4
Payments               ~5
Razorpay               ~3
Dealer Collections     ~3
Lender Approvals       ~3
Prepayment             ~2
NPA                    ~4
Dashboards             ~10
Notifications          ~3
Documents              ~3
Audit Logs             ~4
Ledger                 ~5
Reports                ~5
Config                 ~3
```

### TOTAL ≈ **120 APIs**

---

# Real Production Systems

Fintech platforms like

* Razorpay
* Lendingkart
* MoneyTap

typically have **150–300 APIs**.

Your design is **already near production grade**.

---

# Next Important Step (Very Important)

You should now design **12 Core Database Collections**.

Example:

```
users
customers
dealers
lenders
loan_products
loans
emi_schedule
payments
collections
ledger_accounts
ledger_entries
audit_logs
documents
```

---

If you want, I can also show you the **complete Fintech Production Architecture (used by NBFC systems)** including:

* **Loan State Machine**
* **Ledger Double Entry Design**
* **EMI generation algorithm**
* **Audit log architecture**
* **Collections architecture**

This will make your platform **NBFC production grade**.
