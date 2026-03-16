This technical specification document outlines the architecture and functional requirements for the **Multi-Party NBFC Lending Platform**.

---

## 1. Product Overview

A digital lending ecosystem connecting **Dealers** (Product Sellers), **Borrowers** (Customers), and **Lenders** (NBFCs/Banks). The platform automates the lifecycle of a loan—from lead generation and multi-lender interest matching to automated EMI management and recovery.

## 2. Stakeholder Matrix & Access Control

| Role | Core Functions | Data Visibility |
| --- | --- | --- |
| **Admin** | System configuration, User management, Audit logs. | **Full Access:** All PII, transactions, and lender margins. |
| **Lender** | Rate setting (Auto/Battery/Personal), Loan approval, Disbursement. | **Lender Portfolio:** Their specific loans, disbursals, and EMIs. |
| **Dealer** | Lead entry, Product sales, KYC upload, Cash collection. | **Sales Pipeline:** Their customers and collection status. |
| **Customer** | Application entry, Document upload, EMI tracking. | **Personal:** Own loan status, schedule, and certificates. |

---

## 3. Loan Origination & Interest Engine

### A. Dynamic Interest Logic

* **Rate Lock:** The Interest Rate is fixed at the moment of **Disbursal**. Once disbursed, the rate is immutable for the life of that specific loan.
* **Lender-Specific Tiers:** Lenders define rates based on Category:
* *Example:* Lender A offers 10% for Auto, 12% for Battery, 15% for Personal.



### B. Verification Workflow

1. **Dealer** initiates the sale and triggers the **Customer** form.
2. **Customer** completes e-KYC and income details.
3. **Lender** reviews the "Digital Sanction File."
4. **Lender** triggers API-based disbursement to the Dealer/Customer.

---

## 4. Repayment & EMI Management

### A. Amortization Structure

Each EMI is mathematically split into two components:

1. **Principal Component:** Reduces the outstanding loan balance.
2. **Interest Component:** Calculated on the reducing principal.

* **Constraint:** The EMI amount is fixed throughout the tenure unless an **Early Payment** occurs.

### B. Early Payment & Restructuring

* Users can pay more than the EMI amount.
* **Logic:** The excess amount is deducted directly from the **Remaining Principal**.
* **Trigger:** The system automatically regenerates the future Repayment Schedule (Amortization Table) based on the new, lower principal.

---

## 5. Dual-Channel Collection Workflow

The platform supports two payment methods with a built-in reconciliation safety net:

1. **Digital (Razorpay):**
* Customer pays via App/Link.
* **Result:** System automatically marks EMI as **Paid** in both Dealer and for Lender dashboards it requires approval via lender.


2. **Offline (Dealer Cash):**
* **Step 1:** Dealer collects cash and marks "Collected" in the dashboard.
* **Step 2:** System status changes to **"Pending Lender Confirmation."**
* **Step 3:** Lender verifies receipt of funds and clicks **"Approve."**
* **Final:** Only after Lender approval is the EMI officially marked as **Paid**.



---

## 6. Dashboard Requirements

### Lender Dashboard (Portfolio Health)

* **Disbursement Analytics:** Total value disbursed vs. target.
* **Outstanding Metrics:** Remaining Principal ($P$), Total Interest Receivable ($I$).
* **Collection Inbox:** List of "Pending Cash Approvals" from Dealers.
* **NPA Monitor:** Tracking overdue installments by bucket (30/60/90 days).

### Dealer Dashboard (Sales & Ops)

* **Sales Funnel:** Count of loans in "Applied," "Verified," and "Disbursed" states.
* **Collection Ledger:** List of upcoming customer EMIs.
* **Payment Trigger:** Buttons for "Send Razorpay Link" or "Record Cash Payment."
* **Earnings:** Commission tracking based on disbursed loans.

---

## 7. Technical Data Entities (Simplified)

* **`Loan_Contract`:** Stores `Fixed_Rate`, `Start_Date`, and `Total_Tenure`.
* **`EMI_Ledger`:** Fields for `Principal_Paid`, `Interest_Paid`, `Remaining_Balance`, and `Payment_Source` (Cash/Gateway).
* **`Approval_Queue`:** Temporary storage for Cash payments awaiting Lender sign-off.

---

### Next Steps

Would you like me to generate the **User Stories for the Developer Sprint**, or should I draft the **API Documentation** for the Razorpay webhook integration?