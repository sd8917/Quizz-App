# Payment & Subscription Flow Diagram

Below is the complete sequence diagram illustrating how the payment and subscription lifecycle works across the Frontend, Backend, Razorpay, and Database.

## Roles & Permissions

- **User (Standard)**: Can view pricing plans, initiate a checkout, verify payment, view their payment history, and download their own receipts. 
- **Admin**: Has all User privileges, plus the ability to create, update, and delete pricing plans via the `/api/pricing/admin` endpoints. 

---

```mermaid
sequenceDiagram
    autonumber
    
    %% Define colors for participants
    participant User as 👤 User
    participant FE as 💻 Frontend
    participant BE as ⚙️ Backend
    participant DB as 🗄️ MongoDB
    participant RZ as 🏦 Razorpay
    
    %% Phase 1: Order Creation
    Note over User, RZ: 🟦 PHASE 1: ORDER CREATION
    User->>FE: Click "Start Free Trial"
    FE->>BE: POST /api/payment/create-order
    
    BE->>DB: Check if User already isPremium?
    alt User is Premium
        DB-->>BE: User Data
        BE-->>FE: 409 Conflict (Already subscribed)
        FE-->>User: Show Error Message
    else User is NOT Premium
        BE->>BE: Set Redis Idempotency Lock
        BE->>RZ: Create Order Request
        RZ-->>BE: Returns Razorpay Order ID
        BE->>DB: Save Payment(status: 'created', planId, orderId)
        BE-->>FE: Returns Order ID to frontend
    end

    %% Phase 2: Checkout & Payment
    Note over User, RZ: 🟨 PHASE 2: CHECKOUT & PAYMENT
    FE->>RZ: Opens Razorpay Checkout Modal
    User->>RZ: Enters Card/UPI Details & Pays
    RZ-->>FE: Payment Success (Payment ID, Signature)

    %% Phase 3: Verification & Activation
    Note over User, DB: 🟩 PHASE 3: VERIFICATION & ACTIVATION
    FE->>BE: POST /api/payment/verify
    BE->>BE: Validate Signature using crypto
    alt Signature Valid
        BE->>DB: Find PricingPlan & calculate expiry
        BE->>DB: Update Payment(status: 'paid')
        BE->>DB: Update User(isPremium: true, activePlan, premiumExpiresAt)
        BE-->>FE: 200 OK (Payment Verified)
        FE-->>User: Show Success Alert & Update UI
    else Signature Invalid
        BE->>DB: Update Payment(status: 'failed')
        BE-->>FE: 400 Bad Request
        FE-->>User: Show Failure Alert
    end

    %% Phase 4: History & Receipt
    Note over User, DB: 🟧 PHASE 4: HISTORY & RECEIPT
    User->>FE: Views Payment History
    FE->>BE: GET /api/payment/history
    BE->>DB: Fetch user's payments
    DB-->>BE: Payment List
    BE-->>FE: Returns Payment List
    
    User->>FE: Clicks "Download Receipt"
    FE->>BE: GET /api/payment/receipt/:paymentId (responseType: blob)
    BE->>DB: Fetch Payment & verify owner
    BE->>BE: Generate PDF using PDFKit
    BE-->>FE: Returns PDF Stream
    FE->>User: Browser Downloads receipt.pdf
```
