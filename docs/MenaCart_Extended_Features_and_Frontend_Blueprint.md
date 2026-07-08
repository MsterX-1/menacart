# MenaCart — Extended Features & Full Frontend Blueprint
### Cart · Catalog · Payments · Seller Lifecycle · Wishlist · Reviews · Loyalty · Account · Admin — Backend + Frontend

This is a **second, standalone document**, separate from `MenaCart_Implementation_Blueprint.md` (which covers Order Splitting/Shipping, JWT Auth, and Returns — backend only). That document remains the source of truth for those three features' backend logic. This one:

1. Specs the backend business logic for **14 feature areas** that exist as bare entities in `Domain/Models` but have no services/controllers yet.
2. Specs the **entire frontend** — for these 14 areas *and* for the three features in the first document, since none of it is built yet.

---

## Table of Contents

0. [Scope & Assumptions](#0-scope--assumptions)
1. [Frontend Architecture](#1-frontend-architecture)
2. [Shopping Core](#2-shopping-core) — Cart · Product Catalog · Payment Gateway · Dynamic Shipping
3. [Seller Lifecycle](#3-seller-lifecycle) — Registration · KYC Documents · Bank Info & Payouts
4. [Engagement](#4-engagement) — Wishlist · Reviews & Ratings · Loyalty & Rewards
5. [Account & Support](#5-account--support) — Address Book · User Profile · Notifications
6. [Admin](#6-admin) — Category Management
7. [Frontend for Previously-Built Backend (Order/Auth/Returns)](#7-frontend-for-previously-built-backend)
8. [Database Changes — Consolidated](#8-database-changes--consolidated)
9. [File-by-File Implementation Plan](#9-file-by-file-implementation-plan)
10. [Development Plan](#10-development-plan)
11. [Checklist](#11-checklist)
12. [Best Practices](#12-best-practices)

---

## 0. Scope & Assumptions

**Full gap analysis** — the other AI's list (1–6) plus what I found reviewing every entity in your schema (7–14):

| # | Feature | Entities (all already exist) | Backend needed | Frontend needed |
|---|---|---|---|---|
| 1 | Wishlist | `Wishlist` | ✅ | ✅ |
| 2 | Loyalty & Rewards | `LoyaltyPoint` | ✅ | ✅ |
| 3 | Reviews & Ratings | `Review`, `SellerReview` | ✅ | ✅ |
| 4 | Seller Payouts & Bank Info | `SellerPayout`, `SellerBankInfo` | ✅ | ✅ |
| 5 | Seller KYC Documents | `SellerDocument` | ✅ | ✅ |
| 6 | Dynamic Shipping Costs | `SellerShippingRule` | ✅ (modifies Feature A) | ✅ |
| 7 | Cart Management | `Cart`, `CartItem` | ✅ | ✅ |
| 8 | Product Catalog Management | `Product`, `ProductVariant`, `ProductImage` | ✅ | ✅ |
| 9 | Payment Gateway Integration | `Payment` | ✅ | ✅ |
| 10 | Seller Registration/Onboarding | `SellerProfile` | ✅ | ✅ |
| 11 | Address Book Management | `Address` | ✅ | ✅ |
| 12 | Category Management | `Category` | ✅ | ✅ |
| 13 | Notification Consumption | `Notification` | ✅ (list/read only — creation already happens as a side effect elsewhere) | ✅ |
| 14 | User Profile Management | `User` | ✅ | ✅ |

**The good news, again**: every entity above already exists in `Domain/Models` and `AppDbContext`. This document adds **zero new tables**. It does need a handful of new columns — all listed together in [Section 8](#8-database-changes--consolidated) so you're not hunting through 14 feature write-ups to find them.

**Frontend stack assumption** (flag if wrong — changes a lot below): **React + TypeScript + Vite**, matching your Hospital ERP project. Routing via **React Router v6**. Server state via **TanStack Query (React Query)** — matches the silent-refresh/interceptor pattern already described in the first blueprint. Auth/session state via a lightweight **React Context**. Styling library is intentionally left to your choice (Tailwind, MUI, plain CSS — this document specs structure and data flow, not visual styling).

**Not designed here, flagged where relevant**: the actual payment provider integration (Stripe, Paymob, Fawry, etc. — Section 2.3 designs against an interface so the concrete provider is swappable), and the exact loyalty-points-to-currency conversion rate (Section 4.3, left as a configuration value).

---

## 1. Frontend Architecture

This section applies to the whole app — both the 14 features below and the three from the first blueprint. Nothing here is built yet.

**Folder structure:**
```
src/
├── api/            # thin fetch wrappers, one file per resource (ordersApi.ts, cartApi.ts, ...)
├── hooks/           # React Query hooks per resource (useCart, useOrders, useWishlist, ...)
├── context/         # AuthContext — current user, roles, access token, login/logout
├── components/      # shared/dumb components (Button, Modal, StatusBadge, PriceTag, ...)
├── features/        # one folder per feature — components + page(s) + local hooks
│   ├── auth/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── products/
│   ├── returns/
│   ├── wishlist/
│   ├── reviews/
│   ├── loyalty/
│   ├── seller-onboarding/
│   ├── seller-dashboard/
│   ├── account/
│   └── admin/
├── routes/          # route table + route guards (ProtectedRoute, RoleRoute)
└── App.tsx
```

**Route guards**: `<ProtectedRoute>` redirects to `/login` if no valid access token (attempting a silent refresh first, per the first blueprint's interceptor pattern). `<RoleRoute roles={["Seller"]}>` wraps seller/admin-only routes and redirects to a 403 page rather than rendering anything — matching the "absence, not disabled" permission rule from the first blueprint.

**Master route table** (consolidated across both documents — this is every route in the app):

| Route | Page | Roles | Feature |
|---|---|---|---|
| `/login`, `/register` | `LoginPage`, `RegisterPage` | public | Auth (doc 1) |
| `/` , `/products`, `/products/:id` | `HomePage`, `ProductListPage`, `ProductDetailPage` | public | Product Catalog |
| `/cart` | `CartPage` | Buyer | Cart |
| `/checkout` | `CheckoutPage` | Buyer | Order (doc 1) + Shipping Costs |
| `/orders`, `/orders/:id` | `OrderHistoryPage`, `OrderDetailPage` | Buyer | Order (doc 1) + Returns (doc 1) |
| `/returns` | `MyReturnsPage` | Buyer | Returns (doc 1) |
| `/sellers/:id` | `SellerProfilePage` | public | Reviews (4.2) |
| `/wishlist` | `WishlistPage` | Buyer | Wishlist |
| `/account`, `/account/addresses`, `/account/loyalty` | `ProfilePage`, `AddressBookPage`, `LoyaltyPage` | Buyer | Profile, Address Book, Loyalty |
| `/notifications` | `NotificationsPage` | any authenticated | Notifications |
| `/sell/apply` | `SellerApplicationPage` | Buyer (applying) | Seller Onboarding |
| `/seller/dashboard` | `SellerDashboardPage` | Seller | overview |
| `/seller/products`, `/seller/products/new`, `/seller/products/:id/edit` | `SellerProductListPage`, `ProductFormPage` | Seller | Product Catalog |
| `/seller/orders` | `SellerOrdersPage` | Seller | Order (doc 1) |
| `/seller/returns` | `SellerReturnsPage` | Seller | Returns (doc 1) |
| `/seller/documents` | `SellerDocumentsPage` | Seller | KYC |
| `/seller/bank-info` | `SellerBankInfoPage` | Seller | Payouts |
| `/seller/payouts` | `SellerPayoutsPage` | Seller | Payouts |
| `/seller/shipping-rules` | `SellerShippingRulesPage` | Seller | Dynamic Shipping |
| `/admin/products` | `AdminProductApprovalPage` | Admin | Product Catalog |
| `/admin/sellers` | `AdminSellerApprovalPage` | Admin | Seller Onboarding |
| `/admin/categories` | `AdminCategoriesPage` | Admin | Category Management |
| `/admin/payouts` | `AdminPayoutsPage` | Admin | Payouts |

**Data-fetching pattern** (applies everywhere below, stated once here rather than repeated 14 times): every resource gets a `use{Resource}` hook wrapping TanStack Query — e.g. `useCart()` returns `{data, isLoading, error}` and exposes mutations (`addItem`, `removeItem`) that call the corresponding `api/cartApi.ts` function and invalidate the `['cart']` query key on success. Every page follows the same three UI states: loading skeleton → error banner with retry → content. Forms follow the same pattern: submit button disabled while pending, inline field errors from a `400` response mapped by field name, generic toast for other errors.

---

## 2. Shopping Core

### 2.1 Cart Management

No schema changes. Uses existing `Cart`/`CartItem`.

**Add item** — *Preconditions*: Buyer authenticated; variant exists and its `Product.ApprovalStatus == Approved`. *Validation*: `Quantity >= 1`; cumulative quantity (existing cart qty + new) `<= StockQuantity`. *Logic*: get-or-create the caller's `Cart` (`Cart.UserId` is unique); if a `CartItem` for `(CartId, VariantId)` already exists, increment its quantity, else insert. *Edge case*: requested quantity exceeds stock — cap at available stock and tell the buyer, don't silently reject the whole action. *Failure*: unapproved/deleted variant → `404`. *Success*: `200` with the updated cart summary.

**Update quantity** — owner-only (`CartItem.Cart.UserId == caller`). Re-validates against current stock (which may have dropped since the item was added) — if now insufficient, cap and flag rather than error out.

**Remove item** — straightforward delete, owner-only.

**View cart** — returns `CartResponseDto` with per-item variant details (name/color/size/price/image), line totals, cart subtotal, and a `stockWarnings` list for any item whose quantity now exceeds live stock — this is what lets the buyer fix problems *before* checkout instead of hitting the `409` from Feature A's `PlaceOrder`.

**API**

| Method | Route | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/cart` | Buyer | — | `CartResponseDto` |
| POST | `/api/cart/items` | Buyer | `AddCartItemRequestDto {VariantId, Quantity}` | `200 CartResponseDto` |
| PATCH | `/api/cart/items/{cartItemId}` | Buyer (owner) | `{Quantity}` | `200 CartResponseDto` |
| DELETE | `/api/cart/items/{cartItemId}` | Buyer (owner) | — | `204` |

**Frontend**: `ProductDetailPage` has variant picker (color/size) → "Add to Cart" (disabled until a variant is selected or if out of stock). `CartPage`: line items with quantity steppers, inline stock-warning banners, subtotal, "Proceed to Checkout" (disabled while any stock warning is unresolved or cart is empty). Nav bar cart icon shows a live item-count badge via `useCart()`, invalidated on every mutation.

---

### 2.2 Product Catalog Management

Uses existing `Product`, `ProductVariant`, `ProductImage`. **Schema additions** (full list in Section 8): `Product.AverageRating`, `Product.ReviewCount` (cached, populated by the Reviews feature — Section 4.2), `Product.IsActive` (lets a seller hide/discontinue an approved product without losing its approval history or reviews — nothing in the current schema supports this), `Product.RejectionReason`.

**Create product (seller)** — *Preconditions*: caller's `SellerProfile.Status == Active` (a pending/suspended seller can't list anything). *Validation*: `Name` required, `BasePrice > 0`, `CategoryId` exists, at least one variant with a unique `Sku`. *Logic*: insert `Product` (`ApprovalStatus = Pending`, `IsActive = true`), insert initial `ProductVariant`(s). *Edge case*: duplicate `Sku` → `409`, surfaced clearly rather than a generic DB-constraint error. *Success*: `201`, invisible to buyers until approved.

**Update product / manage variants (seller)** — owner-only. Editing name/description/images or adding a new variant does **not** reset `ApprovalStatus` back to `Pending` (assumption — flag if you want re-review on edits). Setting `IsActive = false` hides it from the public catalog immediately without touching approval state.

**Upload / reorder images (seller)** — multipart upload → `ProductImage` row; first image uploaded defaults `IsPrimary = true`; subsequent uploads can be promoted via a separate call.

**Approve/reject (admin)** — *Preconditions*: `Product.ApprovalStatus == Pending` (can't re-review a decided product, same pattern as Returns in doc 1). *Logic*: set `Approved` or `Rejected` + required `RejectionReason` on reject. *Success*: buyer-facing listing appears once `Approved` and `IsActive`.

**API**

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/api/products` | public | filter by category/search/price; only `Approved` + `IsActive` |
| GET | `/api/products/{id}` | public | includes variants, images, `AverageRating` |
| GET | `/api/seller/products` | Seller | own products, any status |
| POST | `/api/seller/products` | Seller | create |
| PUT | `/api/seller/products/{id}` | Seller (owner) | update |
| POST | `/api/seller/products/{id}/variants` | Seller (owner) | add variant |
| POST | `/api/seller/products/{id}/images` | Seller (owner) | multipart upload |
| PATCH | `/api/seller/products/{id}/images/{imageId}/set-primary` | Seller (owner) | — |
| PATCH | `/api/admin/products/{id}/approval` | Admin | `{Status, RejectionReason?}` |

**Frontend**: Seller — `SellerProductListPage` (status badges: Pending/Approved/Rejected, active/hidden toggle), `ProductFormPage` (repeatable variant sub-form for color/size/stock/price, drag-drop image uploader with set-primary/reorder). Buyer — `ProductListPage` (category/price/search filters), `ProductDetailPage` (image gallery, variant picker feeding Add-to-Cart, reviews section per 4.2). Admin — `AdminProductApprovalPage`: queue of `Pending` products, reject requires a reason field before the button enables.

---

### 2.3 Payment Gateway Integration

Uses existing `Payment`. **This is the one feature area where I can't make the concrete decision for you**: Stripe doesn't operate directly in Egypt — Paymob or Fawry are the common local choices, and which one changes real implementation details. Everything below is designed against an interface so swapping providers later doesn't ripple through the rest of the app:

```csharp
public interface IPaymentGatewayService
{
    Task<PaymentInitiationResult> InitiatePaymentAsync(int orderId, decimal amount, string currency);
    Task<WebhookResult> HandleWebhookAsync(string payload, string signature);
    Task RefundAsync(int paymentId, decimal amount);
}
```

**Initiate payment** — *Preconditions*: `Order.PaymentStatus == Pending`, caller owns the order. *Logic*: call `InitiatePaymentAsync`; create a `Payment` row (`Status = Pending`, `Amount = Order.TotalAmount`); return the provider's redirect URL / client token to the frontend. *Failure*: already paid → `409`, never double-charge.

**Webhook callback** — called by the provider, not a logged-in user — **must verify the provider's signature before processing anything**, this is the actual security boundary here, not a JWT. *Logic*: verify signature → reject `400` and log as a security event if it fails, without processing; look up `Payment` by the correlation id passed at initiation; update `Status`/`PaidAt`; on success also set `Order.PaymentStatus = Paid`; on failure set `Failed` and notify the buyer to retry. *Edge case*: providers commonly redeliver webhooks — check the `Payment` isn't already in a terminal state before reprocessing (idempotency).

**Refund** — triggered by Returns (doc 1) when a `Return.Status` moves to `Completed`: call `RefundAsync`, set `Payment.Status = Refunded`.

**API**

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/orders/{orderId}/payments/initiate` | Buyer (owner) | returns redirect URL / client token |
| POST | `/api/payments/webhook` | **none** — signature-verified instead | called by the payment provider |
| GET | `/api/orders/{orderId}/payment-status` | Buyer (owner) | for confirmation-page polling |

**Frontend**: after `PlaceOrder` succeeds (doc 1), redirect to `PaymentPage` — either a redirect to the provider's hosted page or an embedded SDK widget, genuinely provider-dependent. `OrderConfirmationPage` polls `payment-status` every few seconds until `Paid`/`Failed` rather than relying solely on webhook timing for what the buyer sees.

---

### 2.4 Dynamic Shipping Costs

Uses existing `SellerShippingRule`. **Modifies Feature A's `PlaceOrderAsync`** from doc 1. **Schema addition**: `SubOrder.ShippingCost` (records what was actually charged per seller — needed for order-history display and return-refund math later).

**Calculate at checkout** — for each seller group: look up a `SellerShippingRule` matching `(SellerId, Address.City)`, fall back to `(SellerId, Address.Country)`, fall back to a platform default (`Shipping:DefaultCost` config) if the seller has no rule at all. If that seller-group's subtotal `>= rule.FreeShippingAbove`, `SubOrder.ShippingCost = 0`. `Order.TotalAmount` becomes item subtotals + all `SubOrder.ShippingCost` − coupon discount. *Edge case*: no matching rule **and** no default configured — reject checkout for that seller's items with a clear error rather than silently charging 0 (doc 1 flagged this as an open gap; leaving it silent now would be the wrong fix).

**API**

| Method | Route | Auth |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/seller/shipping-rules` | Seller (own) |
| GET | `/api/cart/shipping-estimate?addressId=` | Buyer | pre-checkout preview |

**Frontend**: `SellerShippingRulesPage` — table of rules (city/country/cost/free-above/days) with add/edit/delete. `CheckoutPage` shows a per-seller shipping breakdown as soon as an address is selected, before the buyer commits to placing the order.

---

## 3. Seller Lifecycle

### 3.1 Seller Registration / Onboarding

Uses existing `SellerProfile`. **Schema addition**: `SellerProfile.RejectionReason` (nullable) — there's currently no field to record why an application was rejected.

**Apply to become a seller** — *Preconditions*: caller has no existing `SellerProfile`, or their existing one is `Rejected` (reapplication is allowed; anything `Pending`/`Active`/`Suspended` blocks a new application — `409`). *Logic*: create (or update, if reapplying) `SellerProfile` with `Status = Pending`. **Does not** grant the `Seller` Identity role yet — that only happens on approval below. *Success*: `201`, prompts the seller to upload KYC documents next (3.2).

**Admin approves/rejects application** — *Preconditions*: `Status == Pending`, and **at least one `SellerDocument` with `Status == Approved`** (ties directly to 3.2 — you can't activate a seller with zero approved KYC documents; tighten to "one of each required document type" later if needed, this is the MVP rule). *Logic — approve*: `Status = Active`, `IsVerified = true`, **and insert an `AspNetUserRoles` row assigning the `Seller` role** to the user — this is the actual moment they gain access to every seller-only endpoint in this document. *Logic — reject*: `Status = Rejected` + required `RejectionReason`, notify.

**Suspend (ongoing moderation)** — Admin sets `Status = Suspended` at any time. The `Seller` Identity role is **not** revoked — every seller-only operation elsewhere in this document (creating products, etc.) gates on `SellerProfile.Status == Active`, not just the role, so suspension takes effect immediately without touching role assignments.

**API**

| Method | Route | Auth |
|---|---|---|
| POST | `/api/seller/apply` | any authenticated user without a blocking existing profile |
| GET / PUT | `/api/seller/profile` | Seller (own) |
| GET | `/api/admin/sellers?status=` | Admin |
| PATCH | `/api/admin/sellers/{sellerId}/approval` | Admin — `{Status, RejectionReason?}` |
| PATCH | `/api/admin/sellers/{sellerId}/suspend` | Admin |

**Frontend**: `SellerApplicationPage` (store name/description/address/phone) → submit → routes straight to `SellerDocumentsPage`. Buyer nav shows "Become a Seller" when no profile exists; "Application under review" banner while `Pending`; full seller dashboard nav once `Active`. `AdminSellerApprovalPage`: queue of `Pending` applications with their documents visible inline for review.

---

### 3.2 Seller KYC Documents

Uses existing `SellerDocument`. **Schema addition**: `SellerDocument.RejectionReason` (nullable).

**Upload document** — *Preconditions*: caller has a `SellerProfile` (`Pending` or `Active` — uploads can happen before initial approval or later, e.g. renewing an expired license). *Validation*: `DocumentType` from a known set (tax ID, business license, national ID — configurable, not hardcoded). *Logic*: multipart upload → store, insert `SellerDocument` (`Status = Pending`).

**Admin review** — *Preconditions*: `Status == Pending`. *Logic*: `Approved`/`Rejected` + reason on reject.

**API**

| Method | Route | Auth |
|---|---|---|
| POST | `/api/seller/documents` | Seller — multipart |
| GET | `/api/seller/documents` | Seller (own) |
| GET | `/api/admin/sellers/{sellerId}/documents` | Admin |
| PATCH | `/api/admin/documents/{documentId}/review` | Admin — `{Status, RejectionReason?}` |

**Frontend**: `SellerDocumentsPage` — uploaded docs with status badges, upload form (type picker + file input). Reviewed inline on the same `AdminSellerApprovalPage` from 3.1, not a separate screen.

---

### 3.3 Seller Bank Info & Payouts

Uses existing `SellerBankInfo`, `SellerPayout`, and `SellerCommission` (from doc 1). **Schema additions**: `SellerCommission.PayoutId` (nullable FK to `SellerPayout`) — without this, nothing links a commission row to the payout that covered it, and a seller could be paid twice for the same sale; a unique index on `SellerBankInfo.SellerId` (assumption: one active bank account per seller, simplest model — flag if you want to support multiple with a primary flag instead, similar to `Address.IsDefault`).

**Manage bank info (seller)** — owner-only CRUD. **Important permission note**: Admin can *view* bank info (needed to process a payout) but should **not** be able to edit it — an admin silently redirecting a seller's payout destination is a real fraud vector worth designing out from the start, not patching in later.

**Settle commissions** — not an HTTP endpoint, a scheduled background job: a `SellerCommission` moves from `Pending` to `Settled` once its `SubOrder` reached `Delivered` **and** the return window (doc 1, Feature C) has passed with no active `Return` on any of its `OrderItem`s.

**Generate payout (admin, on-demand or scheduled)** — *Preconditions*: seller has bank info on file (block generation otherwise, surfaced clearly rather than creating an unpayable `SellerPayout`). *Logic*: aggregate every `Settled` commission with `PayoutId == null` for the seller → `Amount = Σ(SaleAmount − CommissionAmount)` → create `SellerPayout` (`Status = Pending`) → set `PayoutId` on every included commission, so they can never be aggregated into a second payout.

**Mark payout transferred (admin)** — manual step, since paying sellers out is typically a batch bank transfer, not a real-time gateway call like Section 2.3's buyer-facing payments. *Logic*: `Status = Paid`, `PayoutDate = now`, `TransactionRef` from the admin's input, notify seller.

**API**

| Method | Route | Auth |
|---|---|---|
| GET / PUT | `/api/seller/bank-info` | Seller (own) |
| GET | `/api/seller/payouts` | Seller (own) |
| GET | `/api/admin/payouts?sellerId=&status=` | Admin |
| POST | `/api/admin/payouts/generate` | Admin — `{sellerId}` |
| PATCH | `/api/admin/payouts/{payoutId}/mark-transferred` | Admin — `{TransactionRef}` |

**Frontend**: `SellerBankInfoPage` (simple form). `SellerPayoutsPage` — payout history table plus a live "pending balance" figure (sum of `Settled`, unpaid commissions). `AdminPayoutsPage` — per-seller pending-balance list, "Generate Payout" action, and a table of generated payouts with "Mark Transferred" (opens a small form for the transaction reference).

---

## 4. Engagement

### 4.1 Wishlist

Uses existing `Wishlist` (unique `(UserId, VariantId)` already configured in `AppDbContext`).

**Add** — idempotent: if the `(UserId, VariantId)` pair already exists, treat as success rather than a `409` — a heart-icon toggle shouldn't need to know whether it's already been tapped. **Remove** — owner-only delete. **View** — list with variant/product details. **Move to cart** — inserts/increments the corresponding `CartItem` (Section 2.1's logic) and removes the `Wishlist` row in the same call (assumption: moving to cart removes it from the wishlist — flag if you'd rather keep it in both places).

**API**

| Method | Route | Auth |
|---|---|---|
| GET | `/api/wishlist` | Buyer |
| POST | `/api/wishlist/items` | Buyer — `{VariantId}`, idempotent |
| DELETE | `/api/wishlist/items/{wishlistId}` | Buyer (owner) |
| POST | `/api/wishlist/items/{wishlistId}/move-to-cart` | Buyer (owner) |

**Frontend**: heart-icon toggle on `ProductCard`/`ProductDetailPage` (filled state driven by `useWishlist()`). `WishlistPage` — grid of saved items, "Move to Cart"/"Remove" per item, out-of-stock items shown with "Move to Cart" disabled rather than hidden.

---

### 4.2 Reviews & Ratings

Uses existing `Review`, `SellerReview`. **Schema additions**: unique index on `Review(UserId, ProductId)` and `SellerReview(CustomerId, SellerId)` — one review per product/seller per buyer, edited rather than stacked (ties into `Product.AverageRating`/`ReviewCount` added in Section 2.2; `SellerProfile.Rating` already exists in your schema for exactly this purpose on the seller side).

**Leave/edit a product review** — *Preconditions*: caller has at least one `OrderItem` for this product whose `SubOrder.Status == Delivered` ("verified purchase only" — no purchase, no review, `403`). *Logic*: upsert the `Review` row (insert if none exists for this `(UserId, ProductId)`, otherwise update it — same endpoint handles both), then recompute `Product.AverageRating`/`ReviewCount` in the same transaction. **Delete own review** recomputes the same aggregate afterward.

**Leave/edit a seller review** — identical pattern against `SellerReview`, gated on having at least one `Delivered` `SubOrder` with that seller, recomputing `SellerProfile.Rating` afterward.

**API**

| Method | Route | Auth |
|---|---|---|
| GET | `/api/products/{id}/reviews` | public |
| POST | `/api/products/{id}/reviews` | Buyer — `{Rating, Comment}`, upsert |
| DELETE | `/api/products/{id}/reviews` | Buyer (own) |
| GET | `/api/sellers/{id}/reviews` | public |
| POST | `/api/sellers/{id}/reviews` | Buyer — `{Rating, Comment}`, upsert |

**Frontend**: `ProductDetailPage` reviews section — average stars + count prominent near the top, paginated review list below, "Write a Review" button (becomes "Edit your review" if one already exists; hidden — not just disabled — if the buyer never purchased). A public `SellerProfilePage` (`/sellers/:id`, add to the Section 1 route table) shows the seller's rating, review list, and product catalog — this route didn't exist before this feature and is new.

---

### 4.3 Loyalty & Rewards

Uses existing `LoyaltyPoint`. **No schema changes** — `LoyaltyPoint` is already an append-only ledger (points + reason + timestamp, no mutable "balance" column), which is the right shape for this: balance is always `SUM(Points)`, never stored directly, so it can't drift out of sync with history. **Configuration needed** (business decision, not something I can set for you): `Loyalty:PointsPerCurrencyUnit` (earn rate) and `Loyalty:PointsToCurrencyRate` (redemption rate).

**Award points** — not a standalone endpoint: a side effect added to **doc 1's `UpdateSubOrderStatusAsync`**, triggered when a `SubOrder` reaches `Delivered`. `Points = floor(subOrderSubtotal / PointsPerCurrencyUnit)`, inserted as a `LoyaltyPoint` row (`Reason = "Order #{id} delivered"`). *Edge case*: if that `SubOrder` later has an approved `Return`, insert a negative `LoyaltyPoint` row (`Reason = "Return adjustment"`) rather than mutating history — keeps the ledger auditable.

**Redeem at checkout** — **modifies doc 1's `CreateOrderRequestDto`**, adding an optional `RedeemPoints` field. *Validation*: `RedeemPoints <= current balance`; resulting discount can't exceed the order subtotal. *Logic*: coupon discount (doc 1) applies first, then points redemption on the remaining amount — avoids ambiguity about stacking order; insert a negative `LoyaltyPoint` row (`Reason = "Redeemed at checkout"`).

**API**

| Method | Route | Auth |
|---|---|---|
| GET | `/api/loyalty` | Buyer — returns `{Balance, History: List<LoyaltyPointDto>}` |

**Frontend**: `LoyaltyPage` — balance prominent, history list (date/reason/±points). `CheckoutPage` gets a "Redeem Points" control (slider or input) showing the live discount equivalent, capped at both balance and order subtotal.

---

## 5. Account & Support

### 5.1 Address Book Management

Uses existing `Address` (already has `AddressType`, `IsDefault`). **Flagging a real risk, not just a gap**: `Order.AddressId` is a required (non-nullable) FK with no explicit delete behavior configured in `AppDbContext` — EF Core's default for a required FK is `Cascade`. That means hard-deleting an `Address` that's referenced by a past order would **cascade-delete the order itself**, silently destroying order history. **Schema addition**: add `Address.IsActive` (bool) and configure `Order → Address` as `DeleteBehavior.Restrict`; "delete" in the address book becomes `IsActive = false` (hidden from the book, order history keeps working), never a real `DELETE`.

**Add** — if `IsDefault = true` is requested, unset `IsDefault` on the caller's other addresses of the *same* `AddressType` first (default is scoped per type — a shipping default and a billing default can differ). **Edit/soft-delete** — owner-only. **Set default** — same unset-others logic as add.

**API**

| Method | Route | Auth |
|---|---|---|
| GET | `/api/account/addresses` | Buyer (own) |
| POST | `/api/account/addresses` | Buyer |
| PUT | `/api/account/addresses/{id}` | Buyer (owner) |
| DELETE | `/api/account/addresses/{id}` | Buyer (owner) — soft delete |
| PATCH | `/api/account/addresses/{id}/set-default` | Buyer (owner) |

**Frontend**: `AddressBookPage` — list filterable by type, add/edit forms, set-default action, delete with a confirmation note if the address appears in past orders. `CheckoutPage`'s address picker reuses this same list with an inline "add new" option.

---

### 5.2 User Profile Management

Uses existing `User` (Identity). **Scoping decision**: email changes are **out of scope here** — re-verifying a changed email is its own flow (Identity's confirmation-token mechanism) and deserves its own design pass rather than being bolted onto a basic profile form. This endpoint covers name/phone only.

**View/update profile** — `FirstName`, `LastName`, `Phone` editable; `Email` shown read-only. **Change password** — via Identity's `UserManager.ChangePasswordAsync`, which validates the current password internally — no need to hand-roll that check.

**API**

| Method | Route | Auth |
|---|---|---|
| GET | `/api/account/profile` | any authenticated |
| PUT | `/api/account/profile` | any authenticated — `{FirstName, LastName, Phone}` |
| POST | `/api/account/change-password` | any authenticated — `{CurrentPassword, NewPassword}` |

**Frontend**: `ProfilePage` — name/phone edit form, separate "Change Password" sub-form (current/new/confirm), email displayed with a "contact support to change" note.

---

### 5.3 Notification Consumption

Uses existing `Notification` — already being *created* as a side effect throughout this document and doc 1 (order placed, return requested/reviewed, seller application decided, etc.). What's missing is purely the read side. **Optional schema addition**: `Notification.LinkUrl` (nullable) — without it, notifications are read-only text with no "click through to the relevant order/return/application" behavior. Not required, but worth it given how many flows generate these.

**List** — paginated, newest first, optional `unreadOnly` filter. **Mark read** — single or bulk (`mark-all-read`).

**API**

| Method | Route | Auth |
|---|---|---|
| GET | `/api/notifications?unreadOnly=` | own |
| PATCH | `/api/notifications/{id}/read` | own |
| PATCH | `/api/notifications/mark-all-read` | own |

**Frontend**: nav bell icon with an unread-count badge (short `refetchInterval` via React Query rather than a full push/websocket setup — sufficient for MVP). Dropdown or dedicated `NotificationsPage` — clicking a notification marks it read and, if `LinkUrl` is populated, navigates there.

---

## 6. Admin

### 6.1 Category Management

Uses existing `Category` (self-referencing `ParentCategoryId`, already `Restrict`-configured in `AppDbContext`).

**Create/edit** — *Validation*: `Name` required; if `ParentCategoryId` is set, it must exist and must not create a cycle — check the *entire* ancestor chain, not just "parent isn't itself," since a category could be made a descendant of its own grandchild in a deep enough tree. **Delete** — the existing `Restrict` config means the database will reject deletion of a category that still has child categories or products pointing to it; the service layer should check for both first and return a clear `409` ("this category has 3 subcategories and 12 products — reassign or remove them first") rather than letting a raw DB constraint exception surface to the admin.

**API**

| Method | Route | Auth |
|---|---|---|
| GET | `/api/categories` | public — tree or flat, used by product filters/forms everywhere else in this document |
| POST | `/api/admin/categories` | Admin |
| PUT | `/api/admin/categories/{id}` | Admin |
| DELETE | `/api/admin/categories/{id}` | Admin |

**Frontend**: `AdminCategoriesPage` — expand/collapse tree view, inline add/edit/delete, delete blocked with the specific in-use count when applicable.

---

## 7. Frontend for Previously-Built Backend

The business logic for these three lives entirely in doc 1 — this section only adds the concrete pages/components/routes doc 1 never specified (it only had prose "Frontend Behavior" descriptions).

### 7.1 Order Placement, History & Seller Fulfillment

**`CheckoutPage`**: address selector (reuses the Address Book list, 5.1) → coupon code field (validated inline before final submit) → per-seller shipping breakdown (2.4) → loyalty points redemption slider (4.3) → order summary grouped by seller (items, subtotal, shipping, discount, total) → "Place Order" calls doc 1's `POST /api/orders`, then redirects to `PaymentPage` (2.3), then `OrderConfirmationPage`.

**`OrderHistoryPage`**: list of past orders (overall status + total), click-through to detail.

**`OrderDetailPage`**: grouped by seller (`SubOrder` sections), each with its own status badge and tracking info once shipped; "Request Return/Exchange" appears per delivered line item (feeds 7.3).

**`SellerOrdersPage`**: seller's own `SubOrder`s, filterable by status; row action opens a small form requiring carrier + tracking number before "Mark Shipped" is enabled (doc 1's validation rule).

### 7.2 Authentication

**One backend gap surfaced by building this out**: doc 1 explicitly *assumed* a registration endpoint already existed rather than confirming it — worth checking before building `RegisterPage` against nothing. If it doesn't exist: `POST /api/auth/register {Email, Password, FirstName, LastName}` — creates the Identity user, assigns the default `Buyer` role, returns an `AuthResponseDto` shaped identically to Login's so the frontend can treat registration as "login, but you also provided a name."

**`LoginPage`** / **`RegisterPage`**: standard forms, generic error messaging per doc 1's Section 2.2 (never distinguish *why* login failed). Successful auth stores tokens and redirects to the originally-intended page (or home). Silent refresh and logout follow the interceptor pattern already described in Section 1 and doc 1 — not repeated here.

### 7.3 Returns & Exchanges

**`OrderDetailPage`**'s "Request Return/Exchange" opens a form: Return/Exchange toggle, reason textarea, variant picker (scoped to the same product's other in-stock variants) when Exchange is selected.

**`/returns` → `MyReturnsPage`** (new route, add to Section 1's table) — a buyer's full return-request history in one place, rather than only visible per-order.

**`SellerReturnsPage`**: pending requests for the seller's own items, approve/reject, rejection requires a reason before the button enables (doc 1's rule).

---

## 8. Database Changes — Consolidated

Every schema change mentioned above, in one place, plus the two still outstanding from doc 1 (carried over here so this is a complete migration checklist without flipping between documents).

**New columns**

| Table | Column | Type | Why |
|---|---|---|---|
| `Product` | `AverageRating` | `decimal(3,2)`, default `0` | cached aggregate for Reviews (4.2) |
| `Product` | `ReviewCount` | `int`, default `0` | cached aggregate for Reviews (4.2) |
| `Product` | `IsActive` | `bit`, default `1` | seller can hide/discontinue without losing approval history (2.2) |
| `Product` | `RejectionReason` | `nvarchar(500)`, null | admin approval workflow (2.2) |
| `SubOrder` | `ShippingCost` | `decimal(10,2)`, default `0` | dynamic shipping (2.4) |
| `SellerProfile` | `RejectionReason` | `nvarchar(500)`, null | onboarding (3.1) |
| `SellerDocument` | `RejectionReason` | `nvarchar(500)`, null | KYC review (3.2) |
| `SellerCommission` | `PayoutId` | `int`, null, FK → `SellerPayout` | prevents double-paying a commission (3.3) |
| `Address` | `IsActive` | `bit`, default `1` | soft delete — see the cascade risk below (5.1) |
| `Notification` | `LinkUrl` | `nvarchar(500)`, null | optional — click-through (5.3) |
| `Shipping` | `DeliveredAt` | `datetime2`, null | **carried over from doc 1**, still outstanding |

**New/changed constraints**

| Change | Why |
|---|---|
| `Order → Address`: `DeleteBehavior.Restrict` | **currently defaults to `Cascade`** — deleting an `Address` referenced by an `Order` would silently delete the order too (5.1) |
| Unique index `Review(UserId, ProductId)` | one review per product per buyer (4.2) |
| Unique index `SellerReview(CustomerId, SellerId)` | one review per seller per buyer (4.2) |
| Unique index `SellerBankInfo(SellerId)` | one active bank account per seller — assumption, flagged in 3.3 |
| Enum `HasConversion<string>()` on all status/type enums | **carried over from doc 1**, still outstanding |

**New configuration keys** (`appsettings.json`)
```json
{
  "Shipping": { "DefaultCost": 50 },
  "Loyalty": {
    "PointsPerCurrencyUnit": 10,
    "PointsToCurrencyRate": 10
  }
}
```
Both loyalty rates and the default shipping cost are business decisions, not technical ones — the numbers above are placeholders, not recommendations.

**Migration**:
```
dotnet ef migrations add ExtendedFeaturesSchema
dotnet ef database update
```
(Can be combined with doc 1's still-outstanding `DeliveredAt`/enum-conversion migration into one, since neither has been applied yet.)

---

## 9. File-by-File Implementation Plan

Domain entities already exist for everything here (Section 0), so unlike doc 1, most Domain rows below are **Modify** (adding the columns from Section 8), not **Create**. Grouped by section; DTOs grouped per feature rather than one row each, to keep this navigable across 14 feature areas.

### 9.1 Shopping Core (Section 2)

| File | Action | Reason |
|---|---|---|
| `Domain/Models/Product.cs` | Modify | `AverageRating`, `ReviewCount`, `IsActive`, `RejectionReason` |
| `Domain/Models/SubOrder.cs` | Modify | `ShippingCost` |
| `Application/DTOs/Cart/*.cs` | Create | `AddCartItemRequestDto`, `UpdateCartItemRequestDto`, `CartResponseDto`, `CartItemDto` |
| `Application/DTOs/Products/*.cs` | Create | `CreateProductRequestDto`, `UpdateProductRequestDto`, `ProductResponseDto`, `ProductVariantDto`, `ProductApprovalRequestDto` |
| `Application/DTOs/Payments/*.cs` | Create | `PaymentInitiationResponseDto`, `PaymentStatusDto` |
| `Application/DTOs/Shipping/*.cs` | Create | `ShippingRuleRequestDto`, `ShippingRuleResponseDto`, `ShippingEstimateDto` |
| `Application/Interfaces/ICartService.cs` / `ICartRepository.cs` | Create | |
| `Application/Interfaces/IProductService.cs` / `IProductRepository.cs` | Create | |
| `Application/Interfaces/IPaymentGatewayService.cs` / `IPaymentService.cs` / `IPaymentRepository.cs` | Create | interface in Section 2.3 |
| `Application/Interfaces/IShippingRuleService.cs` / `IShippingRuleRepository.cs` | Create | |
| `Application/Interfaces/IUnitOfWork.cs` | Modify | add `Carts`, `Products`, `Payments`, `ShippingRules` |
| `Application/Services/CartService.cs`, `ProductService.cs`, `PaymentService.cs`, `ShippingRuleService.cs` | Create | |
| `Infrastructure/Payments/{Provider}PaymentGatewayService.cs` | Create | concrete implementation once a provider is chosen (Section 2.3) |
| `Infrastructure/Repositories/*.cs` | Create | one per interface above |
| `Infrastructure/UnitOfWork/UnitOfWork.cs` | Modify | |
| `Infrastructure/Database/AppDbContext.cs` | Modify | new columns/constraints per Section 8 |
| `API/Controllers/CartController.cs`, `ProductsController.cs`, `SellerProductsController.cs`, `PaymentsController.cs`, `ShippingRulesController.cs` | Create | |
| `API/Controllers/Admin/ProductApprovalController.cs` | Create | |

**Frontend**: `src/features/cart/` (`CartPage.tsx`, `useCart.ts`, `api/cartApi.ts`), `src/features/products/` (`ProductListPage.tsx`, `ProductDetailPage.tsx`, `SellerProductListPage.tsx`, `ProductFormPage.tsx`, `useProducts.ts`, `api/productsApi.ts`), `src/features/admin/AdminProductApprovalPage.tsx`, `src/features/checkout/PaymentPage.tsx` + `usePayment.ts` + `api/paymentsApi.ts`, `src/features/seller-dashboard/SellerShippingRulesPage.tsx` + `useShippingRules.ts` + `api/shippingRulesApi.ts`.

### 9.2 Seller Lifecycle (Section 3)

| File | Action | Reason |
|---|---|---|
| `Domain/Models/SellerProfile.cs`, `SellerDocument.cs` | Modify | `RejectionReason` |
| `Domain/Models/SellerCommission.cs` | Modify | `PayoutId` |
| `Application/DTOs/SellerOnboarding/*.cs`, `SellerDocuments/*.cs`, `SellerPayouts/*.cs` | Create | request/response DTOs per Section 3 |
| `Application/Interfaces/ISellerOnboardingService.cs`, `ISellerDocumentService.cs`, `ISellerPayoutService.cs` (+ matching repositories) | Create | |
| `Application/Interfaces/IUnitOfWork.cs` | Modify | add `SellerDocuments`, `SellerBankInfos`, `SellerPayouts` |
| `Application/Services/SellerOnboardingService.cs`, `SellerDocumentService.cs`, `SellerPayoutService.cs` | Create | |
| `Infrastructure/Repositories/*.cs` | Create | one per interface above |
| `Infrastructure/UnitOfWork/UnitOfWork.cs` | Modify | |
| `Infrastructure/Database/AppDbContext.cs` | Modify | new columns/constraints per Section 8 |
| `API/Controllers/SellerOnboardingController.cs`, `SellerDocumentsController.cs`, `SellerBankInfoController.cs`, `SellerPayoutsController.cs` | Create | |
| `API/Controllers/Admin/SellerApprovalController.cs`, `Admin/PayoutsController.cs` | Create | |

**Frontend**: `src/features/seller-onboarding/` (`SellerApplicationPage.tsx`, `SellerDocumentsPage.tsx`), `src/features/seller-dashboard/` (`SellerBankInfoPage.tsx`, `SellerPayoutsPage.tsx`), `src/features/admin/` (`AdminSellerApprovalPage.tsx`, `AdminPayoutsPage.tsx`).

### 9.3 Engagement (Section 4)

| File | Action | Reason |
|---|---|---|
| `Application/DTOs/Wishlist/*.cs`, `Reviews/*.cs`, `Loyalty/*.cs` | Create | |
| `Application/Interfaces/IWishlistService.cs`, `IReviewService.cs`, `ILoyaltyService.cs` (+ repositories) | Create | |
| `Application/Interfaces/IUnitOfWork.cs` | Modify | add `Wishlists`, `Reviews`, `SellerReviews`, `LoyaltyPoints` |
| `Application/Services/WishlistService.cs`, `ReviewService.cs`, `LoyaltyService.cs` | Create | |
| **`Application/Services/OrderService.cs`** (doc 1) | **Modify** | award points on `Delivered` transition; handle `RedeemPoints` in `PlaceOrderAsync` |
| **`Application/DTOs/Orders/CreateOrderRequestDto.cs`** (doc 1) | **Modify** | add `RedeemPoints` field |
| `Infrastructure/Repositories/*.cs` | Create | |
| `Infrastructure/UnitOfWork/UnitOfWork.cs` | Modify | |
| `API/Controllers/WishlistController.cs`, `ReviewsController.cs`, `SellerReviewsController.cs`, `LoyaltyController.cs` | Create | |

**Frontend**: `src/features/wishlist/WishlistPage.tsx`, `src/features/reviews/` (`ReviewForm.tsx`, `ReviewList.tsx` — shared components consumed by `ProductDetailPage` and the new `SellerProfilePage`), `src/features/loyalty/LoyaltyPage.tsx`. **Modify** `src/features/checkout/CheckoutPage.tsx` to add the points-redemption slider and shipping breakdown from Sections 2.4/4.3.

### 9.4 Account & Support (Section 5)

| File | Action | Reason |
|---|---|---|
| `Domain/Models/Address.cs` | Modify | `IsActive` |
| `Domain/Models/Notification.cs` | Modify | `LinkUrl` (optional) |
| `Application/DTOs/Addresses/*.cs`, `Profile/*.cs`, `Notifications/*.cs` | Create | |
| `Application/Interfaces/IAddressService.cs`, `IProfileService.cs`, `INotificationService.cs` (+ repositories) | Create | |
| `Application/Interfaces/IUnitOfWork.cs` | Modify | add `Addresses`, `Notifications` if not already present |
| `Application/Services/AddressService.cs`, `ProfileService.cs`, `NotificationService.cs` | Create | |
| `Infrastructure/Repositories/*.cs` | Create | |
| `Infrastructure/UnitOfWork/UnitOfWork.cs` | Modify | |
| `Infrastructure/Database/AppDbContext.cs` | Modify | **`Order → Address` Restrict fix** (Section 8) + new columns |
| `API/Controllers/AddressesController.cs`, `AccountController.cs`, `NotificationsController.cs` | Create | |

**Frontend**: `src/features/account/` (`AddressBookPage.tsx`, `ProfilePage.tsx`, `NotificationsPage.tsx`), `src/components/NotificationBell.tsx`.

### 9.5 Admin — Category Management (Section 6)

| File | Action | Reason |
|---|---|---|
| `Application/DTOs/Categories/*.cs` | Create | |
| `Application/Interfaces/ICategoryService.cs` / `ICategoryRepository.cs` | Create | |
| `Application/Interfaces/IUnitOfWork.cs` | Modify | add `Categories` |
| `Application/Services/CategoryService.cs` | Create | |
| `Infrastructure/Repositories/CategoryRepository.cs` | Create | |
| `Infrastructure/UnitOfWork/UnitOfWork.cs` | Modify | |
| `API/Controllers/CategoriesController.cs` | Create | public `GET`, admin-gated mutations in the same controller |

**Frontend**: `src/features/admin/AdminCategoriesPage.tsx`.

### 9.6 Frontend Only — Order/Auth/Returns (Section 7)

| File | Action | Reason |
|---|---|---|
| `API/Controllers/AuthController.cs` (doc 1) | **Modify** | add `Register` action — see 7.2, its existence was assumed, not confirmed |
| `Application/DTOs/Auth/RegisterRequestDto.cs` | Create | |

**Frontend**: `src/features/auth/` (`LoginPage.tsx`, `RegisterPage.tsx`, `AuthContext.tsx`, `useAuth.ts`, `api/authApi.ts`), `src/features/orders/` (`CheckoutPage.tsx`, `OrderHistoryPage.tsx`, `OrderDetailPage.tsx`, `useOrders.ts`, `api/ordersApi.ts`), `src/features/seller-dashboard/SellerOrdersPage.tsx`, `src/features/returns/` (`ReturnRequestForm.tsx`, `MyReturnsPage.tsx`, `SellerReturnsPage.tsx`, `useReturns.ts`, `api/returnsApi.ts`), `src/routes/` (`ProtectedRoute.tsx`, `RoleRoute.tsx`, `routes.tsx`).

---

## 10. Development Plan

**Real dependencies, not just a checklist order**: Product Catalog is the true foundation — nothing else (Cart, Wishlist, Reviews) has anything to operate on without it. Reviews and Loyalty are the most *dependent* features here — both need a completed purchase to test meaningfully, so they're naturally last among the new backend work. Frontend for doc 1's Auth/Order/Returns has **no dependency on anything in this document** and can start on day one, in parallel with everything below.

**Phase 1 — Foundation** (backend + frontend together, per feature)
Category Management → Product Catalog Management → Address Book Management → Seller Registration/Onboarding + KYC Documents (build these two together; approval literally depends on documents). *For early Product Catalog development, seed one or two `SellerProfile` rows directly in the database with `Status = Active` rather than waiting on the full onboarding flow to be usable.*

**Phase 2 — Complete the shopping loop**
Cart Management → Dynamic Shipping Costs (modifies doc 1's checkout) → Payment Gateway Integration. **Decide the payment provider now**, even if Phase 2 starts with a stub `IPaymentGatewayService` — the webhook security model and initiation flow are provider-specific enough that discovering mismatches late is expensive. *Depends on Phase 1 (needs real products/sellers to check out with).*

**Phase 3 — Post-purchase engagement**
Wishlist (fully independent, slot in anywhere) → Reviews & Ratings → Loyalty & Rewards (modifies doc 1's `OrderService` and `CreateOrderRequestDto`). *Reviews and Loyalty depend on Phase 2 producing real completed orders to test against.*

**Phase 4 — Seller finance & account polish**
Seller Bank Info & Payouts (depends on doc 1's `SellerCommission` plus the Return-window logic for the "Settled" transition) → User Profile Management (independent) → Notification Consumption (independent — creation already happens everywhere, this just adds the read side).

**Phase 5 — Frontend for doc 1 (parallel-eligible from day one)**
Auth (Login/Register/silent-refresh) can start immediately. Order/Returns frontend needs Phase 1's Address Book and Phase 2's Cart to be checkout-testable, but can be scaffolded earlier.

**Cross-cutting — Testing**
One full end-to-end journey exercises nearly everything in both documents: register → browse catalog → add to cart → checkout (coupon + dynamic shipping + points redemption) → pay → seller ships → buyer leaves a review → buyer requests a return/exchange → seller processes it → seller eventually gets paid out. Worth scripting as a single integration test once Phase 3 is done.

---

## 11. Checklist

**Phase 1 — Foundation**
- [ ] Category: CRUD service/controller, cycle-check on `ParentCategoryId`, `AdminCategoriesPage`
- [ ] Product Catalog: migrate `AverageRating`/`ReviewCount`/`IsActive`/`RejectionReason`; seller CRUD + image upload; admin approval; `ProductListPage`/`ProductDetailPage`/`SellerProductListPage`/`ProductFormPage`/`AdminProductApprovalPage`
- [ ] Address Book: migrate `IsActive`; fix `Order→Address` to `Restrict`; CRUD + soft delete; `AddressBookPage`
- [ ] Seller Onboarding: migrate `SellerProfile.RejectionReason`; apply/approve/reject/suspend + role assignment on approve; `SellerApplicationPage`/`AdminSellerApprovalPage`
- [ ] Seller KYC: migrate `SellerDocument.RejectionReason`; upload/review; `SellerDocumentsPage`

**Phase 2 — Shopping loop**
- [ ] Cart: add/update/remove/view with stock-warning surfacing; `CartPage`
- [ ] Dynamic Shipping: migrate `SubOrder.ShippingCost`; rule CRUD; modify doc 1's `PlaceOrderAsync`; `SellerShippingRulesPage`; checkout shipping breakdown
- [ ] Payment Gateway: pick provider; implement `IPaymentGatewayService`; signature-verified webhook; idempotency check; `PaymentPage`; polling on `OrderConfirmationPage`

**Phase 3 — Engagement**
- [ ] Wishlist: add/remove/view/move-to-cart; heart-icon toggle; `WishlistPage`
- [ ] Reviews: migrate unique indexes on `Review`/`SellerReview`; upsert + aggregate recompute in the same transaction; `ProductDetailPage` reviews section; `SellerProfilePage`
- [ ] Loyalty: set config rates; modify doc 1's `OrderService`/`CreateOrderRequestDto`; award-on-delivery + redeem-at-checkout + return-adjustment ledger entries; `LoyaltyPage`; checkout redemption slider

**Phase 4 — Seller finance & account**
- [ ] Seller Payouts: migrate `SellerCommission.PayoutId` + `SellerBankInfo` unique index; bank-info CRUD (admin view-only); settle job; generate/mark-transferred; `SellerBankInfoPage`/`SellerPayoutsPage`/`AdminPayoutsPage`
- [ ] User Profile: view/edit + change password; `ProfilePage`
- [ ] Notifications: list/mark-read (+ optional `LinkUrl`); `NotificationBell`/`NotificationsPage`

**Phase 5 — Doc 1 frontend**
- [ ] Confirm or add `Register` endpoint; `LoginPage`/`RegisterPage`/`AuthContext`/refresh interceptor
- [ ] `CheckoutPage`/`OrderHistoryPage`/`OrderDetailPage`/`SellerOrdersPage`
- [ ] `ReturnRequestForm`/`MyReturnsPage`/`SellerReturnsPage`

**Testing**
- [ ] Full journey integration test (register → browse → cart → checkout with coupon/shipping/points → pay → ship → review → return → payout)

---

## 12. Best Practices

On top of doc 1's Section 12, specific to what's new here:

- **Aggregate recomputation is transactional, not eventual.** `Product.AverageRating`/`ReviewCount` and `SellerProfile.Rating` are recomputed in the *same* transaction as the review write that triggered them — never a background job that could leave them briefly (or permanently, if it fails) out of sync.
- **Money-adjacent side effects stay ledger-style, never balance-mutation.** `LoyaltyPoint` is already shaped this way (append-only, balance = `SUM`) — extend the same pattern to anything else that touches money or points; don't introduce a mutable "balance" column anywhere.
- **Webhook endpoints are verified by signature, never by JWT.** Don't reflexively add `[Authorize]` to `/api/payments/webhook` — the payment provider isn't a logged-in user and has no token.
- **Admin write-access boundaries deserve the same scrutiny as buyer/seller ones.** The bank-info view-but-not-edit rule (3.3) is the clearest example — ask the same question ("should this admin capability actually be read-only?") for any new admin feature added later.
- **Soft-delete anything a financial or historical record might reference** (`Address`, `Product`) — reserve real `DELETE`s for genuinely ephemeral data (`Cart`, `Wishlist`, `Notification`), where losing the row has no downstream consequence.
