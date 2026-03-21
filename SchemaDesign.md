Below is a **production-level database schema design** for your **Multi-Party NBFC Lending Platform**.
This includes **all major collections required for lending systems** such as loan lifecycle, EMI tracking, ledger accounting, collections, and audit logs.

This design assumes:

* **Backend:** Node.js + Express (like your current projects)
* **Database:** **MongoDB**
* **ODM:** **Mongoose**

---

# 1. Users Collection

System users: Admin, Lender staff, Dealer staff.

### `users`

```js
{
  _id: ObjectId,

  name: String,
  email: String,
  phone: String,

  passwordHash: String,

  role: {
    type: String,
    enum: ["ADMIN", "LENDER", "DEALER"]
  },

  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"]
  },

  lenderId: ObjectId,
  dealerId: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

Indexes

```
email unique
phone unique
role
```

---

# 2. Customers

### `customers`

```js
{
  _id: ObjectId,

  name: String,
  phone: String,
  email: String,
  dob: Date,

  address: {
    line1: String,
    city: String,
    state: String,
    pincode: String
  },

  kycStatus: {
    type: String,
    enum: ["PENDING","VERIFIED","REJECTED"]
  },

  createdByDealer: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

Indexes

```
phone
createdByDealer
```

---

# 3. Dealers

### `dealers`

```js
{
  _id: ObjectId,

  dealerName: String,
  ownerName: String,

  phone: String,
  email: String,

  address: {
    city: String,
    state: String
  },

  commissionRate: Number,

  status: {
    type: String,
    enum: ["ACTIVE","SUSPENDED"]
  },

  createdAt: Date
}
```

---

# 4. Lenders

### `lenders`

```js
{
  _id: ObjectId,

  lenderName: String,

  contactPerson: String,
  email: String,
  phone: String,

  settlementAccount: String,

  status: {
    type: String,
    enum: ["ACTIVE","INACTIVE"]
  },

  createdAt: Date
}
```

---

# 5. Loan Products

Example

```
Auto Loan
Battery Loan
Personal Loan
```

### `loan_products`

```js
{
  _id: ObjectId,

  productName: String,

  category: {
    type: String,
    enum: ["AUTO","BATTERY","PERSONAL"]
  },

  minAmount: Number,
  maxAmount: Number,

  minTenure: Number,
  maxTenure: Number,

  createdAt: Date
}
```

---

# 6. Interest Rate Configuration

Each lender sets interest rates.

### `interest_rates`

```js
{
  _id: ObjectId,

  lenderId: ObjectId,

  productCategory: String,

  interestRate: Number,

  // % of loan principal (not a fixed rupee amount)
  processingFee: Number,

  createdAt: Date
}
```

---

# 7. Loan Applications

Customer applies for loan.

### `loan_applications`

```js
{
  _id: ObjectId,

  customerId: ObjectId,
  dealerId: ObjectId,

  productId: ObjectId,

  loanAmount: Number,
  tenure: Number,

  status: {
    type: String,
    enum: [
      "APPLIED",
      "KYC_PENDING",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED"
    ]
  },

  lenderAssigned: ObjectId,

  createdAt: Date
}
```

---

# 8. Loan Contracts (After Approval)

Created once loan is approved.

### `loan_contracts`

```js
{
  _id: ObjectId,

  loanApplicationId: ObjectId,

  customerId: ObjectId,
  dealerId: ObjectId,
  lenderId: ObjectId,

  principalAmount: Number,
  interestRate: Number,

  tenureMonths: Number,

  // Rupee amount at approval: principalAmount * (processingFeePercent / 100)
  processingFee: Number,
  processingFeePercent: Number,

  emiAmount: Number,

  disbursedAmount: Number,

  disbursementDate: Date,

  loanStatus: {
    type: String,
    enum: [
      "DISBURSED",
      "ACTIVE",
      "DELINQUENT",
      "NPA",
      "CLOSED"
    ]
  },

  createdAt: Date
}
```

---

# 9. EMI Schedule

### `emi_schedule`

```js
{
  _id: ObjectId,

  loanId: ObjectId,

  emiNumber: Number,

  dueDate: Date,

  emiAmount: Number,

  principalComponent: Number,
  interestComponent: Number,

  remainingPrincipal: Number,

  status: {
    type: String,
    enum: [
      "PENDING",
      "PAID",
      "OVERDUE",
      "PARTIAL"
    ]
  },

  createdAt: Date
}
```

Indexes

```
loanId
dueDate
status
```

---

# 10. Payments

Tracks all EMI payments.

### `payments`

```js
{
  _id: ObjectId,

  loanId: ObjectId,
  emiId: ObjectId,

  amount: Number,

  paymentMode: {
    type: String,
    enum: ["RAZORPAY","UPI","CASH","BANK"]
  },

  transactionId: String,

  status: {
    type: String,
    enum: ["INITIATED","SUCCESS","FAILED"]
  },

  createdAt: Date
}
```

---

# 11. Collections (Dealer Cash)

### `collections`

```js
{
  _id: ObjectId,

  loanId: ObjectId,
  emiId: ObjectId,

  dealerId: ObjectId,

  amountCollected: Number,

  collectionMode: {
    type: String,
    enum: ["CASH"]
  },

  status: {
    type: String,
    enum: [
      "COLLECTED",
      "PENDING_LENDER_CONFIRMATION",
      "APPROVED",
      "REJECTED"
    ]
  },

  lenderApprovedBy: ObjectId,

  createdAt: Date
}
```

---

# 12. Ledger Accounts

### `ledger_accounts`

```js
{
  _id: ObjectId,

  accountName: String,

  accountType: {
    type: String,
    enum: [
      "CUSTOMER_LOAN",
      "LENDER_ACCOUNT",
      "INTEREST_INCOME",
      "PRINCIPAL_RECEIVABLE",
      "DEALER_COMMISSION",
      "PAYMENT_GATEWAY"
    ]
  },

  ownerId: ObjectId,

  balance: Number,

  createdAt: Date
}
```

---

# 13. Ledger Entries

### `ledger_entries`

```js
{
  _id: ObjectId,

  referenceType: String,
  referenceId: ObjectId,

  description: String,

  createdAt: Date
}
```

---

# 14. Ledger Transactions

### `ledger_transactions`

```js
{
  _id: ObjectId,

  entryId: ObjectId,

  accountId: ObjectId,

  type: {
    type: String,
    enum: ["DEBIT","CREDIT"]
  },

  amount: Number,

  createdAt: Date
}
```

---

# 15. Audit Logs

Tracks **all system activity**.

### `audit_logs`

```js
{
  _id: ObjectId,

  userId: ObjectId,

  action: String,

  entityType: String,
  entityId: ObjectId,

  previousData: Object,
  newData: Object,

  ipAddress: String,

  createdAt: Date
}
```

---

# 16. Documents

Stores KYC docs.

### `documents`

```js
{
  _id: ObjectId,

  customerId: ObjectId,

  documentType: {
    type: String,
    enum: ["AADHAR","PAN","BANK_STATEMENT"]
  },

  fileUrl: String,

  status: {
    type: String,
    enum: ["UPLOADED","VERIFIED","REJECTED"]
  },

  uploadedAt: Date
}
```

---

# 17. Notifications

### `notifications`

```js
{
  _id: ObjectId,

  userId: ObjectId,

  title: String,
  message: String,

  channel: {
    type: String,
    enum: ["SMS","EMAIL","WHATSAPP","PUSH"]
  },

  status: {
    type: String,
    enum: ["SENT","FAILED"]
  },

  createdAt: Date
}
```

---

# Final Database Overview

```
users
customers
dealers
lenders
loan_products
interest_rates
loan_applications
loan_contracts
emi_schedule
payments
collections
ledger_accounts
ledger_entries
ledger_transactions
audit_logs
documents
notifications
```

Total collections

```
17 collections
```

This is **very close to what real lending systems use**, similar to platforms built by fintech companies like:

* Razorpay
* Lendingkart

---

To guarantee that **once a loan is disbursed the interest rate and EMI schedule can never be changed**, the schema and architecture must enforce **immutability** at multiple levels:

1. **Data Model Design**
2. **State-based Write Restrictions**
3. **Audit + Versioning**
4. **Database Index / Validation**
5. **Application Service Layer Guards**

Below is the **correct production approach** used in lending systems.

---

# 1. Immutable Loan Contract Design

Once the loan moves to **DISBURSED**, the financial parameters must become **immutable**.

Key parameters that must never change:

```
interestRate
principalAmount
emiAmount
tenureMonths
disbursementDate
```

### Updated `loan_contracts` schema

```js
{
  _id: ObjectId,

  loanApplicationId: ObjectId,

  customerId: ObjectId,
  dealerId: ObjectId,
  lenderId: ObjectId,

  principalAmount: Number,

  interestRate: Number,        // immutable after disbursement
  tenureMonths: Number,        // immutable
  emiAmount: Number,           // immutable

  disbursedAmount: Number,

  disbursementDate: Date,

  loanStatus: {
    type: String,
    enum: [
      "APPROVED",
      "DISBURSED",
      "ACTIVE",
      "DELINQUENT",
      "NPA",
      "CLOSED"
    ]
  },

  isLocked: Boolean,           // TRUE after disbursement

  createdAt: Date,
  updatedAt: Date
}
```

### Rule

```
if loanStatus == DISBURSED
   isLocked = true
```

---

# 2. EMI Schedule Must Be Frozen

Once the loan is disbursed:

* EMI schedule must be generated **once**
* It must never be edited
* Only **status fields change**

### Updated `emi_schedule`

```js
{
  _id: ObjectId,

  loanId: ObjectId,

  emiNumber: Number,

  dueDate: Date,

  emiAmount: Number,

  principalComponent: Number,
  interestComponent: Number,

  remainingPrincipal: Number,

  status: {
    type: String,
    enum: [
      "PENDING",
      "PAID",
      "PARTIAL",
      "OVERDUE"
    ]
  },

  locked: Boolean,   // true after generation

  createdAt: Date
}
```

### Rule

```
Once EMI schedule generated
locked = true
```

Only allowed update:

```
status
payment reference
```

Forbidden updates:

```
emiAmount
principalComponent
interestComponent
dueDate
```

---

# 3. EMI Generation Occurs Only Once

EMI schedule should be generated **only during disbursement event**.

Flow:

```
Loan Approved
     ↓
Disbursement API
     ↓
Generate EMI Schedule
     ↓
Lock Loan Contract
     ↓
Loan Status → DISBURSED
```

---

# 4. Early Payment Handling (Allowed)

Early payment **does not change interest rate**.

Instead:

```
Extra Payment → reduce principal
Regenerate remaining EMI schedule
```

BUT this must follow rules:

```
Already PAID EMI rows cannot change
Future EMIs can be recalculated
```

Implementation approach:

```
archive remaining schedule
generate new schedule version
```

---

# 5. EMI Versioning (Production Level)

To support **prepayment / restructuring**, EMI schedules should have versions.

### Updated EMI schema

```js
{
  _id: ObjectId,

  loanId: ObjectId,

  scheduleVersion: Number,

  emiNumber: Number,

  dueDate: Date,

  emiAmount: Number,

  principalComponent: Number,
  interestComponent: Number,

  remainingPrincipal: Number,

  status: String,

  createdAt: Date
}
```

Example

```
Version 1 → original schedule
Version 2 → after prepayment
```

Paid EMIs remain unchanged.

---

# 6. Database Guard (MongoDB Validation)

Using **MongoDB validation rules.

Example rule:

```
if isLocked == true
prevent update to:

interestRate
emiAmount
tenureMonths
principalAmount
```

---

# 7. Application Layer Guard

Before updating loan contract:

```
if loan.isLocked == true
   throw error "Loan financial parameters cannot be modified after disbursement"
```

---

# 8. Audit Log Protection

Any attempted modification must create audit record.

Example:

```
action: "LOAN_MODIFICATION_ATTEMPT"
entity: loan_contract
result: BLOCKED
```

Stored in

```
audit_logs
```

---

# 9. Production Flow Summary

```
Loan Application Created
        ↓
Loan Approved
        ↓
Disbursement Triggered
        ↓
EMI Schedule Generated
        ↓
Loan Contract Locked
        ↓
Loan Status = DISBURSED
```

After this point:

| Field             | Editable |
| ----------------- | -------- |
| interestRate      | ❌        |
| tenure            | ❌        |
| emiAmount         | ❌        |
| emi schedule      | ❌        |
| emi status        | ✅        |
| payment reference | ✅        |

---

# 10. Critical Fintech Rule

Every lending system must follow this rule:

```
Loan terms must be immutable after disbursement
```

This rule is followed by lending systems of companies like

* Razorpay
* Lendingkart
* MoneyTap

---

✅ Your platform design now includes:

```
Loan State Machine
Immutable Loan Contracts
Versioned EMI Schedules
Double Entry Ledger
Collections Architecture
Audit Logs
```

This is **enterprise-level fintech architecture**.

---

If you want, I can also show you something **extremely important most developers miss**:

### **The Complete Transaction Flow**

```
Loan Disbursement → Ledger Entries
EMI Payment → Ledger Entries
Dealer Cash Collection → Ledger Entries
Prepayment → Ledger Entries
Loan Closure → Ledger Entries
```

This part is **the heart of NBFC software** and prevents financial mismatches.
