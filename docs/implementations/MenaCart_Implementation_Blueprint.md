# MenaCart — Implementation Blueprint
### Order Splitting & Per-Seller Shipping · JWT Authentication · Returns & Exchanges

This document is a complete, implementation-ready specification for three features, written to fit the existing MenaCart Clean Architecture:

```
📦MenaCart
┣ 📂API            → Controllers, Extensions (DI/auth wiring), HTTP endpoints only
┣ 📂Application    → DTOs, Interfaces, Services (business logic lives here)
┣ 📂Domain         → Models (entities), Security (RefreshToken, etc.), domain rules
┗ 📂Infrastructure → Database (EF Core), Repositories, UnitOfWork, Seed
```

No layer boundaries are changed. Every new file below is placed according to this existing structure.

---

## Table of Contents

0. [Assumptions & Context](#0-assumptions--context)
1. [Project Overview](#1-project-overview)
2. [Business Logic](#2-business-logic)
3. [System Flow](#3-system-flow)
4. [Data Flow](#4-data-flow)
5. [API Design](#5-api-design)
6. [Database Changes](#6-database-changes)
7. [Frontend Behavior](#7-frontend-behavior)
8. [Permissions](#8-permissions)
9. [File-by-File Implementation Plan](#9-file-by-file-implementation-plan)
10. [Development Plan](#10-development-plan)
11. [Checklist](#11-checklist)
12. [Best Practices](#12-best-practices)

---

## 0. Assumptions & Context

This blueprint is written from the schema and code already established in this project:

- **Identity**: `User` (in `Domain/Models`) extends `IdentityUser` with `FirstName`, `LastName`, `CreatedAt`, `UpdatedAt`. Its key (`Id`) is Identity's default `string` GUID, stored as `NVARCHAR(450)`. Roles (`Buyer`, `Seller`, `Admin`) are `AspNetRoles` rows assigned via `AspNetUserRoles` — there is no flat `Role` column.
- **RefreshToken** (`Domain/Security/RefreshToken.cs`) already exists exactly as shown in this conversation — `Id`, `UserId` (string), `Token`, `Expires`, `Created`, `Revoked`, `[NotMapped] IsActive/IsExpired`, navigation to `User`. **No changes needed to this file.**
- **Database**: The SQL Server schema already designed in this conversation (`SubOrders`, `OrderItems`, `Shipping`, `SellerCommission`, `Returns`, etc.) is the source of truth for table/column names below. Status/type string values used in this document (e.g. `'Placed'`, `'Requested'`, `'Exchange'`) match that schema's `CHECK` constraints exactly.
- **Naming conventions not yet established in this conversation** are proposed, not assumed to already exist: interfaces in `Application/Interfaces` as `I{Name}Service` / `I{Name}Repository`, implementations in `Application/Services` / `Infrastructure/Repositories`, DTOs grouped under `Application/DTOs/{Feature}/`. If your codebase already has a different convention for these, reconcile file placement accordingly — the business logic itself does not depend on this choice.
- **Configuration values** (JWT key/issuer/expiry, default commission rate, return window) are read directly via `IConfiguration` injected into the relevant service, rather than new settings classes/folders — this avoids adding structure not already in the project. Keys are specified in [Section 6](#6-database-changes) and [Section 9](#9-file-by-file-implementation-plan).
- **Out of scope, flagged where relevant**: shipping-cost calculation from `SellerShippingRules` into `Orders.TotalAmount`, partial-quantity returns (a `Return` covers a full `OrderItem` line), and a global exception-handling middleware are not designed here. Where a feature below depends on one of these existing, it's called out explicitly rather than silently assumed.
- One small schema addition is required and is called out explicitly in Section 6: `Shipping.DeliveredAt`, needed so the Returns feature can enforce a return window from actual delivery date rather than just a status string.
- **Updated after reviewing the real Domain/Infrastructure code**: every entity referenced by Features A and C already exists (`Order`, `SubOrder`, `OrderItem`, `Product`, `ProductVariant`, `SellerProfile`, `SellerCommission`, `Cart`, `CartItem`, `Address`, `Coupon`, `UserCouponUsage`, `Notification`, `Shipping`, `Return`, `Payment`), and `AppDbContext` already has `DbSet`s and most Fluent API configuration for all of them. Section 9's file tables have been updated to reflect this — most "Create" rows for Domain/Infrastructure are now "Already exists". Remaining work is concentrated in the Application and API layers.
- **Status/Type fields are C# enums, not raw strings** (`OrderStatus`, `SubOrderStatus`, `ShippingStatus`, `ReturnType`, `ReturnStatus`, `PaymentStatus`, `ApprovalStatus`, `SellerCommissionStatus`, `DiscountType`, `AddressType`, etc.), unlike earlier drafts of this document which used string literals matching the original `.sql` file's `CHECK` constraints. Wherever this document shows `Status == "Placed"` or similar, read it as `Status == OrderStatus.Placed` — same value, enum member instead of string. **Important**: as of the current `AppDbContext`, these enums have no `HasConversion<string>()` configured, so they'll persist as `INT` columns, not the readable `NVARCHAR`+`CHECK` columns originally designed. Section 6 includes the fix to restore that.

---

## 1. Project Overview

MenaCart is a multi-vendor clothing marketplace: buyers check out carts that can contain items from several independent sellers in one order, sellers fulfill and ship only their own items, and the platform takes a commission on each sale. This document covers three features that complete the order lifecycle and account security:

| Feature | Business problem it solves | Expected outcome |
|---|---|---|
| **A — SubOrders & per-seller shipping** | A single `Order` can't represent "3 sellers, 3 shipments, 3 fulfillment statuses." Without splitting, one seller marking their items "Shipped" would incorrectly affect the whole order. | Every checkout is split into one `SubOrder` per seller. Each seller sees, updates, and ships only their own `SubOrder`; commission is calculated per line item. |
| **B — JWT auth (login/refresh/revoke)** | The API needs stateless authentication for mobile/web clients without forcing re-login every few minutes, while still allowing a session to be explicitly killed (logout, stolen-device response). | Short-lived access tokens for API calls, long-lived rotating refresh tokens stored server-side, and an explicit revoke path. |
| **C — Returns & exchanges** | Clothing has high return/exchange rates (size, color, fit). The schema supports both, but no business rules yet govern eligibility, stock adjustment, or refund/exchange processing. | Buyers can request a return or exchange on delivered items within a window; sellers/admins approve or reject; stock and refund state update correctly on approval. |

These three are largely independent (see [Section 10](#10-development-plan) for the one real dependency: Returns needs `OrderItem`/`Shipping` from Feature A to exist first).


---

## 2. Business Logic

### 2.1 Feature A — Multi-Vendor Order Splitting & Per-Seller Shipping

**Entities involved** (`Domain/Models/*.cs` — create unless noted):

| Entity | Key fields | Notes |
|---|---|---|
| `Order` | `OrderId`, `UserId` (string), `AddressId`, `CouponId?`, `TotalAmount`, `Status`, `PaymentStatus`, `CreatedAt`, `UpdatedAt` | `Status`: `Placed`/`Confirmed`/`Cancelled`/`Completed`. `PaymentStatus`: `Pending`/`Paid`/`Failed`/`Refunded`. |
| `SubOrder` | `SubOrderId`, `OrderId`, `SellerId`, `Status`, `CreatedAt`, `UpdatedAt` | One row per seller present in the order. `Status`: `Placed`/`Processing`/`Shipped`/`Delivered`/`Cancelled`. Unique on `(OrderId, SellerId)`. |
| `OrderItem` | `OrderItemId`, `SubOrderId`, `VariantId`, `Quantity`, `PriceAtPurchase`, `CreatedAt` | No `SellerId` here — resolved via `SubOrder.SellerId`. `PriceAtPurchase` is copied from `ProductVariant.Price` at order time, never trusted from the client. |
| `ProductVariant` (subset relevant here) | `VariantId`, `ProductId`, `Sku`, `Color`, `Size`, `StockQuantity`, `Price`, `RowVersion` (concurrency token) | `RowVersion` is what makes stock decrement safe under concurrent checkouts. |
| `Product` (subset relevant here) | `ProductId`, `SellerId`, `Name` | Used only to resolve which seller owns a variant. |
| `SellerProfile` (subset relevant here) | `SellerId`, `UserId`, `StoreName`, `Status` | Canonical seller identity — same one used everywhere else in the schema. |
| `SellerCommission` | `CommissionId`, `SellerId`, `OrderItemId`, `SaleAmount`, `CommissionRate`, `CommissionAmount`, `Status`, `CreatedAt` | `Status`: `Pending`/`Settled`. One row per `OrderItem`. |
| `Cart` / `CartItem` | as already defined | Source of the order; cleared after successful placement. |
| `Address` (subset) | `AddressId`, `UserId`, `Street`, `City`, `Country`, `ZipCode` | Must belong to the requesting user. |
| `Coupon` / `UserCouponUsage` | as already defined | Optional; see validation below. |
| `Notification` | `NotificationId`, `UserId`, `Message`, `IsRead`, `CreatedAt` | Used to notify each seller of their new `SubOrder`. |
| `Shipping` | `ShipmentId`, `SubOrderId` (unique), `Carrier`, `TrackingNumber`, `Status`, `EstimatedDelivery`, `ShippedAt`, `CreatedAt`, `UpdatedAt` | Created/updated when a seller transitions their `SubOrder` to `Shipped`. |

#### Operation: Place Order

**Preconditions**
- Caller is authenticated with role `Buyer`.
- Caller's `Cart` has at least one `CartItem`.
- `AddressId` belongs to the caller.

**Validation**
- Every `CartItem.VariantId` still exists and its `Product.ApprovalStatus == "Approved"`.
- `StockQuantity >= Quantity` for every variant, checked immediately before decrement (not just at cart-add time).
- If `CouponCode` supplied: coupon exists, `ExpiryDate >= now`, `UsedCount < UsageLimit` (if `UsageLimit` set), order subtotal `>= MinOrderAmount`, and no existing `UserCouponUsage` row for `(UserId, CouponId)` (one use per user, per the schema's unique constraint).

**Main logic**
1. Load the cart with items, variants, and each variant's owning product/seller.
2. Group `CartItem`s by `Product.SellerId`.
3. Begin a database transaction.
4. Create one `Order` row (`UserId`, `AddressId`, `CouponId`, `Status = "Placed"`, `PaymentStatus = "Pending"`).
5. For each seller group: create one `SubOrder` (`OrderId`, `SellerId`, `Status = "Placed"`); for each item in that group, create an `OrderItem` (`SubOrderId`, `VariantId`, `Quantity`, `PriceAtPurchase = variant.Price`).
6. Decrement `ProductVariant.StockQuantity` per item, guarded by `RowVersion` (EF Core optimistic concurrency).
7. Compute each `OrderItem`'s commission: `SaleAmount = Quantity * PriceAtPurchase`; `CommissionRate` from `Commission:DefaultRatePercent` config (see [Section 6](#6-database-changes)); `CommissionAmount = SaleAmount * CommissionRate / 100`. Insert one `SellerCommission` row per `OrderItem`, `Status = "Pending"`.
8. If a coupon was applied: compute discount (`Percentage` → `subtotal * DiscountValue / 100`; `Fixed` → `DiscountValue`, clamped so `TotalAmount` never goes negative), set `Order.TotalAmount = subtotal - discount`, insert `UserCouponUsage`, increment `Coupons.UsedCount`. If no coupon: `Order.TotalAmount = subtotal`. *(Shipping cost from `SellerShippingRules` is not folded into `TotalAmount` here — flagged in Section 0 as a separate concern.)*
9. Delete all `CartItem`s for the cart (cart itself can stay, or be recreated on next add — either is fine, pick one and stay consistent).
10. Insert one `Notification` per affected seller ("You have a new order").
11. Commit the transaction. Return `OrderConfirmationResponseDto`.

**Edge cases**
- Same seller has multiple items in the cart → still exactly one `SubOrder` for that seller (enforced by the `(OrderId, SellerId)` unique constraint — group in memory before inserting, don't insert-then-dedupe).
- A seller's `SellerProfile.Status != "Active"` → exclude their items from checkout entirely and return which items were dropped, rather than silently completing a partial order.

**Failure cases**
- Any variant's stock insufficient at decrement time (including a concurrent-purchase race caught via `RowVersion` mismatch) → roll back the entire transaction, return `409 Conflict` listing the specific unavailable variant(s). Never partially place an order across sellers.
- Invalid/expired/already-used coupon → `400 Bad Request` with the specific reason.
- Address doesn't belong to caller → `403 Forbidden`.

**Success case**
- `Order`, one or more `SubOrder`s, `OrderItem`s, and `SellerCommission` rows committed atomically; stock decremented; cart cleared; sellers notified.

#### Operation: Update SubOrder Status (seller-side fulfillment)

**Preconditions**: caller is `Seller` role and `SubOrder.SellerId` matches the caller's own `SellerProfile.SellerId`.

**Validation**: status transitions are forward-only (`Placed → Processing → Shipped → Delivered`, or → `Cancelled` from `Placed`/`Processing`). Reject any backward or skipped transition (e.g. `Placed → Delivered` directly).

**Main logic**: update `SubOrder.Status` and `UpdatedAt`. When transitioning to `Shipped`, require `Carrier`/`TrackingNumber` in the request and upsert the `Shipping` row (`ShippedAt = now`). When transitioning to `Delivered`, set `Shipping.DeliveredAt = now` (see Section 6 for why this column is being added) and `Shipping.Status = "Delivered"`.

**Edge cases**: a `SubOrder` with no `Shipping` row yet reaching `Delivered` directly is a logic error in the client — reject with `400` rather than silently creating an incomplete `Shipping` row.

**Failure cases**: seller attempting to update a `SubOrder` that isn't theirs → `403 Forbidden` (not `404` — don't leak existence vs. ownership distinctly if that matters for your threat model; `404` is also defensible if you prefer not to confirm the SubOrder exists at all).

**Success case**: `SubOrder.Status`, and `Shipping` fields when applicable, updated; buyer notified via `Notification`.

**Reference implementation — `Domain/Models/SubOrder.cs`:**

```csharp
using Domain.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class SubOrder
    {
        [Key]
        public int SubOrderId { get; set; }

        public required int OrderId { get; set; }
        public required int SellerId { get; set; }

        public string Status { get; set; } = "Placed";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey(nameof(OrderId))]
        public virtual Order Order { get; set; }

        [ForeignKey(nameof(SellerId))]
        public virtual SellerProfile SellerProfile { get; set; }

        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

        public virtual Shipping? Shipping { get; set; }
    }
}
```

### 2.2 Feature B — JWT Authentication (Login / Refresh / Revoke)

**Entities involved**: `User` and `RefreshToken` — **both already exist exactly as built earlier in this project. No Domain changes for this feature.**

Registration is assumed to already exist elsewhere in the codebase (a user must be able to reach a "registered, has a password hash, has a role" state before Login is meaningful) — not re-specified here.

#### Operation: Login

**Preconditions**: none (anonymous endpoint).

**Validation**: `Email` is a valid email format; `Password` non-empty. Credentials checked via Identity's `UserManager`/`SignInManager` (password hash comparison, lockout check) — do not hand-roll password verification.

**Main logic**
1. Look up `User` by normalized email.
2. Verify password via `SignInManager.CheckPasswordSignInAsync` (respects lockout).
3. On success, load the user's roles.
4. Generate a JWT access token (`ITokenService.GenerateAccessToken`) with claims: `sub` (UserId), `email`, one `role` claim per assigned role. Expiry: `Jwt:AccessTokenMinutes` config value (suggested default: 15).
5. Generate a refresh token (`ITokenService.GenerateRefreshToken` — a cryptographically random string, not a JWT). Persist a `RefreshToken` row: `UserId`, `Token`, `Expires = now + Jwt:RefreshTokenDays` (suggested default: 7), `Created = now`, `Revoked = null`.
6. Return `AuthResponseDto`.

**Edge cases**: user has no roles assigned → still issue a token with zero role claims rather than failing login; downstream `[Authorize(Roles=...)]` checks will simply deny access to role-gated endpoints, which is correct behavior, not an auth failure.

**Failure cases**: wrong email or wrong password → **same generic `401` message in both cases** ("Invalid email or password") to avoid user enumeration. Account locked out (`SignInManager` lockout) → `401` with a distinct message is acceptable here since the account's existence is already implied by the lockout mechanism triggering.

**Success case**: `AuthResponseDto` with a usable access token and refresh token returned.

#### Operation: Refresh

**Preconditions**: none (anonymous endpoint — the refresh token itself is the credential).

**Validation**: token exists in `RefreshTokens`, `IsActive == true` (not revoked, not expired per the entity's existing `[NotMapped]` properties).

**Main logic (rotation)**
1. Look up the `RefreshToken` row by `Token`.
2. If not found, or `!IsActive` → reject (see failure cases; includes reuse-detection below).
3. Set the old row's `Revoked = now`.
4. Issue a new access token and a new refresh token; persist the new `RefreshToken` row for the same `UserId`.
5. Return `AuthResponseDto` with the new pair.

**Edge cases — reuse detection**: if a client presents a refresh token that is found but already has `Revoked != null` (i.e. it was already rotated once before), this indicates the token was potentially stolen and used twice. Treat this as a security event: revoke **all** active `RefreshToken` rows for that `UserId`, forcing every session to re-authenticate, and return `401`.

**Failure cases**: token not found, expired, or revoked (without triggering the reuse-detection branch above, i.e. simple expiry) → `401`, client must log in again.

**Success case**: old token revoked, new pair issued and persisted.

#### Operation: Revoke (Logout)

**Preconditions**: none required beyond possessing the refresh token (see API design note on why this is `[AllowAnonymous]`).

**Validation**: token exists and `IsActive == true`.

**Main logic**: set `Revoked = now` on the matching `RefreshToken` row.

**Edge cases**: revoking an already-revoked or nonexistent token — treat as a no-op success (`204`) rather than an error; the end state the client wants ("this token no longer works") is already true.

**Failure cases**: none that need surfacing to the client beyond the no-op case above.

**Success case**: token can no longer be used to refresh; client discards both tokens locally.

---

### 2.3 Feature C — Returns & Exchanges

**Entities involved**:

| Entity | Key fields | Notes |
|---|---|---|
| `Return` | `ReturnId`, `OrderItemId`, `Type`, `ExchangeVariantId?`, `Reason`, `RefundAmount?`, `Status`, `CreatedAt`, `UpdatedAt` | `Type`: `Return`/`Exchange`. `Status`: `Requested`/`Approved`/`Rejected`/`Completed`. |
| `Payment` (subset relevant here) | `PaymentId`, `OrderId`, `Amount`, `Currency`, `Status` | `Status` updated toward `Refunded` when a `Return` completes. |
| `Shipping` (modified — see Section 6) | adds `DeliveredAt` | Needed to compute the return window from an actual delivery timestamp. |

One entity to create: `Domain/Models/Return.cs`, `Domain/Models/Payment.cs` (if not already created as part of Feature A's payment-status work — check before creating).

#### Operation: Request Return or Exchange

**Preconditions**: caller is `Buyer` and owns the `Order` that the target `OrderItem` belongs to (via `OrderItem → SubOrder → Order → UserId`). The `SubOrder`'s `Shipping.Status == "Delivered"`.

**Validation**
- `Type` is `Return` or `Exchange`.
- `Reason` non-empty (cap length, e.g. 500 chars, matching the column).
- Within the return window: `Shipping.DeliveredAt + Returns:WindowDays (suggested default: 14) >= now`.
- No existing `Return` on the same `OrderItemId` with `Status` in (`Requested`, `Approved`) — one active request at a time; a prior `Rejected` return allows a new request.
- If `Type == "Exchange"`: `ExchangeVariantId` is required, must belong to the **same** `ProductId` as the original variant (can't "exchange" into an unrelated product), and must have `StockQuantity > 0`.

**Main logic**
1. Validate as above.
2. Insert `Return` row, `Status = "Requested"`.
3. Notify the seller (`Notification`) that a return/exchange was requested.

**Edge cases**: buyer requests a quantity-based partial return on a line with `Quantity > 1` — **not supported by this design**; a `Return` applies to the entire `OrderItem` line. Flagged in Section 0 as a known limitation.

**Failure cases**: item not yet delivered → `400` ("not eligible until delivered"). Window expired → `400` with the cutoff date. Exchange target out of stock → `409`, suggest the buyer pick a different variant or switch to a plain `Return`. Duplicate active request → `409`.

**Success case**: `Return` row created in `Requested` state, seller notified.

#### Operation: Review Return (seller/admin approves or rejects)

**Preconditions**: caller is `Seller` (and owns the `SubOrder` behind this `OrderItem`, via `SellerProfile.SellerId`) or `Admin` (no ownership check).

**Validation**: `Return.Status == "Requested"` (can't re-review an already-decided request). If approving an `Exchange`, re-check `ExchangeVariantId` stock at approval time (it may have sold out between request and review).

**Main logic — Approve, `Type == "Return"`**
1. Set `Return.Status = "Approved"`.
2. (Later, once the physical item is confirmed received — a separate "mark completed" step, not detailed further here): set `Status = "Completed"`, set `RefundAmount` (defaults to `OrderItem.PriceAtPurchase * Quantity` unless a partial refund is manually specified), update the related `Payment.Status = "Refunded"`, restock `ProductVariant.StockQuantity += Quantity`.

**Main logic — Approve, `Type == "Exchange"`**
1. Re-verify `ExchangeVariantId` stock.
2. Set `Return.Status = "Approved"`, decrement `ExchangeVariantId`'s stock immediately (reserve it), and create a new `Shipping`-style fulfillment record for the outbound replacement item. *(This blueprint treats the replacement shipment as a follow-up task using the same `Shipping` pattern from Feature A — not a new entity.)*
3. Once the original item is received back, restock the **original** variant.

**Main logic — Reject**
1. Set `Status = "Rejected"`, require a `RejectionReason` in the request, store/send it via `Notification` to the buyer.

**Edge cases**: exchange approved but target variant sells out before the physical swap ships → surface as a conflict to the seller/admin at the point they try to fulfill it, same as any other stock conflict in Feature A.

**Failure cases**: reviewing a non-`Requested` return → `409`. Non-owning seller attempting to review → `403`.

**Success case**: `Return.Status` updated; stock and `Payment.Status` updated where applicable; buyer notified either way.

---

## 3. System Flow

### 3.1 Feature A — Place Order
```
Buyer clicks "Place Order"
        ↓
OrdersController.PlaceOrder  (API)
        ↓
IOrderService.PlaceOrderAsync  (Application)
        ↓
IUnitOfWork → ICartRepository, IProductVariantRepository,
              IOrderRepository, ISubOrderRepository,
              ISellerCommissionRepository, ICouponRepository  (Infrastructure)
        ↓
SQL Server — single transaction (Order + SubOrders + OrderItems +
             SellerCommission inserts, ProductVariant stock updates)
        ↓
OrderConfirmationResponseDto → Buyer
```

### 3.1b Feature A — Update SubOrder Status
```
Seller marks "Shipped" (with carrier + tracking number)
        ↓
SellerOrdersController.UpdateStatus  (API)
        ↓
IOrderService.UpdateSubOrderStatusAsync  (Application)
        ↓
IUnitOfWork → ISubOrderRepository, IShippingRepository, INotificationRepository
        ↓
SQL Server — SubOrder.Status + Shipping upsert
        ↓
204 No Content → Seller; Notification row → Buyer
```

### 3.2 Feature B — Login / Refresh / Revoke
```
Client submits credentials
        ↓
AuthController.Login  (API, [AllowAnonymous])
        ↓
IAuthService.LoginAsync  (Application)
        ↓
UserManager/SignInManager (Identity) + ITokenService (Infrastructure)
        ↓
IUnitOfWork → IRefreshTokenRepository  (persist new RefreshToken row)
        ↓
AuthResponseDto {AccessToken, RefreshToken} → Client
```
Refresh and Revoke follow the same shape, swapping `LoginAsync` for `RefreshTokenAsync` / `RevokeTokenAsync`, both reading/writing `RefreshTokens` via the same repository.

### 3.3 Feature C — Request & Review Return
```
Buyer requests return/exchange on a delivered item
        ↓
ReturnsController.Create  (API)
        ↓
IReturnService.RequestReturnAsync  (Application)
        ↓
IUnitOfWork → IOrderItemRepository, IShippingRepository,
              IReturnRepository, INotificationRepository
        ↓
SQL Server — Return row inserted (Status = "Requested")
        ↓
ReturnResponseDto → Buyer; Notification → Seller

Seller/Admin approves or rejects
        ↓
ReturnsController.UpdateStatus  (API)
        ↓
IReturnService.ReviewReturnAsync  (Application)
        ↓
IUnitOfWork → IReturnRepository, IProductVariantRepository,
              IPaymentRepository, INotificationRepository
        ↓
SQL Server — Return.Status + stock/Payment updates as applicable
        ↓
ReturnResponseDto → Seller/Admin; Notification → Buyer
```

---

## 4. Data Flow

### 4.1 Feature A

**`CreateOrderRequestDto`** (input)
| Field | Type | Notes |
|---|---|---|
| AddressId | int | must belong to caller |
| CouponCode | string? | optional |

**`OrderConfirmationResponseDto`** (output)
| Field | Type |
|---|---|
| OrderId | int |
| TotalAmount | decimal |
| Status | string |
| PaymentStatus | string |
| SubOrders | `List<SubOrderDto>` |

**`SubOrderDto`**: `SubOrderId`, `SellerId`, `StoreName`, `Status`, `Items: List<OrderItemDto>`
**`OrderItemDto`**: `OrderItemId`, `VariantId`, `ProductName`, `Color`, `Size`, `Quantity`, `PriceAtPurchase`

**`UpdateSubOrderStatusRequestDto`** (input, seller-side)
| Field | Type | Notes |
|---|---|---|
| Status | string | `Processing`/`Shipped`/`Delivered`/`Cancelled` |
| Carrier | string? | required when `Status == "Shipped"` |
| TrackingNumber | string? | required when `Status == "Shipped"` |

**Entity transformations**: `CartItem` rows are read, never written back — they're deleted, not updated, once the order is placed. `ProductVariant.Price` (not any client-supplied price) becomes `OrderItem.PriceAtPurchase`. `ProductVariant.StockQuantity` is decremented in place.

### 4.2 Feature B

**`LoginRequestDto`**: `Email` (string), `Password` (string)
**`AuthResponseDto`**: `AccessToken` (string), `RefreshToken` (string), `AccessTokenExpiresAt` (DateTime), `Roles` (`List<string>`)
**`RefreshRequestDto`**: `RefreshToken` (string)
**`RevokeRequestDto`**: `RefreshToken` (string)

**Entity transformations**: `User` row is read-only in this flow (never mutated by login/refresh/revoke). Each successful `Login`/`Refresh` inserts one new `RefreshToken` row; `Refresh`/`Revoke` update `Revoked` on an existing row — no deletes, preserving an audit trail of session history per user.

### 4.3 Feature C

**`CreateReturnRequestDto`**: `OrderItemId` (int), `Type` (string), `ExchangeVariantId` (int?), `Reason` (string)
**`ReturnResponseDto`**: `ReturnId`, `OrderItemId`, `Type`, `Status`, `RefundAmount?`, `ExchangeVariantId?`, `CreatedAt`
**`UpdateReturnStatusRequestDto`**: `Status` (string: `Approved`/`Rejected`/`Completed`), `RefundAmount` (decimal?), `RejectionReason` (string?)

**Entity transformations**: `Return.Status` transitions drive side effects on `ProductVariant.StockQuantity` (restock or reserve) and `Payment.Status` (toward `Refunded`) as described in Section 2.3 — these are side effects of the *service* method, not separate API calls the frontend makes.

---

## 5. API Design

### 5.1 Feature A

| Method | Route | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | `/api/orders` | `Buyer` | `CreateOrderRequestDto` | `201` `OrderConfirmationResponseDto` | `400` validation/coupon, `403` address not owned, `409` stock conflict |
| GET | `/api/orders/{orderId}` | `Buyer` (own order) or `Admin` | — | `200` `OrderConfirmationResponseDto` | `403`, `404` |
| GET | `/api/orders/my` | `Buyer` | query: page/pageSize | `200` `List<OrderConfirmationResponseDto>` | — |
| GET | `/api/seller/suborders` | `Seller` | query: status filter, page/pageSize | `200` `List<SubOrderDto>` (own only) | — |
| PATCH | `/api/seller/suborders/{subOrderId}/status` | `Seller` (owner) | `UpdateSubOrderStatusRequestDto` | `204` | `400` invalid transition, `403` not owner, `404` |

**`OrdersController` (buyer-facing) — signature sketch:**
```csharp
[ApiController]
[Route("api/orders")]
[Authorize(Roles = "Buyer")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    public OrdersController(IOrderService orderService) => _orderService = orderService;

    [HttpPost]
    public async Task<IActionResult> PlaceOrder(CreateOrderRequestDto request)
    {
        var result = await _orderService.PlaceOrderAsync(User.GetUserId(), request);
        return CreatedAtAction(nameof(GetById), new { orderId = result.OrderId }, result);
    }

    [HttpGet("{orderId}")]
    public async Task<IActionResult> GetById(int orderId)
    {
        var result = await _orderService.GetOrderAsync(User.GetUserId(), orderId);
        return Ok(result);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(await _orderService.GetOrdersForUserAsync(User.GetUserId(), page, pageSize));
}
```
*(`User.GetUserId()` is a small `ClaimsPrincipal` extension method reading the `sub` claim — add it under `API/Extensions` if it doesn't already exist.)*

**`SellerOrdersController` (seller-facing):** same pattern, routed under `api/seller/suborders`, `[Authorize(Roles = "Seller")]`, resolving the caller's `SellerId` from their `SellerProfile` before every query/update so a seller can never touch another seller's `SubOrder`.

### 5.2 Feature B

| Method | Route | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | `AllowAnonymous` | `LoginRequestDto` | `200` `AuthResponseDto` | `401` invalid credentials/locked out |
| POST | `/api/auth/refresh` | `AllowAnonymous` | `RefreshRequestDto` | `200` `AuthResponseDto` | `401` invalid/expired/revoked |
| POST | `/api/auth/revoke` | `AllowAnonymous` | `RevokeRequestDto` | `204` | — (no-op success even if already revoked) |

`refresh`/`revoke` are `[AllowAnonymous]` deliberately — the whole point of a refresh token is to work when the access token has already expired, so gating them behind a valid access token would defeat the purpose. The refresh token itself, being a long random secret persisted server-side, is the credential.

```csharp
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequestDto request)
        => Ok(await _authService.LoginAsync(request));

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(RefreshRequestDto request)
        => Ok(await _authService.RefreshTokenAsync(request));

    [HttpPost("revoke")]
    [AllowAnonymous]
    public async Task<IActionResult> Revoke(RevokeRequestDto request)
    {
        await _authService.RevokeTokenAsync(request);
        return NoContent();
    }
}
```

### 5.3 Feature C

| Method | Route | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | `/api/returns` | `Buyer` | `CreateReturnRequestDto` | `201` `ReturnResponseDto` | `400` not eligible/window expired, `403` not owner, `409` exchange out of stock/duplicate |
| GET | `/api/returns/my` | `Buyer` | query: page/pageSize | `200` `List<ReturnResponseDto>` | — |
| GET | `/api/seller/returns` | `Seller` | query: status filter | `200` `List<ReturnResponseDto>` (own only) | — |
| PATCH | `/api/returns/{returnId}/status` | `Seller` (owner) or `Admin` | `UpdateReturnStatusRequestDto` | `200` `ReturnResponseDto` | `403`, `404`, `409` already decided |

Validation rules (data-annotation level, on top of the business-rule checks in Section 2.3):
- `CreateReturnRequestDto.Reason`: `[Required][StringLength(500)]`
- `CreateReturnRequestDto.Type`: `[Required][RegularExpression("^(Return|Exchange)$")]`
- `UpdateReturnStatusRequestDto.Status`: `[Required][RegularExpression("^(Approved|Rejected|Completed)$")]`

---

## 6. Database Changes

**Good news: almost everything needed already exists** in the schema built earlier in this project (`Orders`, `SubOrders`, `OrderItems`, `SellerCommission`, `Shipping`, `Returns`, `RefreshTokens`, `AspNetUsers`/`AspNetRoles`/`AspNetUserRoles`). Only one column addition is required:

```sql
ALTER TABLE Shipping ADD DeliveredAt DATETIME2 NULL;
```

**Why**: `Shipping.Status` already has a `'Delivered'` value, but there was no timestamp of *when* delivery happened — only `ShippedAt` and an `EstimatedDelivery` date. Feature C's return window ("14 days from delivery") needs an actual delivery timestamp to enforce, not an estimate or a status flag alone.

**New configuration keys** (`appsettings.json`, not schema, but listed here since Section 9 references them):
```json
{
  "Jwt": {
    "Key": "<32+ character secret, from environment/user-secrets in production>",
    "Issuer": "MenaCart",
    "Audience": "MenaCartClient",
    "AccessTokenMinutes": 15,
    "RefreshTokenDays": 7
  },
  "Commission": {
    "DefaultRatePercent": 10
  },
  "Returns": {
    "WindowDays": 14
  }
}
```
`Jwt:Key` must never be committed to source control — use `dotnet user-secrets` locally and environment variables / a secrets manager in production.

**No new tables.** For completeness, here are the existing tables each feature reads/writes (all already in the schema, no DDL changes beyond the one column above):

| Feature | Tables touched |
|---|---|
| A | `Orders`, `SubOrders`, `OrderItems`, `ProductVariants`, `Products`, `SellerProfiles`, `SellerCommission`, `Cart`, `CartItems`, `Addresses`, `Coupons`, `UserCouponUsage`, `Notifications`, `Shipping` |
| B | `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`, `RefreshTokens` |
| C | `Returns`, `OrderItems`, `ProductVariants`, `Payments`, `Shipping`, `Notifications` |

**Minor naming note (not a required change, flagging for awareness):** `Orders.PaymentStatus` uses the value `'Paid'` while `Payments.Status` uses `'Succeeded'` for the equivalent concept. This is a pre-existing difference from the original schema design, not something introduced by these three features — worth aligning in a future migration if you want the two columns to read consistently, but not blocking for this implementation.

**Second required addition — restore enum columns to readable strings.** The current `AppDbContext` has no `HasConversion<string>()` on any enum property, so `Order.Status`, `SubOrder.Status`, `Shipping.Status`, `Return.Type`/`Status`, `Payment.Status`, `Product.ApprovalStatus`, `SellerProfile.Status`, and the rest will migrate as `INT`, not the `NVARCHAR`+`CHECK` design from the original schema. Add to `OnModelCreating`:

```csharp
builder.Entity<Order>().Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
builder.Entity<Order>().Property(o => o.PaymentStatus).HasConversion<string>().HasMaxLength(20);
builder.Entity<SubOrder>().Property(so => so.Status).HasConversion<string>().HasMaxLength(20);
builder.Entity<Shipping>().Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
builder.Entity<Return>().Property(r => r.Type).HasConversion<string>().HasMaxLength(20);
builder.Entity<Return>().Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
builder.Entity<Payment>().Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
builder.Entity<Product>().Property(p => p.ApprovalStatus).HasConversion<string>().HasMaxLength(20);
builder.Entity<SellerProfile>().Property(sp => sp.Status).HasConversion<string>().HasMaxLength(20);
builder.Entity<SellerDocument>().Property(sd => sd.Status).HasConversion<string>().HasMaxLength(20);
builder.Entity<SellerPayout>().Property(sp => sp.Status).HasConversion<string>().HasMaxLength(20);
builder.Entity<SellerCommission>().Property(sc => sc.Status).HasConversion<string>().HasMaxLength(20);
builder.Entity<Coupon>().Property(c => c.DiscountType).HasConversion<string>().HasMaxLength(20);
builder.Entity<Address>().Property(a => a.AddressType).HasConversion<string>().HasMaxLength(20);
```

And in `Program.cs`, so API responses serialize these as `"Placed"` rather than `0`, matching the frontend behavior in Section 7:

```csharp
builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(o =>
    o.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
```

**Optional hardening**: add `builder.Entity<SellerCommission>().HasIndex(sc => sc.OrderItemId).IsUnique();` — nothing currently stops two commission rows per `OrderItem` at the DB level, only application logic would.

**Migration to generate:**
```
dotnet ef migrations add AddDeliveredAtAndEnumStringConversions
dotnet ef database update
```
(All other tables referenced already have migrations from the earlier schema work — this is the only new one needed, and it can fold in both the `DeliveredAt` column and the enum conversions above in one migration.)

---

## 7. Frontend Behavior

### 7.1 Feature A

**Buyer — Checkout**: Cart page → "Checkout" → select/confirm address, optionally enter a coupon code (inline validation call before final submit, so a bad code fails fast) → "Place Order" (disabled + spinner while in flight) → on success, navigate to an Order Confirmation page that groups items **by store/seller** with a status badge per group → on `409` stock conflict, show exactly which item(s) are unavailable and return the user to cart with those items flagged, rather than a generic error.

**Buyer — Order history**: "My Orders" list, each order expandable to show its per-seller sub-sections with independent status badges (`Placed`/`Processing`/`Shipped`/`Delivered`/`Cancelled`) and tracking info once shipped.

**Seller — Fulfillment dashboard**: "Orders to Fulfill" tab lists only `SubOrder`s where `SellerId` matches the logged-in seller — never another seller's data, enforced server-side (Section 8) but also simply never fetched client-side for other sellers. Each row has a status-appropriate action: `Placed → Processing` (acknowledge), `Processing → Shipped` (opens a small form requiring carrier + tracking number before submit is enabled), `→ Delivered` (marked by buyer confirmation or auto-transitioned by carrier webhook — out of scope here, treat as a manual seller action for now).

### 7.2 Feature B

**Login**: form (email, password) → inline validation (email format, required fields) → submit (disabled + spinner) → on `401`, one generic inline error ("Invalid email or password") — never distinguish "wrong email" from "wrong password" in the UI. On success, store the access token in memory (app state, not `localStorage`) and the refresh token in an `httpOnly` secure cookie if the backend sets it that way, or secure device storage on mobile.

**Silent refresh**: an API-client interceptor catches `401` responses, attempts `/api/auth/refresh` once in the background, retries the original request on success, and redirects to Login on failure (refresh itself failed) — the user should rarely see a forced logout mid-session.

**Logout**: button calls `/api/auth/revoke`, then clears all local auth state and redirects to Login regardless of the revoke call's outcome (a failed revoke shouldn't trap the user in a "logged in" UI they can no longer use).

### 7.3 Feature C

**Buyer — Request return/exchange**: on an order-detail page, a "Request Return / Exchange" button appears **only** on line items where `Shipping.Status == "Delivered"` and within the window (compute client-side from `DeliveredAt` for immediate UI feedback, but the server is the source of truth) — hidden entirely otherwise, not just disabled. Form: `Return` vs `Exchange` toggle; if `Exchange`, a size/color picker scoped to the same product's other variants with stock > 0; `Reason` textarea (required); submit → spinner → success toast + status badge "Requested" on that line item.

**Seller — Return requests**: a "Returns" tab lists pending requests for the seller's own items only. Approve / Reject actions; rejecting requires a reason (inline required field, submit disabled until filled). Approving an exchange whose target variant has since sold out should surface a clear inline warning rather than a generic failure.

**Permission-based visibility**: the "Returns" tab does not render at all for a pure-`Admin` account using the seller dashboard shell (if such a thing exists) unless that view also supports the `Admin` override path described in Section 8 — surfaced there, not just blocked by a failed API call.

---

## 8. Permissions

| Action | Buyer | Seller | Admin | Enforcement |
|---|---|---|---|---|
| Place an order | ✅ (own cart) | ❌ | ❌ | `[Authorize(Roles="Buyer")]` |
| View an order | ✅ (own only) | ❌ | ✅ (any) | controller attribute + service-level `UserId` check for Buyer |
| View/update a `SubOrder` | ❌ | ✅ (own `SellerId` only) | ✅ (any) | `[Authorize(Roles="Seller,Admin")]` + service-level `SellerId` check |
| Login / Refresh / Revoke | ✅ | ✅ | ✅ | anonymous endpoints, not role-gated — every account type uses the same auth flow |
| Request a return/exchange | ✅ (own delivered items only) | ❌ | ❌ | `[Authorize(Roles="Buyer")]` + service-level ownership check |
| Approve/reject a return | ❌ | ✅ (own items only) | ✅ (any) | `[Authorize(Roles="Seller,Admin")]` + service-level `SellerId` check |

**Backend rule that matters most here**: role attributes on controllers only prove *what kind* of account is calling — they don't prove *ownership* of the specific `SubOrder`/`Return`/`Order` being acted on. Every service method that takes a `SubOrder`/`Return` by ID must independently verify the resolved `SellerId` (from the caller's own `SellerProfile`, looked up from their `UserId` claim — never from a client-supplied `sellerId` field) matches the record before allowing the write. This is the difference between "any seller" and "this seller."

**UI visibility rule**: if a role can't perform an action, the corresponding button/tab/section is not rendered — not rendered-and-disabled. A `Buyer`-only account should never see a "Returns to review" tab at all, the same way a `Seller`-only account should never see "Request a return" on someone else's order (moot since they can't see other buyers' orders in the first place, but the principle holds generally: absence, not a greyed-out control).

---

## 9. File-by-File Implementation Plan

### 9.1 Feature A — SubOrders & Per-Seller Shipping

| File | Action | Reason |
|---|---|---|
| `Domain/Models/Order.cs` | **Already exists** | Matches spec exactly |
| `Domain/Models/SubOrder.cs` | **Already exists** | Matches spec exactly |
| `Domain/Models/OrderItem.cs` | **Already exists** | Matches spec exactly |
| `Domain/Models/Product.cs` | **Already exists** | Matches spec |
| `Domain/Models/ProductVariant.cs` | **Already exists** | Includes `RowVersion` correctly |
| `Domain/Models/SellerProfile.cs` | **Already exists** | Matches spec |
| `Domain/Models/SellerCommission.cs` | **Already exists** | No unique index on `OrderItemId` yet — see Section 6 |
| `Domain/Models/Cart.cs` / `CartItem.cs` | **Already exists** | Matches spec |
| `Domain/Models/Address.cs` | **Already exists** | Includes `AddressType` |
| `Domain/Models/Coupon.cs` / `UserCouponUsage.cs` | **Already exists** | Matches spec |
| `Domain/Models/Notification.cs` | **Already exists** | Matches spec |
| `Domain/Models/Shipping.cs` | **Modify** | Add `DeliveredAt` — still missing (Section 6) |
| `Application/DTOs/Orders/CreateOrderRequestDto.cs` | Create | Section 4.1 |
| `Application/DTOs/Orders/OrderConfirmationResponseDto.cs` | Create | Section 4.1 |
| `Application/DTOs/Orders/SubOrderDto.cs` | Create | Section 4.1 |
| `Application/DTOs/Orders/OrderItemDto.cs` | Create | Section 4.1 |
| `Application/DTOs/Orders/UpdateSubOrderStatusRequestDto.cs` | Create | Section 4.1 |
| `Application/Interfaces/IOrderService.cs` | Create | `PlaceOrderAsync`, `GetOrderAsync`, `GetOrdersForUserAsync`, `UpdateSubOrderStatusAsync` |
| `Application/Interfaces/IOrderRepository.cs` | Create | Order-level data access |
| `Application/Interfaces/ISubOrderRepository.cs` | Create | SubOrder-level data access |
| `Application/Interfaces/IUnitOfWork.cs` | Modify | Add `Orders`, `SubOrders`, `SellerCommissions`, `Shipping`, `Coupons`, `UserCouponUsages`, `Notifications` repository properties |
| `Application/Services/OrderService.cs` | Create | Business logic from Section 2.1 |
| `API/Controllers/OrdersController.cs` | Create | Buyer-facing endpoints, Section 5.1 |
| `API/Controllers/SellerOrdersController.cs` | Create | Seller-facing endpoints, Section 5.1 |
| `API/Extensions/ClaimsPrincipalExtensions.cs` | Create (if not existing) | `GetUserId()` helper used by all new controllers |
| `Infrastructure/Repositories/OrderRepository.cs` | Create | Implements `IOrderRepository` |
| `Infrastructure/Repositories/SubOrderRepository.cs` | Create | Implements `ISubOrderRepository` |
| `Infrastructure/UnitOfWork/UnitOfWork.cs` | Modify | Wire up new repository properties |
| `Infrastructure/Database/AppDbContext.cs` | **Mostly done** | `DbSet`s and the `(OrderId, SellerId)` unique constraint on `SubOrder` plus `RowVersion` on `ProductVariant` already exist. Remaining: enum `HasConversion<string>()` calls (Section 6) |

### 9.2 Feature B — JWT Authentication

| File | Action | Reason |
|---|---|---|
| `Domain/Models/User.cs` | **No change** | Already implemented |
| `Domain/Security/RefreshToken.cs` | **No change** | Already implemented |
| `Application/DTOs/Auth/LoginRequestDto.cs` | Create | Section 4.2 |
| `Application/DTOs/Auth/AuthResponseDto.cs` | Create | Section 4.2 |
| `Application/DTOs/Auth/RefreshRequestDto.cs` | Create | Section 4.2 |
| `Application/DTOs/Auth/RevokeRequestDto.cs` | Create | Section 4.2 |
| `Application/Interfaces/IAuthService.cs` | Create | `LoginAsync`, `RefreshTokenAsync`, `RevokeTokenAsync` |
| `Application/Interfaces/ITokenService.cs` | Create | `GenerateAccessToken`, `GenerateRefreshToken` |
| `Application/Interfaces/IRefreshTokenRepository.cs` | Create | Lookup/insert/update `RefreshToken` rows |
| `Application/Interfaces/IUnitOfWork.cs` | Modify | Add `RefreshTokens` repository property |
| `Application/Services/AuthService.cs` | Create | Business logic from Section 2.2 |
| `Infrastructure/Security/TokenService.cs` | Create | JWT generation — lives in Infrastructure since it depends on config + the `System.IdentityModel.Tokens.Jwt` library (an external integration), mirroring how `Domain/Security` holds the *entity*, not the token-generation mechanism |
| `Infrastructure/Repositories/RefreshTokenRepository.cs` | Create | Implements `IRefreshTokenRepository` |
| `Infrastructure/UnitOfWork/UnitOfWork.cs` | Modify | Wire up `RefreshTokens` property |
| `API/Controllers/AuthController.cs` | Create | Section 5.2 |
| `API/Extensions/AuthenticationExtensions.cs` | Create | `AddJwtBearer` scheme registration, called once from `Program.cs` |
| `Program.cs` | Modify | Call the new `AddAuthenticationExtensions()` / register `IAuthService`, `ITokenService`, `IRefreshTokenRepository` in DI |
| `appsettings.json` | Modify | Add `Jwt` section (Section 6) |

### 9.3 Feature C — Returns & Exchanges

| File | Action | Reason |
|---|---|---|
| `Domain/Models/Return.cs` | **Already exists** | Matches spec exactly |
| `Domain/Models/Payment.cs` | **Already exists** | Matches spec |
| `Domain/Models/Shipping.cs` | Modify | Add `DeliveredAt` property (Section 6) — same file as Feature A's row above |
| `Application/DTOs/Returns/CreateReturnRequestDto.cs` | Create | Section 4.3 |
| `Application/DTOs/Returns/ReturnResponseDto.cs` | Create | Section 4.3 |
| `Application/DTOs/Returns/UpdateReturnStatusRequestDto.cs` | Create | Section 4.3 |
| `Application/Interfaces/IReturnService.cs` | Create | `RequestReturnAsync`, `ReviewReturnAsync` |
| `Application/Interfaces/IReturnRepository.cs` | Create | `Return` data access |
| `Application/Interfaces/IUnitOfWork.cs` | Modify | Add `Returns` repository property |
| `Application/Services/ReturnService.cs` | Create | Business logic from Section 2.3 |
| `API/Controllers/ReturnsController.cs` | Create | Section 5.3 |
| `Infrastructure/Repositories/ReturnRepository.cs` | Create | Implements `IReturnRepository` |
| `Infrastructure/UnitOfWork/UnitOfWork.cs` | Modify | Wire up `Returns` property |
| `Infrastructure/Database/AppDbContext.cs` | **Mostly done** | `DbSet<Return>`, `DbSet<Payment>` and the `Return`/`ExchangeVariant` Restrict-delete config already exist. Remaining: `Shipping.DeliveredAt` mapping and enum `HasConversion<string>()` calls (Section 6) |
| Migration: `AddShippingDeliveredAt` | Create | `dotnet ef migrations add` (Section 6) |

---

## 10. Development Plan

The three features have one real dependency: **Feature C reads `OrderItem` and `Shipping`, both introduced by Feature A** — Returns cannot be built (or even meaningfully tested) before Order Splitting exists. Feature B (Auth) has no data dependency on the other two, but is worth building **first in practice**, because every other new endpoint is `[Authorize]`-gated and is far easier to test manually (Postman/Swagger) with a real bearer token from day one rather than temporarily disabling auth and re-enabling it later.

**Recommended order: B → A → C.**

**Phase 1 — Domain — mostly done**
Every entity listed in Section 9 already exists and matches spec, except `Shipping` needs `DeliveredAt` added. `User` and `RefreshToken` already existed before this review.

**Phase 2 — Infrastructure — mostly done**
`AppDbContext` already has `DbSet`s and most Fluent API configuration (unique constraints, Restrict-delete fixes for cascade paths) for everything in Phase 1. Remaining: the enum `HasConversion<string>()` calls and `Shipping.DeliveredAt` mapping (Section 6), one migration, and all repositories (`OrderRepository`, `SubOrderRepository`, `RefreshTokenRepository`, `ReturnRepository`, etc. — none of these exist yet), plus `UnitOfWork` wiring. *Depends on Phase 1.*

**Phase 3 — Application**
Build `AuthService` first (Feature B) — it's self-contained and unlocks realistic testing of everything else. Then `OrderService` (Feature A). Then `ReturnService` (Feature C), which is the only one that reads entities from another feature's phase-1 work (`OrderItem`, `Shipping`). *Depends on Phase 2.*

**Phase 4 — API**
`AuthController` + `AuthenticationExtensions` + `Program.cs` wiring first, so every subsequent controller can be tested with real tokens. Then `OrdersController` / `SellerOrdersController`. Then `ReturnsController`. *Depends on Phase 3.*

**Phase 5 — Testing**
- Auth: login success/failure, refresh rotation, reuse-detection (present an already-rotated token twice), revoke idempotency.
- Orders: happy-path multi-seller checkout, concurrent-purchase stock conflict (two requests decrementing the same variant), coupon edge cases (expired, already used, below minimum).
- Returns: request before delivery (rejected), request after window (rejected), exchange into out-of-stock variant (rejected), full approve→complete happy path for both `Return` and `Exchange`.

---

## 11. Checklist

**Feature B — Auth**
- [ ] Create `LoginRequestDto`, `AuthResponseDto`, `RefreshRequestDto`, `RevokeRequestDto`
- [ ] Create `IAuthService`, `ITokenService`, `IRefreshTokenRepository`
- [ ] Implement `TokenService` (access token generation with role claims, refresh token generation)
- [ ] Implement `AuthService` (login, refresh with rotation + reuse detection, revoke)
- [ ] Implement `RefreshTokenRepository`
- [ ] Add `RefreshTokens` to `IUnitOfWork` / `UnitOfWork`
- [ ] Create `AuthController`
- [ ] Add `Jwt` section to `appsettings.json` + user-secrets for `Jwt:Key` locally
- [ ] Wire `AddAuthentication().AddJwtBearer(...)` in `Program.cs`
- [ ] Register `IAuthService`/`ITokenService`/`IRefreshTokenRepository` in DI
- [ ] Test: login, refresh rotation, reuse detection, revoke idempotency

**Feature A — SubOrders & Shipping**
- [ ] Create all Domain entities listed in Section 9.1
- [ ] Add `DbSet`s + Fluent API constraints to `AppDbContext`
- [ ] Generate/apply EF migration
- [ ] Create repositories (`Order`, `SubOrder`, and any missing supporting ones)
- [ ] Update `IUnitOfWork` / `UnitOfWork`
- [ ] Create Order DTOs (Section 4.1)
- [ ] Implement `IOrderService` / `OrderService` (place order, get order(s), update sub-order status)
- [ ] Create `OrdersController` (buyer) and `SellerOrdersController` (seller)
- [ ] Add `GetUserId()` claims extension if missing
- [ ] Test: multi-seller checkout, stock-conflict rollback, coupon validation, seller-status-transition validation, cross-seller access denial

**Feature C — Returns & Exchanges**
- [ ] Add `DeliveredAt` to `Shipping` + migration
- [ ] Create `Return` and `Payment` Domain entities
- [ ] Update `AppDbContext` (`DbSet<Return>`, `DbSet<Payment>`)
- [ ] Create `ReturnRepository`, update `IUnitOfWork` / `UnitOfWork`
- [ ] Create Return DTOs (Section 4.3)
- [ ] Implement `IReturnService` / `ReturnService` (request, review)
- [ ] Create `ReturnsController`
- [ ] Test: pre-delivery rejection, window-expiry rejection, exchange-stock conflict, full return and full exchange happy paths

---

## 12. Best Practices

Applied specifically to these three features, on top of the general Clean Architecture rules already in force on this project:

- **Controllers stay thin.** `OrdersController`/`AuthController`/`ReturnsController` only translate HTTP ↔ DTOs and call one service method each — no business logic, no direct `DbContext` access.
- **Never trust client-supplied prices or amounts.** `OrderItem.PriceAtPurchase` always comes from `ProductVariant.Price` read server-side at order time, never from the request body. Same principle for `SellerCommission.SaleAmount`.
- **Commission and refund calculations happen only in `Application/Services`**, never in the controller and never client-side, since both involve money.
- **Stock mutations always go through the `RowVersion` concurrency check.** Catch `DbUpdateConcurrencyException` at the service layer and translate it into the `409 Conflict` described in Section 5, rather than letting it surface as an unhandled `500`.
- **Ownership checks are a service-layer responsibility, not just a controller attribute.** `[Authorize(Roles="Seller")]` proves *a* seller is calling; the service method proves *this* seller owns *this* `SubOrder`/`Return`.
- **Auth failure messages stay generic.** Login and refresh failures return the same shape/message regardless of *why* they failed, to avoid leaking whether an email exists or a token was merely expired vs. actively revoked.
- **DTOs only, never entities, cross the API boundary** — this project already follows this; nothing here should be the exception.
- **Repositories stay data-access-only**; anything resembling a business decision (is this transition valid? is this coupon still usable?) belongs in the service, not the repository.
