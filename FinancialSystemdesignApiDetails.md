Below is a **production-grade architecture extension** for your **Multi-Party NBFC Lending Platform**.
This section adds the **core financial infrastructure** every lending system requires.

Includes:

1. Loan State Machine
2. Ledger Double Entry Design
3. EMI Generation Algorithm
4. Audit Log Architecture
5. Collections Architecture

This is **architecture + design**, not implementation.

---

# 1. Loan State Machine

A **Loan State Machine** ensures a loan moves only through valid lifecycle states.

This prevents issues like:

* Disbursing a rejected loan
* Paying EMI before disbursement
* Closing loan before full repayment

---

## Loan Lifecycle States

```
DRAFT
↓
APPLIED
↓
KYC_PENDING
↓
UNDER_REVIEW
↓
APPROVED
↓
REJECTED
↓
DISBURSED
↓
ACTIVE
↓
DELINQUENT
↓
NPA
↓
CLOSED
↓
WRITTEN_OFF
```

---

## State Transition Diagram

```
DRAFT
  │
  ▼
APPLIED
  │
  ▼
KYC_PENDING
  │
  ▼
UNDER_REVIEW
 ├──────────► REJECTED
 │
 ▼
APPROVED
  │
  ▼
DISBURSED
  │
  ▼
ACTIVE
  │
  ▼
DELINQUENT
  │
  ▼
NPA
  │
  ▼
WRITTEN_OFF
```

---

## Transition Rules

| Current State | Allowed Next State  |
| ------------- | ------------------- |
| DRAFT         | APPLIED             |
| APPLIED       | KYC_PENDING         |
| KYC_PENDING   | UNDER_REVIEW        |
| UNDER_REVIEW  | APPROVED / REJECTED |
| APPROVED      | DISBURSED           |
| DISBURSED     | ACTIVE              |
| ACTIVE        | DELINQUENT / CLOSED |
| DELINQUENT    | ACTIVE / NPA        |
| NPA           | WRITTEN_OFF         |
| CLOSED        | FINAL               |

---

## Example State Change Event

```
EVENT: LOAN_DISBURSED

FROM: APPROVED
TO: DISBURSED
```

System triggers:

* EMI schedule generation
* Ledger entry creation
* Audit log entry
* Dealer commission calculation

---

# 2. Ledger Double Entry Design

Financial systems must follow **double-entry accounting**.

Every transaction must balance.

```
Debit = Credit
```

---

## Core Ledger Tables

### ledger_accounts

```
{
  _id
  account_name
  account_type
  owner_id
  owner_type
  balance
  createdAt
}
```

---

### ledger_entries

```
{
  _id
  reference_type
  reference_id
  description
  createdAt
}
```

---

### ledger_transactions

```
{
  _id
  entry_id
  account_id
  type: debit | credit
  amount
}
```

---

## Account Types

```
CUSTOMER_LOAN_ACCOUNT
LENDER_FUND_ACCOUNT
DEALER_COMMISSION_ACCOUNT
INTEREST_INCOME_ACCOUNT
PRINCIPAL_RECEIVABLE_ACCOUNT
CASH_COLLECTION_ACCOUNT
PAYMENT_GATEWAY_ACCOUNT
```

---

## Example: Loan Disbursement

Customer loan = 100,000

### Ledger Entry

| Account               | Debit  | Credit |
| --------------------- | ------ | ------ |
| Customer Loan Account | 100000 |        |
| Lender Fund Account   |        | 100000 |

---

## Example: EMI Payment

EMI = 5000

Principal = 3500
Interest = 1500

| Account              | Debit | Credit |
| -------------------- | ----- | ------ |
| Cash Account         | 5000  |        |
| Principal Receivable |       | 3500   |
| Interest Income      |       | 1500   |

---

# 3. EMI Generation Algorithm

This calculates the **EMI schedule using reducing balance method**.

---

## EMI Formula

EMI = P \times r \times \frac{(1+r)^n}{(1+r)^n - 1}

Where:

```
P = Principal
r = Monthly interest rate
n = Number of months
```

---

## EMI Schedule Generation Logic

