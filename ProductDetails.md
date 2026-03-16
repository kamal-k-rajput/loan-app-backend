Product Document
NBFC Loan Distribution Platform

1. Product Overview
The NBFC Loan Distribution Platform is a digital system designed to manage the complete lifecycle of loans between multiple parties:
Customers who take loans
Dealers who sell products and collect payments
Lenders who provide the loan capital
Admin who manages the system
The platform enables customers to apply for loans, upload documents, and track their EMI payments. Dealers can record cash payments received from customers, and lenders can monitor loan performance and returns.
The platform functions as both:
Loan Origination System (LOS) – for loan applications and approvals
Loan Management System (LMS) – for EMI tracking, payments, and ledgers
The system will initially be developed as a web application backend using Node.js and MongoDB.

2. Problem Statement
Many small finance companies, dealers, and NBFC partners still manage loans using:
Excel sheets
Paper forms
Manual calculations
This leads to:
Payment tracking errors
Lack of transparency
Difficulty managing EMI schedules
No audit trail
Fraud risks
The proposed system will digitize and automate the loan process.

3. Objectives
The main objectives of the platform are:
Provide a digital loan application process
Automate loan approval workflow
Automatically generate EMI schedules
Track payments and outstanding balances
Maintain ledger records for all financial transactions
Maintain audit logs for all system activities
Support both online and offline payments
Provide dashboards for each participant

4. Key Stakeholders
1. Customer
A person who takes a loan.
Capabilities:
Register on the platform
Submit loan application
Upload documents
View loan details
View EMI schedule
Pay EMI online
Track remaining loan amount

2. Dealer
A dealer sells products and acts as an intermediary between the customer and the lender.
Capabilities:
Register in the platform
Create loan applications for customers
Verify customer details
Record cash payments collected from customers
Track customer loans

3. Lender
A financial institution or investor providing loan capital.
Capabilities:
Approve loan applications
View active loans
Track returns and interest earned
Monitor portfolio performance

4. Admin
Platform administrator.
Capabilities:
Manage users
Configure interest rates
Configure processing fees
Monitor system activity
View audit logs
Manage loan products

5. Core Features
5.1 User Management
Roles supported:
Customer
Dealer
Lender
Admin
Functions:
Registration
Login
Role-based access
Profile management

5.2 Loan Application
Customer submits:
Personal information
Loan amount
Tenure
Documents
Documents include:
Photo
Aadhaar
PAN
Address proof
Loan application status:
Pending
Dealer Verified
Lender Approved
Rejected

5.3 Loan Creation
When a loan is approved:
Loan record is created
EMI schedule is generated
Processing fee is applied
Ledger entry is recorded

5.4 Interest and Processing Fee
Interest rate is configurable from admin panel.
Example:
Loan Amount = ₹50,000
Interest Rate = 18% annually
Tenure = 12 months
Processing fee:
Example:
4% processing fee
₹50,000 × 4% = ₹2,000
Processing fee includes:
File charge
GST
Service charge

5.5 EMI Generation
EMI schedule will be generated automatically.
Each EMI contains:
EMI number
Due date
Amount
Status
Status:
Pending
Paid
Overdue

5.6 Payment System
Two payment methods are supported.
Online Payment
Payment gateway integration:
Razorpay
Flow:
Customer selects EMI
Razorpay order created
Customer pays online
Payment verified
EMI marked as paid

Offline Payment (Dealer Cash Collection)
Flow:
Customer pays dealer
Dealer logs into dashboard
Dealer records payment
EMI status updated
Ledger entry created

6. Ledger System
A ledger records all financial transactions.
Every loan will have a ledger.
Ledger entry types:
Loan disbursement
EMI payment
Processing fee
Interest
Penalty
Refund
Example:
Date | Type | Debit | Credit | Balance
Loan Start | Disbursement | 50,000 | 0 | 50,000
EMI 1 | EMI Payment | 0 | 4,800 | 45,200
This ensures financial transparency.

7. Audit Logs
Audit logs record system activity.
Every important action will be logged.
Examples:
Loan created
Payment recorded
Loan modified
User login
Admin changes
Audit log contains:
User ID
Action
Module
Old data
New data
IP address
Timestamp
This helps in:
Fraud detection
Compliance
Debugging

8. Dashboards
Customer Dashboard
Displays:
Loan amount
EMI amount
Paid EMI count
Pending EMI count
Remaining balance

Dealer Dashboard
Displays:
Customers served
Loans created
Payments collected
Pending collections

Lender Dashboard
Displays:
Total capital deployed
Active loans
Interest earned
Default loans

9. System Architecture
Backend will follow layered architecture:
Route → Controller → Service → Repository → Database
Technologies:
Backend:
Node.js
Express.js
Database:
MongoDB
Authentication:
JWT
File Storage:
Cloud storage (S3 or similar)
Payments:
Razorpay

10. Database Design
Main collections:
Users
Loan Applications
Loans
EMI Schedule
Payments
Ledgers
Audit Logs
Documents
Settings
Loan Products

11. Security
Security measures include:
JWT authentication
Password hashing
Role-based authorization
Rate limiting
Audit logging
Input validation

12. Scalability
Future improvements:
Microservice architecture
Event queues
Redis caching
Automated credit scoring
NACH auto debit
SMS reminders
Risk engine

13. Development Approach
Development will proceed in phases.
Phase 1 – Core Backend
User system
Loan application
Loan creation
EMI schedule
Ledger system
Phase 2 – Payment System
Razorpay integration
Dealer cash collection
Phase 3 – Dashboards
Customer dashboard
Dealer dashboard
Lender dashboard
Phase 4 – Advanced Features
Audit logs
Notifications
Reporting
Risk scoring

14. Expected Benefits
The system will:
Automate loan management
Reduce manual errors
Improve financial transparency
Track payments easily
Support multiple lenders and dealers
It can also evolve into a Loan Management SaaS platform for small finance companies.

15. Future Expansion
Possible extensions include:
Mobile application
AI-based credit scoring
Automated reminders
Financial reporting
Multi-NBFC integrations
Marketplace for lenders

16. Conclusion
The NBFC Loan Distribution Platform aims to digitize and automate the entire loan lifecycle.
By combining:
Loan origination
Loan management
Payment processing
Ledger accounting
Audit tracking

