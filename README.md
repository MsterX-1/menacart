<div align="center">

# 🛒 MenaCart

### Multi-Vendor E-Commerce Platform

A production-grade marketplace where independent sellers list, sell, and get paid —  
while buyers enjoy a unified shopping experience across multiple storefronts.

[![.NET](https://img.shields.io/badge/ASP.NET_Core-8.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-LocalDB-CC2927?logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/en-us/sql-server)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

### 🚀 Live Demo

- **Frontend App**: [https://menacart-ll2s-xi.vercel.app/](https://menacart-ll2s-xi.vercel.app/)
- **Backend API (Swagger)**: [https://menacart.runasp.net/index.html](https://menacart.runasp.net/index.html)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Business Model](#-business-model)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Features](#-features)
- [Working Flows](#-working-flows)
- [Database Design](#-database-design)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Challenges & Solutions](#-challenges--solutions)
- [Future Roadmap](#-future-roadmap)
- [Contributing](#-contributing)

---

## 🌍 Overview

**MenaCart** is a multi-vendor e-commerce platform — comparable to Amazon Marketplace or Etsy — purpose-built for the MENA region. It solves the fundamental complexity of **split-cart commerce**: when a buyer's single checkout contains items from multiple independent sellers, the platform automatically:

- **Splits** the order into per-seller sub-orders
- **Routes** fulfillment to each respective seller
- **Calculates** per-item platform commissions
- **Orchestrates** payments via Stripe and seller payouts via Stripe Connect

The platform handles the complete lifecycle — from user registration, seller onboarding with KYC verification, product listing with admin approval, cart management, Stripe-powered checkout, multi-seller order splitting, shipping, delivery tracking, returns/exchanges, commission tracking, and automated seller payouts.

### Who Is It For?

| Role       | Capabilities                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Buyer**  | Browse catalog, manage cart & wishlist, checkout with coupons & loyalty points, manage addresses, track orders, request returns/exchanges, submit reviews                                   |
| **Seller** | Apply for seller status, complete KYC, list products with variants & image galleries, configure shipping rules, fulfill orders, process returns, view commission dashboard, request payouts |
| **Admin**  | Approve sellers & products, manage categories & coupons, process payouts via Stripe Connect, monitor all orders & transactions, manage platform settings & users                            |

---

## 💰 Business Model

MenaCart operates on a **commission-based marketplace model**:

- **Platform Commission**: Configurable percentage (default 10%) deducted per `OrderItem` at checkout. Tracked via the `SellerCommission` entity with optimistic concurrency protection against double-claims.
- **Coupons**: Admin-managed discount codes (percentage or fixed amount) with usage limits, minimum order thresholds, and expiry dates.
- **Loyalty Points**: Buyers earn points per order, redeemable as discounts on future purchases. Full ledger transparency via account dashboard.

### Key Business Rules

- Sellers must complete KYC verification and be admin-approved before listing products
- Every product listing goes through an admin approval queue before becoming visible
- 14-day return window enforced via concrete `DeliveredAt` timestamp — not derivable from status alone
- Commissions remain `Pending` until the sub-order is `Delivered`, preventing premature payouts
- Products and addresses use soft deletes (`IsActive = false`) — never hard-deleted — to preserve historical order integrity

---

## 🛠 Tech Stack

### Backend

| Technology                | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| **ASP.NET Core 8**        | Web API framework                                          |
| **C# 12**                 | Primary language                                           |
| **Entity Framework Core** | ORM with code-first migrations                             |
| **SQL Server (LocalDB)**  | Relational database                                        |
| **ASP.NET Identity**      | User management, roles, password hashing                   |
| **JWT + Refresh Tokens**  | Stateless auth with stateful session security              |
| **Stripe SDK**            | Payment processing (Checkout Sessions + Connect Transfers) |
| **SMTP (Gmail)**          | Transactional emails (OTP verification, notifications)     |
| **Swagger / OpenAPI**     | API documentation                                          |

### Frontend

| Technology                 | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| **React 19**               | UI library                                 |
| **TypeScript 6**           | Type-safe JavaScript                       |
| **Vite 8**                 | Build tool & dev server                    |
| **React Router 7**         | Client-side routing with route guards      |
| **TanStack React Query 5** | Server state management with caching       |
| **React Hook Form + Zod**  | Form handling with schema-based validation |
| **Framer Motion**          | Animations & micro-interactions            |
| **Recharts**               | Dashboard data visualization               |
| **Axios**                  | HTTP client with interceptors              |
| **Cloudinary**             | Image upload & CDN                         |
| **Google OAuth**           | Social authentication                      |

---

## 🏗 Architecture

MenaCart follows **Clean Architecture** (Onion Architecture), enforcing a strict dependency rule: outer layers depend on inner layers, never the reverse.

```
┌──────────────────────────────────────────────────────────────┐
│  API Layer          Controllers, DI Wiring, Program.cs       │
│    ↓ depends on                                              │
│  Application Layer  Services, DTOs, Interfaces               │
│    ↓ depends on                                              │
│  Domain Layer       Entities, Enums, Business Rules          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Infrastructure     EF Core, Repositories, Stripe, Email     │
│    → implements Application interfaces                       │
└──────────────────────────────────────────────────────────────┘
```

### Why Clean Architecture?

If the database migrates from SQL Server to PostgreSQL, or Stripe is replaced with PayPal, **only the Infrastructure layer changes**. The Domain and Application layers remain completely untouched. This also enables unit testing services without database or HTTP dependencies.

### Core Patterns

| Pattern                    | Usage                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit of Work**           | Wraps all repositories in a single atomic `SaveAsync()` — critical for order placement that touches Orders, SubOrders, Items, Commissions, Stock, and Notifications |
| **Repository**             | Data access abstraction. Repositories return `IQueryable` for complex queries or concrete lists for simple ones                                                     |
| **Dependency Injection**   | All services registered as `Scoped` via extension methods in `ServiceCollectionExtensions.cs`                                                                       |
| **DTO Pattern**            | Strict input/output shapes — `CreateXRequestDto` for input, `XResponseDto` for output                                                                               |
| **Optimistic Concurrency** | `[Timestamp]` / `RowVersion` on `ProductVariant` and `SellerCommission` prevents race conditions                                                                    |

---

## ✨ Features

### 19 Backend Services

| Service                   | Description                                                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthService`             | Registration with OTP email verification, login, JWT generation, refresh token rotation with reuse detection, Google OAuth, password reset, logout (single & all devices)                                   |
| `OrderService`            | The core engine (~950 lines). Cart → Order conversion, multi-seller splitting into SubOrders, concurrency-safe stock deduction, commission calculation, coupon/loyalty application, Stripe session creation |
| `CartService`             | Server-side persistent cart. Add/update/remove items with stock validation and product approval checks                                                                                                      |
| `ProductService`          | Full CRUD with variants, product-level and variant-level image galleries, category assignment, search & filtering, seller ownership enforcement                                                             |
| `SellerOnboardingService` | Application workflow, instant seller creation, profile management, Stripe Connect account linking                                                                                                           |
| `ReturnService`           | Return/exchange requests within 14-day window. Seller approval flow, stock reservation for exchanges, refund tracking                                                                                       |
| `PayoutService`           | Seller payout requests against delivered commissions. Admin review & Stripe Connect transfers with concurrency protection                                                                                   |
| `AdminService`            | Seller & product approval, user management, order oversight, dashboard analytics, system settings                                                                                                           |
| `CategoryService`         | Hierarchical category management with parent-child relationships                                                                                                                                            |
| `CouponService`           | Percentage & fixed discount coupons with usage limits, min order thresholds, expiry dates, per-seller scoping                                                                                               |
| `ReviewService`           | Product & seller reviews with purchase verification, transactional rating recalculation, one-review-per-product constraint                                                                                  |
| `ShippingService`         | Dynamic shipping cost calculation per seller with configurable rules and free-shipping thresholds                                                                                                           |
| `AddressService`          | Buyer shipping address CRUD with default address management and soft-delete                                                                                                                                 |
| `NotificationService`     | In-app notifications triggered by order, delivery, return, and payout events                                                                                                                                |
| `WishlistService`         | Add/remove products to wishlists with full product details                                                                                                                                                  |
| `LoyaltyService`          | Points balance retrieval and full transaction ledger history                                                                                                                                                |
| `SellerDocumentService`   | KYC document upload and admin review for verification compliance                                                                                                                                            |
| `SellerDashboardService`  | Aggregated seller analytics — revenue, order counts, pending payouts                                                                                                                                        |
| `EmailService`            | SMTP-based HTML transactional emails with mock fallback for development                                                                                                                                     |

### 17 Frontend Feature Modules

| Module              | Buyer                                                     | Seller                                             | Admin                                                         |
| ------------------- | --------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| **Auth**            | Login, Register, OTP, Forgot/Reset Password, Google OAuth | —                                                  | —                                                             |
| **Products**        | Catalog browsing, Product detail                          | My Products, Create/Edit with variants & galleries | Product approval queue                                        |
| **Cart & Checkout** | Cart, Checkout, Payment processing/success/cancelled      | —                                                  | —                                                             |
| **Orders**          | Order list, Order detail with tracking                    | Seller order management                            | —                                                             |
| **Returns**         | Return/exchange requests                                  | Seller return review & processing                  | —                                                             |
| **Payouts**         | —                                                         | Payout dashboard & requests                        | Payout review & processing                                    |
| **Account**         | Dashboard, Addresses, Loyalty points                      | —                                                  | —                                                             |
| **Sellers**         | Seller directory, Seller profile pages                    | Dashboard, Settings, Shipping rules                | Seller management                                             |
| **Admin**           | —                                                         | —                                                  | Dashboard, Users, Coupons, Categories, Transactions, Settings |
| **Wishlist**        | Add/remove, View wishlist                                 | —                                                  | —                                                             |
| **Reviews**         | Product & seller reviews                                  | —                                                  | —                                                             |
| **Notifications**   | In-app notification center                                | In-app notification center                         | —                                                             |
| **Home**            | Landing page & featured products                          | —                                                  | —                                                             |

---

## 🔄 Working Flows

### 1. User Registration & OTP Verification

```
User submits registration form (name, email, password, role)
→ Backend validates uniqueness of username & email
→ User created in ASP.NET Identity (EmailConfirmed = false)
→ Role assigned (Customer or Seller)
→ If Seller: SellerProfile auto-created with Pending status
→ OTP generated via Identity's TwoFactorToken provider
→ HTML email sent with styled 6-digit OTP code
→ User enters OTP on verification page
→ Backend validates OTP → EmailConfirmed = true
→ JWT (15min) + Refresh Token (7 days) issued → Redirected to dashboard
```

> **Security Detail**: If OTP expires, users can request a resend via `ResendOtpAsync`, which generates a fresh code and sends a new email. Already-verified users are rejected.

### 2. Login & Token Lifecycle

```
User submits email + password
→ Backend looks up user by email
→ Checks EmailConfirmed (rejects unverified accounts)
→ SignInManager.CheckPasswordSignInAsync (with lockout protection)
→ If locked out → "Account is locked" error
→ If success → JWT created with claims (UserId, Roles)
→ Refresh Token generated (64-byte cryptographic random)
→ Both saved atomically via UnitOfWork → Returned to client
```

### 3. Token Refresh & Reuse Detection

```
Client sends expired JWT + refresh token
→ Backend looks up refresh token in DB
→ CASE 1: Token already revoked (potential theft!)
    → ALL active tokens for that user revoked across ALL devices
    → Exception thrown → Forces complete re-authentication
→ CASE 2: Token expired or inactive
    → Rejected with "Invalid or expired" error
→ CASE 3: Token valid
    → Old token marked as Revoked
    → New JWT + new Refresh Token generated
    → Both saved atomically → Returned to client
```

> **Why This Matters**: If an attacker steals a refresh token and the legitimate user also tries to refresh, one of them will hit a revoked token — triggering the nuclear option of killing all sessions.

### 4. Password Reset Flow

```
User clicks "Forgot Password" → enters email
→ Backend generates PasswordResetToken via ASP.NET Identity
→ Reset link emailed: {frontendUrl}/reset-password?email=...&token=...
→ User clicks link → enters new password on frontend
→ Backend validates token + resets password via UserManager.ResetPasswordAsync
→ User redirected to login with new credentials
```

> **Security**: If the email doesn't exist, the API still returns success — preventing email enumeration attacks.

### 5. Google OAuth Flow

```
User clicks "Sign in with Google" on frontend
→ Google OAuth popup → User authenticates with Google
→ Google ID Token sent to backend POST /api/auth/google
→ Backend validates token via Google.Apis.Auth (checks audience matches ClientId)
→ CASE 1: Email exists in system → Login with existing account
→ CASE 2: Email is new → Auto-create User (EmailConfirmed = true)
    → Assign Customer role (or Seller if specified)
    → If Seller: auto-create SellerProfile (Pending)
→ JWT + Refresh Token issued → Redirected to dashboard
```

### 6. Seller Onboarding & KYC

```
Customer applies via POST /api/seller/apply
→ Store profile created (name, description, logo, address, phone, Stripe account)
→ Bank info saved (bank name, account number, IBAN)
→ Profile status = Pending
→ Seller uploads KYC documents (ID, business license, etc.)
    → Documents stored with status = Pending
→ Admin reviews documents → Approves/Rejects each document
    → If rejected: rejection reason attached
→ Admin updates seller status → Active
    → "Customer" role ensured (if not already assigned)
    → "Seller" role assigned via UserManager
    → Seller notified via in-app notification
→ Seller can now list products
```

> **Re-Application**: If a seller is rejected, they can re-apply — their existing profile is updated and re-enters the Pending queue.

### 7. Product Lifecycle

```
Seller creates product (name, description, brand, category, images)
→ Product variants added (size, color, SKU, price, stock, variant images)
→ Product-level image gallery uploaded
→ Variant-level image galleries uploaded (e.g., images per color)
→ MainImageUrl denormalized on Product for fast listing queries
→ ApprovalStatus = Pending → enters admin queue
→ Admin reviews → Approves or Rejects
    → If approved: visible on marketplace catalog
    → If rejected: seller notified, can edit and resubmit
→ Seller can update/deactivate products anytime (soft delete via IsActive)
```

### 8. Cart Management

```
Buyer adds item to cart (variant ID + quantity)
→ Backend validates:
    • Product variant exists
    • Product is approved & active (IsActive = true)
    • Seller is active (SellerStatus.Active)
    • Buyer is NOT the seller of this product (self-purchase blocked)
    • Requested quantity ≤ available stock
→ If item already in cart → quantity updated (with stock re-check)
→ If new item → CartItem created
→ Cart auto-created on first interaction if doesn't exist (lazy init)
→ Cart response includes: items, subtotals, seller grouping, saved addresses
```

### 9. Order Placement (The Core Flow)

This is the most critical and complex workflow — a **16-step transactional process**:

```
 1. Load cart & validate items
 2. Resolve shipping address (explicit or default)
 3. Filter out inactive sellers / unapproved products
 4. Validate stock availability
 5. Apply coupon (if provided)
 6. BEGIN SQL Transaction
 7. Create parent Order record
 8. Group cart items by Seller
 9. Create SubOrders per seller
10. Create OrderItems with locked PriceAtPurchase
11. Calculate dynamic shipping per seller (rule-based)
12. Deduct stock with RowVersion concurrency check
13. Calculate 10% commission per item → SellerCommission
14. Apply loyalty points & clear cart
15. Create Stripe Checkout Session
16. COMMIT Transaction → Redirect to Stripe payment page
```

> **Concurrency Safety**: If two buyers attempt to purchase the last item simultaneously, EF Core's `RowVersion` check detects the conflict. The second transaction throws `DbUpdateConcurrencyException`, rolls back, and returns a **409 Conflict** — preventing overselling.

> **Zero-Amount Orders**: If loyalty points or a coupon cover the full total, Stripe is bypassed entirely — a `Payment` record is created with method `LoyaltyPoints`, and the order is immediately marked `Paid`.

### 10. Payment Processing (Stripe)

```
Order placed → Stripe Checkout Session created (EGP currency)
→ Session contains: line items, order metadata, success/cancel URLs
→ Buyer redirected to Stripe-hosted payment page
→ Payment completed on Stripe
→ PRIMARY: Webhook (checkout.session.completed) fires
    → Backend verifies Stripe signature (WebhookSecret)
    → Extracts OrderId from session metadata
    → Order PaymentStatus → Paid, Status → Confirmed
→ FALLBACK: Frontend calls POST /orders/verify-payment
    → Backend calls Stripe API to verify session directly
    → Updates order if session.PaymentStatus == "paid"
→ If payment fails: checkout.session.async_payment_failed webhook
    → Order PaymentStatus → Failed
```

### 11. Order Email Notifications

```
Order placed successfully →
→ SELLER NOTIFICATION: Each seller receives:
    • In-app notification with link to seller orders
    • HTML email: "New Order Received: #{orderId}" with dashboard link
→ BUYER NOTIFICATION:
    • HTML email: "Order Confirmation - #{orderId}" with total amount and "View Order" button
→ All notifications created within the same transaction as the order
```

### 12. Order Fulfillment

```
Seller receives SubOrder notification → Views in seller dashboard
→ Seller confirms → SubOrder status: Processing
→ Seller ships → SubOrder status: Shipped (tracking number added)
→ Marked Delivered → DeliveredAt timestamp stamped on Shipping record
→ Commission status transitions: Pending → eligible for payout
→ Return window begins (14-day countdown from DeliveredAt)
```

### 13. Order Cancellation

```
Buyer requests cancellation via DELETE /orders/{id}
→ Backend validates:
    • Order belongs to requesting user (ownership check)
    • Order status is still "Placed" (not yet processing)
    • NO sub-order has been picked up (all sub-orders still "Placed")
→ BEGIN Transaction
→ For each SubOrder:
    • Status → Cancelled
    • Each OrderItem's variant stock quantity restored
    • All SellerCommissions → Refunded status
    • Seller notified: "Order #{id} has been cancelled by customer"
→ Parent Order: Status → Cancelled, PaymentStatus → Cancelled
→ COMMIT Transaction
```

> **Business Rule**: Once ANY sub-order moves to `Processing`, the entire order can no longer be cancelled — protecting sellers who have begun fulfillment.

### 14. Returns & Exchanges

```
Buyer requests return (within 14 days of DeliveredAt)
→ System validates:
    • SubOrder is in Delivered status
    • DateTime.UtcNow - DeliveredAt ≤ 14 days (configurable)
    • No duplicate active return exists for this OrderItem
→ Return record created (type: Return or Exchange, reason provided)
→ Seller reviews & approves/rejects
→ IF RETURN:
    • Original variant stock quantity restored
    • Commission status updated
    • Payment status → Refunded
→ IF EXCHANGE:
    • Target variant stock immediately decremented (reserved)
    • Seller ships replacement item
    • Original item returned by buyer
    • Transaction marked Complete
```

### 15. Payout Flow

```
SubOrder delivered → Commission status: eligible
→ Seller requests payout via POST /payouts/request
→ System aggregates ALL pending commissions for this seller
→ SellerPayout record created, commissions linked (RowVersion protected)
→ Admin reviews payout request
→ Admin approves → Stripe Connect Transfer executed
    → Transfer to seller's connected Stripe account
    → Transfer ID stored on payout record
→ All linked commissions marked Paid
→ Seller notified of successful payout
```

> **Double-Payout Protection**: `SellerCommission.RowVersion` ensures that if a seller submits two payout requests before the first is processed, the second fails at the database level due to concurrency conflict.

### 16. Coupon Redemption

```
Buyer provides coupon code at checkout (or applies post-order)
→ Backend validates:
    • Coupon code exists
    • Coupon has not expired (ExpiryDate check)
    • Usage limit not reached (UsedCount < UsageLimit)
    • Order meets minimum amount (MinOrderAmount threshold)
    • If seller-scoped: coupon applies only to that seller's items
    • User hasn't already used this coupon (UserCouponUsage check)
→ Discount calculated:
    • Percentage type: (DiscountValue / 100) × subtotal
    • Fixed type: flat deduction from total
→ Coupon.UsedCount incremented
→ UserCouponUsage record created (prevents reuse by same user)
→ Order total recalculated with discount applied
```

### 17. Product & Seller Reviews

```
PRODUCT REVIEW:
→ Buyer submits review (rating 1-5, comment)
→ Backend validates:
    • Buyer has purchased this product in a completed order
    • Buyer has NOT already reviewed this product (one-per-product constraint)
→ BEGIN Transaction
→ Review record created
→ Product.AverageRating recalculated (aggregate query)
→ Product.ReviewCount updated
→ COMMIT Transaction

SELLER REVIEW:
→ Buyer submits seller review (rating 1-5, comment)
→ Backend validates:
    • Buyer has completed a SubOrder from this seller
    • Buyer has NOT already reviewed this seller
→ BEGIN Transaction
→ SellerReview record created
→ SellerProfile.Rating recalculated (aggregate query)
→ COMMIT Transaction
```

> **Integrity**: Rating recalculation happens transactionally with the review insertion — ensuring the product/seller rating is always consistent with the actual reviews.

### 18. Shipping Cost Calculation

```
During checkout, for each seller group in the cart:
→ ShippingService.CalculateShippingCostAsync(address, sellerId, subtotal)
→ Looks up SellerShippingRule matching (sellerId, city, country)
→ IF no rule found:
    → Exception: "Seller does not deliver to this location"
    → Buyer must remove that seller's items
→ IF rule found:
    • Check if subtotal ≥ FreeShippingAbove threshold
    • If yes → shipping cost = 0 (free shipping)
    • If no → shipping cost = rule.ShippingCost
→ Shipping cost added per-SubOrder (not per-item)
→ Total shipping = sum of all sub-order shipping costs
```

### 19. Notification Lifecycle

```
CREATION: Notifications auto-generated by system events:
    • Order placed → Seller notified
    • Order cancelled → Seller notified
    • Seller approved → Seller notified
    • Seller suspended/rejected → Seller notified with reason
    • Payout processed → Seller notified
    • Order fully paid by loyalty → Buyer notified

CONSUMPTION:
→ GET /notifications → returns all user notifications (newest first)
→ PATCH /notifications/{id}/read → marks single as read (ownership verified)
→ PATCH /notifications/read-all → bulk mark-all-as-read for user

FRONTEND: Notification center in nav bar with unread badge count
```

### 20. Admin Platform Management

```
SELLER MANAGEMENT:
→ View all sellers (filterable by status: Pending/Active/Suspended/Rejected)
→ Paginated results with user details
→ Approve/Reject/Suspend sellers with reason
→ Ban seller via email notification

PRODUCT APPROVAL:
→ View pending product queue
→ Approve → product visible on marketplace
→ Reject → seller notified

USER MANAGEMENT:
→ View all platform users with role information
→ Monitor user activity

ORDER OVERSIGHT:
→ View all orders across the platform
→ Filter by status, date, amount
→ Transaction history with payment details

DASHBOARD ANALYTICS:
→ Total revenue, order counts, active sellers
→ Recent transactions and pending actions

SYSTEM SETTINGS:
→ Commission rate configuration
→ Platform-wide settings management
```

## 🗄 Database Design

### 28 Domain Entities

| Entity                       | Purpose                         | Key Design Feature                                                                |
| ---------------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| `User`                       | Identity & authentication       | ASP.NET Identity with multi-role support                                          |
| `SellerProfile`              | Seller storefront data          | Store branding, KYC status, Stripe Connect ID, commission rate                    |
| `Product`                    | Catalog item                    | Soft-deletable (`IsActive`), admin approval workflow, denormalized `MainImageUrl` |
| `ProductVariant`             | Size/color/SKU combinations     | `RowVersion` timestamp for concurrency-safe stock deduction                       |
| `ProductImage`               | Image galleries                 | Supports both product-level and variant-specific galleries                        |
| `Category`                   | Product categorization          | Hierarchical parent-child relationships                                           |
| `Cart` / `CartItem`          | Shopping cart                   | Server-side persistent, linked to user                                            |
| `Order`                      | Buyer's full transaction        | Parent record, total payment, coupon/loyalty references                           |
| `SubOrder`                   | Per-seller fulfillment          | Unique constraint `(OrderId, SellerId)`, independent status tracking              |
| `OrderItem`                  | Purchased variant line          | Locks `PriceAtPurchase` for historical accuracy                                   |
| `Payment`                    | Stripe transaction record       | Links `SessionId`, `TransactionId`, payment status                                |
| `Shipping`                   | Shipment tracking               | Carrier, tracking number, `DeliveredAt` timestamp                                 |
| `SellerCommission`           | Platform fee tracking           | `RowVersion` prevents double-payout claims                                        |
| `SellerPayout`               | Payout disbursement records     | Aggregated from eligible commissions                                              |
| `Return`                     | Post-delivery returns/exchanges | 14-day window enforcement, exchange variant tracking                              |
| `Review` / `SellerReview`    | Ratings & feedback              | Purchase verification, transactional rating recalculation                         |
| `Coupon` / `UserCouponUsage` | Discount system                 | Per-user usage tracking, expiry, min order thresholds                             |
| `LoyaltyPoint`               | Rewards ledger                  | Earn/spend entries with full audit trail                                          |
| `Notification`               | In-app alerts                   | Read/unread status, deep-link URLs                                                |
| `RefreshToken`               | Session management              | Rotation + reuse detection for stolen token protection                            |
| `Address`                    | Shipping addresses              | Default flag, soft-delete, cascade restrict on orders                             |
| `SellerBankInfo`             | Payout banking details          | Linked to seller profile for financial transfers                                  |
| `SellerDocument`             | KYC compliance                  | Document upload and admin review workflow                                         |
| `SellerShippingRule`         | Delivery pricing                | Region-based cost with free-shipping thresholds                                   |
| `SystemSetting`              | Platform configuration          | Key-value runtime settings                                                        |
| `Wishlist`                   | Saved products                  | User-product favorites                                                            |

### Schema Design Principles

- **Enum String Storage**: All statuses (`OrderStatus`, `PaymentStatus`, `SellerStatus`) persisted as readable `NVARCHAR` strings — not opaque integers
- **Cascade Restrict**: Orders reference addresses with restricted deletes — you cannot remove an address tied to an order
- **Concurrency Tokens**: `RowVersion` on `ProductVariant` and `SellerCommission` prevents race conditions without pessimistic locks
- **Soft Deletes**: `IsActive` flags on Products and Addresses preserve referential integrity for historical orders
- **Denormalized Images**: `Product.MainImageUrl` avoids expensive JOINs on listing pages — a deliberate performance optimization

---

## 📡 API Reference

### 21 Controllers

The API follows RESTful conventions. Full interactive documentation available via **Swagger UI** at `/swagger` in development mode.

| Controller        | Key Endpoints                                                                                                                         | Auth              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **Auth**          | `POST /login`, `POST /register`, `POST /verify-otp`, `POST /refresh`, `POST /google`, `POST /forgot-password`, `POST /reset-password` | Public / Auth     |
| **Products**      | `GET /products`, `GET /products/{id}`, `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}`                                | Public / Seller   |
| **Cart**          | `GET /cart`, `POST /cart/items`, `PUT /cart/items/{id}`, `DELETE /cart/items/{id}`                                                    | Customer          |
| **Orders**        | `POST /orders`, `GET /orders`, `GET /orders/{id}`, `POST /orders/verify-payment`                                                      | Customer          |
| **Seller Orders** | `GET /seller/suborders`, `PATCH /seller/suborders/{id}/status`                                                                        | Seller            |
| **Returns**       | `POST /returns`, `GET /returns`, `PATCH /returns/{id}/status`                                                                         | Customer / Seller |
| **Payouts**       | `POST /payouts/request`, `GET /payouts`, `PATCH /payouts/{id}/process`                                                                | Seller / Admin    |
| **Admin**         | `GET /admin/sellers`, `PATCH /admin/sellers/{id}`, `GET /admin/orders`, `GET /admin/dashboard`                                        | Admin             |
| **Addresses**     | `GET /addresses`, `POST /addresses`, `PUT /addresses/{id}`, `PATCH /addresses/{id}/default`, `DELETE /addresses/{id}`                 | Auth              |
| **Categories**    | `GET /categories`, `POST /categories`, `PUT /categories/{id}`, `DELETE /categories/{id}`                                              | Public / Admin    |
| **Coupons**       | `GET /coupons`, `POST /coupons`, `PUT /coupons/{id}`, `DELETE /coupons/{id}`, `GET /coupons/code/{code}`                              | Admin             |
| **Reviews**       | `POST /reviews/product`, `POST /reviews/seller`, `GET /reviews/product/{id}`, `GET /reviews/seller/{id}`                              | Customer          |
| **Wishlist**      | `GET /wishlists`, `POST /wishlists`, `DELETE /wishlists/{id}`                                                                         | Customer          |
| **Notifications** | `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`                                               | Auth              |
| **Webhook**       | `POST /webhook/stripe`                                                                                                                | Stripe Signature  |
| **+ 6 more**      | Loyalty, Shipping Rules, Seller Onboarding, Seller Documents, Seller Dashboard, User Profile                                          | Various           |

---

## 🚀 Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) & npm
- [SQL Server LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) (included with Visual Studio)
- [Stripe Account](https://stripe.com/) (test keys for development)

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/MenaCart.git
cd MenaCart

# 2. Navigate to the API project
cd MenaCart/API

# 3. Configure your settings
#    Edit appsettings.json with your:
#    - SQL Server connection string
#    - JWT secret key
#    - Stripe API keys (publishable, secret, webhook secret)
#    - SMTP credentials (or leave blank for mock emails)
#    - Google OAuth client ID
#    - Admin seed credentials

# 4. Apply database migrations
dotnet ef database update --project ../Infrastructure

# 5. Run the API
dotnet run
```

The API will start at `https://localhost:7210` with Swagger at `https://localhost:7210/swagger`.

> On first run, the identity seeder automatically creates the **Admin**, **Seller**, and **Customer** roles, plus an admin user from `appsettings.json` configuration.

### Frontend Setup

```bash
# 1. Navigate to frontend
cd menacart-frontend

# 2. Copy environment file
cp .env.example .env

# 3. Configure .env
#    VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
#    VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
#    VITE_GOOGLE_CLIENT_ID=your_google_client_id

# 4. Install dependencies
npm install

# 5. Start development server
npm run dev
```

The frontend starts at `http://localhost:3000` with API proxying configured via Vite:

- `/api/*` → `https://localhost:7210`
- `/uploads/*` → `https://localhost:7210`

### Seed Test Data

```bash
# Optional: Populate the database with test products, sellers, and orders
cd db_scripts
sqlcmd -S "(localdb)\MSSQLLocalDB" -d MenaCart -i seed_test_data.sql
```

### Default Admin Credentials

| Field    | Value              |
| -------- | ------------------ |
| Email    | `admin@system.com` |
| Password | `Admin@123`        |

---

## 📁 Project Structure

```
MenaCart/
├── MenaCart/                          # Backend (.NET solution)
│   ├── API/                          # Presentation layer
│   │   ├── Controllers/              # 21 REST controllers
│   │   ├── Extentions/               # DI wiring (8 extension classes)
│   │   │   ├── ServiceCollectionExtensions.cs  # Service + Repository DI
│   │   │   ├── AuthExtensions.cs     # JWT + authentication config
│   │   │   ├── DbExtensions.cs       # EF Core + SQL Server config
│   │   │   ├── IdentityExtensions.cs # ASP.NET Identity config
│   │   │   ├── CorsExtention.cs      # CORS policy for frontend
│   │   │   └── SwaggerExtensions.cs  # OpenAPI / Swagger setup
│   │   ├── Program.cs               # App entry point & middleware pipeline
│   │   └── appsettings.json         # Configuration (JWT, Stripe, SMTP, etc.)
│   ├── Application/                  # Business logic layer
│   │   ├── DTOs/                     # 16 DTO groups (input/output shapes)
│   │   ├── Interfaces/               # Contracts
│   │   │   ├── IServices/            # 21 service interfaces
│   │   │   ├── IRepositories/        # Repository interfaces
│   │   │   └── IUnitOfWork/          # Unit of Work contract
│   │   └── Services/                 # 19 business logic services
│   ├── Domain/                       # Core business models
│   │   ├── Models/                   # 28 EF Core entities
│   │   └── Security/                 # Security models (RefreshToken)
│   └── Infrastructure/               # Data access & external services
│       ├── Database/                 # AppDbContext + EF configurations
│       ├── Migrations/               # EF Core database migrations
│       ├── Repositories/             # Concrete data access implementations
│       ├── Services/                 # Stripe + Email implementations
│       ├── Seed/                     # IdentitySeeder (roles + admin user)
│       └── UnitOfWork/               # Unit of Work implementation
├── menacart-frontend/                # Frontend (React + TypeScript)
│   └── src/
│       ├── api/                      # Axios client with interceptors
│       ├── components/               # Shared UI (Button, Input, Toast, etc.)
│       ├── context/                  # AuthContext, ThemeContext
│       ├── features/                 # 17 feature modules
│       │   ├── auth/                 # Login, Register, OTP, Password reset
│       │   ├── products/             # Catalog + Seller product management
│       │   ├── cart/                 # Shopping cart
│       │   ├── checkout/            # Checkout + payment pages
│       │   ├── orders/              # Order list + detail (buyer & seller)
│       │   ├── returns/             # Return requests & seller management
│       │   ├── payouts/             # Seller & admin payout dashboards
│       │   ├── admin/               # Full admin panel (7 pages)
│       │   ├── sellers/             # Seller directory + dashboard
│       │   ├── seller-onboarding/   # Apply + KYC documents
│       │   ├── profile/             # Account dashboard + loyalty
│       │   ├── addresses/           # Address management
│       │   ├── wishlist/            # Product wishlist
│       │   ├── reviews/             # Product & seller reviews
│       │   ├── notifications/       # Notification center
│       │   ├── categories/          # Admin category management
│       │   └── home/                # Landing page
│       ├── layouts/                  # AppLayout, AuthLayout
│       ├── routes/                   # Route config + guards
│       ├── styles/                   # Global CSS + design tokens
│       └── types/                    # TypeScript definitions
├── docs/                             # Documentation
│   ├── MenaCart_Backend_Documentation.md
│   ├── MenaCart_Presentation.html    # Interactive HTML presentation
│   └── implementations/             # Implementation blueprints
└── db_scripts/                       # SQL scripts for seeding & clearing
```

---

## 🧗 Challenges & Solutions

### 1. Multi-Seller Order Splitting

**The Problem**: Traditional e-commerce assumes one seller per order. When a buyer purchases from 3 different sellers, the system needs to create independent fulfillment records per seller while maintaining a single parent order for the buyer.

**The Solution**: Introduced the `SubOrder` entity with a unique constraint on `(OrderId, SellerId)`. The `OrderService.PlaceOrderAsync` groups cart items by `Product.SellerId` and creates independent sub-orders, each with its own status lifecycle (`Placed → Processing → Shipped → Delivered`). The parent `Order` tracks the buyer's total payment while sub-orders track per-seller fulfillment.

### 2. Race Conditions on Stock (Concurrency Control)

**The Problem**: Two buyers simultaneously purchasing the last item of a product variant can lead to overselling if stock deduction isn't atomic.

**The Solution**: EF Core's `[Timestamp]` attribute on `ProductVariant.RowVersion` implements optimistic concurrency control. When the second transaction attempts to save, EF Core detects the `RowVersion` mismatch and throws `DbUpdateConcurrencyException`. The order placement rolls back, and the buyer receives a 409 Conflict response. This avoids pessimistic locks that would hurt performance under normal load.

### 3. Commission Double-Claiming

**The Problem**: A seller could potentially request a payout, and before the admin processes it, request another payout that includes the same commissions — effectively double-claiming.

**The Solution**: `SellerCommission` also uses `RowVersion` concurrency tokens. When a payout is requested, commissions are atomically linked to a `SellerPayout` record. A second request against already-claimed commissions fails at the database level.

### 4. Refresh Token Security

**The Problem**: A stolen refresh token could allow an attacker to maintain persistent access indefinitely.

**The Solution**: Implemented **token rotation** (every refresh revokes the old token) combined with **reuse detection**. If a revoked token is reused — indicating the legitimate user and attacker are both trying to refresh — the system immediately kills **all** active tokens for that user, forcing complete re-authentication across all devices.

### 5. Return Window Enforcement

**The Problem**: Calculating whether a return is within the 14-day window from a status enum like `Delivered` is impossible — there's no timestamp.

**The Solution**: Added a concrete `Shipping.DeliveredAt` timestamp that gets stamped when the sub-order is marked delivered. The `ReturnService` validates `DateTime.UtcNow - DeliveredAt <= 14 days` before accepting return requests.

### 6. Price Consistency on Historical Orders

**The Problem**: If a seller changes a product's price after a buyer places an order, the order's financial records become incorrect.

**The Solution**: `OrderItem.PriceAtPurchase` locks the price at the moment of checkout. The order record always reflects what the buyer actually paid, regardless of future price changes. Similarly, products and addresses use soft deletes (`IsActive = false`) to preserve referential integrity.

### 7. Frontend State Synchronization

**The Problem**: Managing authentication state, token refresh, and role-based access across a React SPA with multiple feature modules.

**The Solution**: Centralized `AuthContext` with React Context API handles JWT storage, role mapping, silent token refresh on mount, and a custom `auth-logout` event for cross-tab logout synchronization. TanStack React Query manages all server state with 5-minute stale time and automatic background refetching.

### 8. Payment Flow Reliability

**The Problem**: Stripe webhooks can fail, arrive out of order, or be delayed — meaning the order status might not update after successful payment.

**The Solution**: Dual verification strategy: primary webhook (`checkout.session.completed`) with signature verification, plus a frontend polling fallback that calls `VerifySessionAsync` to check payment status directly with Stripe. This ensures the order is confirmed even if the webhook is delayed.

---

## 🗺 Future Roadmap

### 🔧 Deployment & Infrastructure

- [ ] **Cloud Deployment** — Azure App Service / AWS Elastic Beanstalk for API, Vercel / Netlify for frontend
- [ ] **Docker Containerization** — Dockerize API and frontend with Docker Compose for local development
- [ ] **CI/CD Pipeline** — GitHub Actions for automated build, test, and staged deployment (dev → staging → production)
- [ ] **Monitoring & Logging** — Application Insights / Serilog structured logging with health check endpoints

### 🛡 Technical Improvements

- [ ] **Global Exception Middleware** — Replace per-controller `try/catch` with RFC 7807 Problem Details responses
- [ ] **Standardized Pagination** — `PagedResult<T>` wrapper with `TotalPages`, `CurrentPage`, `HasNext`, `HasPrevious`
- [ ] **Unit & Integration Tests** — xUnit test suites for service layer, in-memory DB for repository tests
- [ ] **Real-Time Notifications** — SignalR hub for live push notifications to replace polling
- [ ] **Caching Layer** — Redis for product catalog caching and session management

### 🚀 Business Features

- [ ] **Full-Text Search** — Elasticsearch for advanced catalog search with faceted filtering and typo tolerance
- [ ] **Buyer–Seller Chat** — Real-time messaging for pre/post-purchase communication
- [ ] **Mobile App** — React Native or Flutter client consuming the existing REST API
- [ ] **Multi-Language** — i18n support for Arabic/English with RTL layout adaptation
- [ ] **Multi-Currency** — Support beyond EGP with real-time exchange rate conversion
- [ ] **Advanced Analytics** — Seller insights dashboard with revenue trends, customer demographics, and product performance
- [ ] **Subscription Plans** — Tiered seller plans with different commission rates and feature access

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- **Controllers** must NOT contain business logic — they only map HTTP to DTOs
- **Services** must handle ownership checks (verify the user owns the resource)
- **Repositories** return `IQueryable` for complex filters, or concrete lists for simple queries
- Use `CreateXRequestDto` for input DTOs, `XResponseDto` for output DTOs
- Throw `UnauthorizedAccessException` for 403, `KeyNotFoundException` for 404
- Never hard-delete Products or Addresses — use `IsActive = false`
- Stock deduction **must** use `RowVersion` concurrency checks

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the MENA region**

[Documentation](docs/) · [API Docs (Swagger)](https://localhost:7210/swagger) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>
