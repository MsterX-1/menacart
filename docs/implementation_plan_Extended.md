# Extended Blueprint — Full Audit Report

> [!NOTE]
> This audit compares the existing MenaCart codebase against the [Extended Blueprint](file:///e:/Projects/C%20Sharp/MenaCart/docs/MenaCart_Extended_Features_and_Frontend_Blueprint.md) across all 14 feature areas. The frontend is **out of scope** for this backend audit (no React project exists yet).

---

## ✅ Already Correct

### Domain Models — All 27 entities exist
Every entity referenced by the Extended Blueprint already exists in `Domain/Models` and has its `DbSet` registered in [AppDbContext.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/Database/AppDbContext.cs). No new tables are required.

### Enum-to-string conversions — Done
All 14 `HasConversion<string>()` calls listed in both blueprints are already present in `AppDbContext.OnModelCreating` (lines 54–67).

### Unique constraints — Mostly done
The following required constraints are already in place:
- `RefreshToken.Token`, `SellerProfile.UserId`, `ProductVariant.Sku`, `Cart.UserId`
- `CartItem(CartId, VariantId)`, `Wishlist(UserId, VariantId)`, `Coupon.Code`
- `UserCouponUsage(UserId, CouponId)`, `SubOrder(OrderId, SellerId)`, `Shipping.SubOrderId`
- `SellerCommission.OrderItemId` (unique)

### Cascade-delete protections — Mostly done
`Restrict` is configured for: `SellerReview.Customer`, `Return.ExchangeVariant`, `Order.Coupon`, `Category.ParentCategory`, `Cart.User`, `Review.User`, `Address.User`, `OrderItem.SubOrder`, `OrderItem.ProductVariant`, `Wishlist.User`, `Wishlist.ProductVariant`, `CartItem.ProductVariant`, `Order.User`.

### Shipping.DeliveredAt — Already added
The `Shipping` model already has `DateTime? DeliveredAt` (line 37) and it's used correctly in `OrderService.UpdateSubOrderStatusAsync` and `ReturnService.CreateReturnAsync`.

### Feature B — JWT Auth — Fully implemented
- `AuthService` has: `RegisterAsync`, `LoginAsync`, `RefreshTokenAsync`, `RevokeTokenAsync`, `LogoutAsync`
- `AuthController` exists with all endpoints
- Refresh token rotation and reuse detection are implemented
- Registration endpoint exists (the Extended Blueprint flagged this as "confirm it exists" — confirmed ✅)

### Feature A — Order Splitting — Fully implemented
- `OrderService`: `PlaceOrderAsync`, `GetOrderAsync`, `GetOrdersForUserAsync`, `CancelOrderAsync`, `GetSellerSubOrdersAsync`, `UpdateSubOrderStatusAsync` — all working
- `OrdersController` and `SellerOrdersController` exist with correct routes and role guards

### Feature C — Returns & Exchanges — Fully implemented
- `ReturnService`: `CreateReturnAsync`, `GetMyReturnsAsync`, `GetSellerReturnsAsync`, `UpdateReturnStatusAsync` — all working
- Full transition validation, exchange variant stock verification, restock on completion, payment status updates

### Cart Management (2.1) — Substantially implemented
- `CartService`: `GetCartAsync`, `AddItemAsync`, `UpdateItemAsync`, `RemoveItemAsync`, `ClearCartAsync`
- `CartController` with correct routes and `Customer` role guard
- Auto-creates cart on first access, handles quantity increment for existing items, validates stock

### Product Catalog (2.2) — Substantially implemented
- `ProductService`: `CreateProductAsync`, `UpdateProductAsync`, `DeleteProductAsync`, `GetMyProductsAsync`, `BrowseAsync`, `GetByIdAsync`, `ApproveProductAsync`
- `ProductsController` with public browse, seller CRUD, admin approval endpoints
- Seller status check (`Active`) on create, SKU uniqueness validation

### Address Book (5.1) — Substantially implemented
- `AddressService`: `GetMyAddressesAsync`, `AddAddressAsync`, `UpdateAddressAsync`, `DeleteAddressAsync`, `SetDefaultAsync`
- Default-clearing logic works correctly

### User Profile (5.2) — Partially implemented
- `UserService`: `UpdateUserAsync`, `ChangePasswordAsync`, `GetUserByIdAsync`, `GetAllUsersAsync`, `DeleteUserAsync`
- Change password correctly delegates to `UserManager.ChangePasswordAsync`

### Admin — Seller Management — Partially implemented
- `AdminService`: `GetAllSellersAsync`, `UpdateSellerStatusAsync`, `BanSellerEmailAsync`, `SendWarningAsync`
- Coupon CRUD: `CreateCouponAsync`, `GetAllCouponsAsync`, `DeleteCouponAsync`

---

## ⚠ Needs Improvement

### 1. `ProductService.UpdateProductAsync` resets ApprovalStatus to Pending
**Blueprint says** (Section 2.2): "Editing name/description/images or adding a new variant does **not** reset `ApprovalStatus` back to `Pending`"
**Current code** ([ProductService.cs:91](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/ProductService.cs#L91)): `product.ApprovalStatus = ApprovalStatus.Pending;` — unconditionally resets it on every update.
**Fix**: Remove the line that resets `ApprovalStatus`.

### 2. `ProductService.ApproveProductAsync` doesn't store `RejectionReason`
**Blueprint says**: On reject, store `RejectionReason` on the `Product` entity.
**Current code**: Sends the reason in a notification but doesn't persist it on the `Product` model (which also lacks the `RejectionReason` column — see Missing section).

### 3. `AddressService.DeleteAddressAsync` performs hard delete
**Blueprint says** (Section 5.1): "delete in the address book becomes `IsActive = false` (hidden from the book), never a real DELETE" — to prevent cascading deletion of orders referencing the address.
**Current code** ([AddressService.cs:91](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/AddressService.cs#L91)): `await _unitOfWork.AddressRepository.Delete(addressId);` — hard deletes.
**Fix**: Change to soft delete (`IsActive = false`) once the `IsActive` column is added.

### 4. `AddressService.AddAddressAsync` clears ALL defaults instead of per-type
**Blueprint says** (Section 5.1): "unset `IsDefault` on the caller's other addresses of the *same* `AddressType`"
**Current code** ([AddressService.cs:30](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/AddressService.cs#L30)): `ClearDefaultAsync(userId)` — clears all defaults regardless of type.
**Fix**: Scope default clearing to `AddressType`.

### 5. `CartService` doesn't check `Product.ApprovalStatus` on Add
**Blueprint says** (Section 2.1): "variant exists and its `Product.ApprovalStatus == Approved`"
**Current code**: Only checks if the variant exists and has stock — doesn't verify approval status.
**Fix**: Add approval status check in `AddItemAsync`.

### 6. `CartService.GetCartAsync` includes address loading
**Current code**: `GetCartAsync` loads all user addresses and returns them in `CartResponseDto`. The blueprint treats cart and address as separate concerns. This is not incorrect but adds coupling and unnecessary data transfer.
**Optional fix**: Consider removing address loading from cart response — the checkout page can fetch addresses separately.

### 7. `AdminService.UpdateSellerStatusAsync` doesn't assign Seller role on approval
**Blueprint says** (Section 3.1): On approve, "insert an `AspNetUserRoles` row assigning the `Seller` role to the user."
**Current code**: Updates the `SellerProfile.Status` to `Active` and notifies, but **never assigns the Identity `Seller` role**.
**Fix**: Call `_userManager.AddToRoleAsync(user, "Seller")` when approving.

### 8. `AdminService.UpdateSellerStatusAsync` doesn't set `IsVerified = true` on approval
**Blueprint says**: "Status = Active, IsVerified = true"
**Current code**: Only sets `Status`, never sets `IsVerified = true`.

### 9. `AdminService.UpdateSellerStatusAsync` doesn't store `RejectionReason`
**Blueprint says**: Store `RejectionReason` on the `SellerProfile` entity when rejecting.
**Current code**: Only sends it in a notification, doesn't persist it.

### 10. `UserController` uses non-RESTful routes
**Current routes**: `GetAllUsers`, `GetUserById/{id}`, `UpdateUser`, `ChangePassword`, `DeleteUser/{id}`
**Blueprint says** (Section 5.2): Use `/api/account/profile` (GET/PUT) and `/api/account/change-password` (POST)
**Impact**: Functional but not aligned with RESTful conventions. Can be improved later.

---

## ❌ Incorrect

### 1. `Order → Address` cascade-delete is **NOT** configured as Restrict
**Blueprint says** (Section 5.1, Section 8): "`Order → Address`: `DeleteBehavior.Restrict` — **currently defaults to Cascade** — deleting an Address referenced by an Order would silently delete the order too"
**Current `AppDbContext`**: Has `Restrict` on `Address.User` but **NOT on `Order.Address`**. EF Core's default for a required FK (`Order.AddressId`) is `Cascade`. This is a **data loss risk**.
**Fix**: Add `.OnDelete(DeleteBehavior.Restrict)` for the `Order → Address` relationship.

### 2. `ProductService.DeleteProductAsync` performs hard delete
**Blueprint says** (Section 12 Best Practices): "Soft-delete anything a financial or historical record might reference (Address, Product)"
**Current code**: Calls `_unitOfWork.ProductRepository.Delete(productId)` — hard deletes a product that may be referenced by `OrderItem` records.
**Fix**: Use `IsActive = false` (soft delete) once the column is added.

---

## ❓ Missing

### Domain Model Changes (Section 8)

| Entity | Missing Column | Why |
|---|---|---|
| `Product` | `AverageRating` (`decimal(3,2)`, default 0) | Cached review aggregate |
| `Product` | `ReviewCount` (`int`, default 0) | Cached review count |
| `Product` | `IsActive` (`bool`, default true) | Seller can hide/discontinue |
| `Product` | `RejectionReason` (`nvarchar(500)`, null) | Admin rejection feedback |
| `SubOrder` | `ShippingCost` (`decimal(10,2)`, default 0) | Dynamic shipping |
| `SellerProfile` | `RejectionReason` (`nvarchar(500)`, null) | Application rejection |
| `SellerDocument` | `RejectionReason` (`nvarchar(500)`, null) | KYC rejection |
| `SellerCommission` | `PayoutId` (`int?`, FK → `SellerPayout`) | Prevents double-paying |
| `Address` | `IsActive` (`bool`, default true) | Soft delete support |
| `Notification` | `LinkUrl` (`nvarchar(500)`, null) | Click-through navigation (optional) |

### Missing Constraints (Section 8)

| Constraint | Why |
|---|---|
| `Order → Address`: `OnDelete(Restrict)` | **Critical** — prevents cascade-deleting orders |
| Unique index `Review(UserId, ProductId)` | One review per product per buyer |
| Unique index `SellerReview(CustomerId, SellerId)` | One review per seller per buyer |
| Unique index `SellerBankInfo(SellerId)` | One bank account per seller |

### Missing appsettings.json keys

```json
{
  "Shipping": { "DefaultCost": 50 },
  "Loyalty": {
    "PointsPerCurrencyUnit": 10,
    "PointsToCurrencyRate": 10
  }
}
```

---

### Missing Feature Areas — No Service/Controller/DTOs

| # | Feature | What's Missing |
|---|---|---|
| **2.3** | Payment Gateway | `IPaymentGatewayService`, `IPaymentService`, `PaymentService`, `PaymentsController`, DTOs. Initiate/webhook/refund flow. Provider-dependent — stub with interface for now. |
| **2.4** | Dynamic Shipping | `IShippingRuleService`, `ShippingRuleService`, `ShippingRulesController`, DTOs. Seller CRUD for rules. Modify `OrderService.PlaceOrderAsync` to compute shipping costs. |
| **3.1** | Seller Onboarding | `POST /api/seller/apply` — buyer applies to become seller. No `SellerOnboardingService` or dedicated controller. `AdminService.UpdateSellerStatusAsync` needs role-assignment fix. |
| **3.2** | Seller KYC Documents | No service/controller for seller document upload or admin review. |
| **3.3** | Seller Bank Info & Payouts | No service/controller for bank info CRUD, payout generation, or mark-transferred. `SellerCommission.PayoutId` missing. |
| **4.1** | Wishlist | No service/controller. Entity and unique constraint exist but zero business logic. |
| **4.2** | Reviews & Ratings | No service/controller for product or seller reviews. No aggregate recomputation logic. |
| **4.3** | Loyalty & Rewards | No service/controller. No points-awarding on delivery. No `RedeemPoints` in checkout. `CreateOrderRequestDto` missing `RedeemPoints` field. |
| **5.3** | Notification Consumption | Notifications are *created* everywhere but no read-side exists — no list/mark-read endpoints. |
| **6.1** | Category Management | No service/controller. Entity exists. No cycle-check on `ParentCategoryId`. No clear `409` for in-use categories. |

---

## 💡 Optional Improvements

### 1. Global exception handling middleware
Both blueprints mention this as out-of-scope, but the current controllers all use repetitive try/catch blocks. A middleware that catches `KeyNotFoundException` → 404, `UnauthorizedAccessException` → 403, and `Exception` → 400 would DRY up every controller significantly.

### 2. `CartService` address loading separation
Remove address loading from `GetCartAsync` / `AddItemAsync` / `UpdateItemAsync`. The checkout page should call the address API independently.

### 3. Pagination metadata
The current paginated endpoints return `IEnumerable<T>` without total count or page metadata. A `PagedResult<T>` wrapper (`Items`, `TotalCount`, `Page`, `PageSize`) would be more useful for frontend pagination controls.

### 4. `JsonStringEnumConverter` in Program.cs
Blueprint (Doc 1, Section 6) suggests adding `JsonStringEnumConverter` to serialization options so API responses show `"Placed"` instead of `0`. Not confirmed if this is already configured.

---

## Proposed Implementation Order

Following the Extended Blueprint's development plan (Section 10):

### Phase 1 — Foundation (Schema + Critical Fixes)
1. Add missing columns to Domain models
2. Add missing constraints to `AppDbContext`
3. Fix `Order → Address` cascade-delete (**critical**)
4. Fix `AdminService` to assign Seller role + set `IsVerified` on approval
5. Fix `ProductService` to not reset `ApprovalStatus` on update
6. Fix `AddressService` to soft-delete instead of hard-delete
7. Generate & apply EF migration
8. Category Management service/controller
9. Seller Onboarding service/controller (apply + admin approve/reject)
10. Seller KYC Documents service/controller

### Phase 2 — Shopping Loop
11. Dynamic Shipping Rules service/controller + modify `PlaceOrderAsync`
12. Payment Gateway interface + stub service
13. Cart stock-warning improvements (add approval status check)

### Phase 3 — Engagement
14. Wishlist service/controller
15. Reviews & Ratings service/controller + aggregate recomputation
16. Loyalty Points service + modify `OrderService` for points award/redemption

### Phase 4 — Seller Finance & Account
17. Seller Bank Info & Payouts services/controllers
18. Notification consumption (list/mark-read) service/controller

> [!IMPORTANT]
> **This is a large implementation scope (14 feature areas).** I recommend we tackle it in phases, getting your approval before each phase begins. Do you want to proceed with **Phase 1** first?