### Step 1

Input

```
principal = 100000
rate = 12%
tenure = 24 months
```

---

### Step 2

Monthly Interest

```
monthlyRate = rate / 12 / 100
```

---

### Step 3

Calculate EMI

```
emi = EMI formula
```

---

### Step 4

Loop to generate schedule

```
remainingPrincipal = principal

for month in tenure:

   interest = remainingPrincipal * monthlyRate

   principalComponent = emi - interest

   remainingPrincipal = remainingPrincipal - principalComponent

   store EMI row
```

---

## EMI Ledger Table

```
emi_ledger

{
  _id
  loan_id
  emi_number
  due_date
  emi_amount
  principal_component
  interest_component
  remaining_balance
  status
}
```

---

## EMI Status

```
PENDING
PAID
PARTIAL
OVERDUE
WAIVED
```

---

# 4. Audit Log Architecture

Audit logs track **every system activity**.

Required for:

* RBI compliance
* fraud detection
* debugging
* legal traceability

---

## Audit Log Table

```
audit_logs
```

```
{
  _id
  user_id
  role
  action
  entity_type
  entity_id
  previous_data
  new_data
  ip_address
  user_agent
  createdAt
}
```

---

## Example Log

```
{
 action: "LOAN_APPROVED",
 entity_type: "loan",
 entity_id: "loan_123",
 user_id: "lender_45"
}
```

---

## Logged Events

```
USER_LOGIN
USER_CREATED
LOAN_APPLIED
LOAN_APPROVED
LOAN_REJECTED
LOAN_DISBURSED
EMI_PAYMENT
EMI_OVERDUE
CASH_COLLECTION_RECORDED
LENDER_COLLECTION_APPROVED
KYC_VERIFIED
```

---

## Audit Log Flow

```
API Request
   │
   ▼
Service Layer
   │
   ▼
Database Action
   │
   ▼
Audit Log Created
```

---

# 5. Collections Architecture

Collections handle **EMI recovery**.

Your system supports **dual-channel collections**.

---

# Collection Channels

### 1 Digital Payment

via

* Razorpay
* UPI
* Cards
* Netbanking

Flow

```
Customer → Razorpay → Webhook → System
```

---

### 2 Dealer Cash Collection

Flow

```
Customer → Dealer → Platform → Lender approval
```

---

# Collections State Machine

```
INITIATED
↓
COLLECTED
↓
PENDING_LENDER_CONFIRMATION
↓
APPROVED
↓
SETTLED
```

---

# Collections Table

```
collections
```

```
{
  _id
  loan_id
  emi_id
  amount
  collected_by
  collection_mode
  status
  lender_approved_by
  createdAt
}
```

---

## Collection Modes

```
RAZORPAY
UPI
CASH
BANK_TRANSFER
```

---

# NPA Monitoring

Loan becomes delinquent based on overdue.

| Days  | Status     |
| ----- | ---------- |
| 1–30  | Delinquent |
| 30–60 | High Risk  |
| 60–90 | Critical   |
| 90+   | NPA        |

---

# Collection Escalation

```
Day 1  → Reminder SMS
Day 7  → Dealer follow up
Day 15 → Call center
Day 30 → Delinquent
Day 60 → Recovery agent
Day 90 → NPA
```

---

# Complete Core System Architecture

```
Users
 │
 │
 API Gateway
 │
 ├── Loan Service
 ├── EMI Service
 ├── Ledger Service
 ├── Payment Service
 ├── Collection Service
 ├── Audit Service
 └── Notification Service
 │
 │
 Database
```

---

# Production Fintech Systems Use This Model

Companies like

* Razorpay
* Lendingkart
* MoneyTap

use similar architectures.

---

# Next Critical Part (Very Important)

The **hardest part of lending software** is designing the **Database Schema**.

You need around **15 core collections**.

Example:

```
users
customers
dealers
lenders
loan_products
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

---

If you want, I can also show you the **FULL PRODUCTION DATABASE SCHEMA used in real NBFC systems** (with indexes, relations, and data flow).

That will take your platform from **good → enterprise level**.
