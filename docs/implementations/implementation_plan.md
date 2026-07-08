# MenaCart — Blueprint Compliance Audit & Implementation Plan

> Complete analysis of the existing codebase against the [Implementation Blueprint](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart_Implementation_Blueprint.md).

---

## Phase 1 — Audit Report

---

### ✅ Already Correct

These files/implementations satisfy the blueprint and should remain unchanged.

#### Domain Layer
| File | Reason |
|---|---|
| [User.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/User.cs) | Matches spec: extends `IdentityUser`, has `FirstName`, `LastName`, `CreatedAt`, `UpdatedAt`, correct navigation properties |
| [RefreshToken.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Security/RefreshToken.cs) | Exact match: `Id`, `UserId`, `Token`, `Expires`, `Created`, `Revoked`, `[NotMapped] IsActive/IsExpired`, navigation to `User` |
| [Order.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/Order.cs) | Matches spec: correct key fields, enums (`OrderStatus`, `OrderPaymentStatus`), navigation properties |
| [SubOrder.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/SubOrder.cs) | Matches spec: uses enum `SubOrderStatus` instead of string (which is correct), proper navigation |
| [OrderItem.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/OrderItem.cs) | Matches spec: no redundant `SellerId`, proper FK to `SubOrder`, `PriceAtPurchase`, `RowVersion` handled via `ProductVariant` |
| [ProductVariant.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/ProductVariant.cs) | Matches spec: `[Timestamp] RowVersion`, correct fields, navigation to `ExchangeReturns` |
| [Product.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/Product.cs) | Matches spec: `SellerId`, `ApprovalStatus` enum, correct navigation |
| [SellerProfile.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/SellerProfile.cs) | Matches spec: `SellerId`, `UserId`, `StoreName`, `Status` enum |
| [SellerCommission.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/SellerCommission.cs) | Matches spec: correct fields, `SellerCommissionStatus` enum |
| [Return.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/Return.cs) | Matches spec: `ReturnType`/`ReturnStatus` enums, `ExchangeVariantId`, `RefundAmount`, `Reason` |
| [Payment.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/Payment.cs) | Matches spec: correct fields, `PaymentStatus` enum |
| [Cart.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/Cart.cs), [CartItem.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/CartItem.cs) | Match spec |
| [Address.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/Address.cs) | Matches spec: includes `AddressType`, `IsDefault` |
| [Coupon.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/Coupon.cs), [UserCouponUsage.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/UserCouponUsage.cs) | Match spec |
| [Notification.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/Notification.cs) | Matches spec |

#### Infrastructure Layer
| File | Reason |
|---|---|
| [AppDbContext.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/Database/AppDbContext.cs) | All `DbSet`s present; unique constraints (`SubOrder(OrderId,SellerId)`, `Shipping.SubOrderId`, `RefreshToken.Token`, etc.), cascade-delete restrictions, and performance indexes are correct |
| [RefreshTokenRepository.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/Repositories/RefreshTokenRepository.cs) | CRUD + `RevokeAllUserRefreshTokensAsync` — functional and correct |
| [OrderRepository.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/Repositories/OrderRepository.cs) | `GetByIdWithDetailsAsync` and `GetByUserIdAsync` with proper includes |
| [SubOrderRepository.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/Repositories/SubOrderRepository.cs) | `GetByIdWithDetailsAsync`, `GetBySellerIdAsync` with status filter — correct |
| [CartRepository.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/Repositories/CartRepository.cs) | `GetCartWithItemsByUserIdAsync` includes full chain (CartItems → Variant → Product → SellerProfile) — correct |
| [ShippingRepository.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/Repositories/ShippingRepository.cs) | `GetBySubOrderIdAsync` — correct |
| [ReturnRepository.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/Repositories/ReturnRepository.cs) | `GetByIdWithDetailsAsync`, `GetByUserIdAsync`, `GetBySellerIdAsync` — correct include chains |
| [GenaricRepository.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/Repositories/GenaricRepository.cs) | Base CRUD — correct |
| [UnitOfWork.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/UnitOfWork/UnitOfWork.cs) | All repository properties wired — correct |

#### Application Layer
| File | Reason |
|---|---|
| [IUnitOfWork.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Interfaces/IUnitOfWork/IUnitOfWork.cs) | All required repository properties declared |
| [IOrderService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Interfaces/IServices/Iorderservice.cs) | Correct methods: `PlaceOrderAsync`, `GetOrderAsync`, `GetOrdersForUserAsync`, `CancelOrderAsync`, `GetSellerSubOrdersAsync`, `UpdateSubOrderStatusAsync` |
| [IReturnService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Interfaces/IServices/IReturnService.cs) | Correct methods: `CreateReturnAsync`, `GetMyReturnsAsync`, `GetSellerReturnsAsync`, `UpdateReturnStatusAsync` |
| All repository interfaces | Correct contracts matching their implementations |

#### Application Layer — DTOs
| File | Reason |
|---|---|
| [CreateOrderRequestDto.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/OrderDtos/CreateOrderRequestDto.cs) | Matches Section 4.1 (`AddressId`, `CouponCode`). Note: `AddressId` is `int?` (allowing default address fallback) which is actually **better** than the blueprint's strict `int` |
| [OrderConfirmationResponseDto.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/OrderDtos/OrderConfirmationResponseDto.cs) | Matches Section 4.1 with `SubOrderDto` and `OrderItemDto` correctly nested |
| [UpdateSubOrderStatusRequestDto.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/OrderDtos/UpdateSubOrderStatusRequestDto.cs) | Matches Section 4.1 |
| [CreateReturnRequestDto.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/ReturnDtos/CreateReturnRequestDto.cs) | Matches Section 4.3 with correct validation attributes |
| [ReturnResponseDto.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/ReturnDtos/ReturnResponseDto.cs) | Matches Section 4.3 — includes additional product detail fields (better than blueprint) |
| [UpdateReturnStatusRequestDto.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/ReturnDtos/UpdateReturnStatusRequestDto.cs) | Matches Section 4.3 — uses `Note` instead of `RejectionReason` (functionally equivalent) |
| [RegisterDto.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/AuthDtos/RegisterDto.cs) | Correct, with role validation |
| [AuthResult.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/AuthDtos/AuthResult.cs) | Internal DTO for service-to-controller — correct |

#### API Layer
| File | Reason |
|---|---|
| [ClaimPrincipalExtention.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/API/Extentions/ClaimPrincipalExtention.cs) | `GetUserId()` extension reading `NameIdentifier` — correct |
| [AuthExtensions.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/API/Extentions/AuthExtensions.cs) | JWT Bearer setup with proper validation parameters — correct |
| [ServiceCollectionExtensions.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/API/Extentions/ServiceCollectionExtensions.cs) | All services and repositories registered — correct |
| [SellerOrdersController.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/API/Controllers/SellerOrdersController.cs) | Correct route (`api/seller/suborders`), correct role (`Seller`), thin controller — correct |

#### Application Layer — Services (Partially)
| File | Aspect Correct |
|---|---|
| [OrderService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/Orderservice.cs) — `PlaceOrderAsync` | Core flow is correct: cart load → address validation → seller/product filtering → stock validation → coupon validation → order/suborder/orderitem creation → commission calculation → coupon usage → cart clearing → notifications |
| [OrderService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/Orderservice.cs) — `UpdateSubOrderStatusAsync` | Transition validation logic correct; shipping upsert on `Shipped` correct; `Delivered` check for existing shipping record correct |
| [OrderService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/Orderservice.cs) — `CancelOrderAsync` | Stock restock on cancel, seller notifications — correct |
| [ReturnService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/ReturnService.cs) — Transition validation | Correct allowed transitions: `Requested → Approved/Rejected`, `Approved → Completed` |
| [AuthService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/AuthService.cs) — `Register` | Correct: user creation, seller profile auto-creation, token issuance |

---

### ⚠ Needs Improvement

#### 1. **Feature B — `AuthService.LoginAsync`: Uses username instead of email**

- **Current**: `FindByNameAsync(dto.Username)` + `CheckPasswordAsync`
- **Blueprint requires**: `FindByEmailAsync` + `SignInManager.CheckPasswordSignInAsync` (respects lockout)
- **Impact**: Login by username instead of email; no lockout support
- **Fix**: Change to email-based lookup with `SignInManager`

#### 2. **Feature B — `AuthService.RefreshTokenAsync`: Missing reuse-detection**

- **Current**: Checks if token exists and `IsActive`, then rotates — but does NOT detect reuse of already-revoked tokens
- **Blueprint requires** (Section 2.2): If a presented refresh token is found but already has `Revoked != null`, revoke ALL active tokens for that user (security event)
- **Impact**: Stolen/replayed refresh tokens go undetected
- **Fix**: Add reuse-detection branch before the `!IsActive` rejection

#### 3. **Feature B — `AuthService.LogoutAsync`: Revokes all tokens instead of a specific one**

- **Current**: Takes `userId`, revokes ALL refresh tokens (nuclear logout)
- **Blueprint requires** (Section 2.2, Revoke): Takes a specific `refreshToken` string, revokes only that one token. Revoking a non-existent/already-revoked token is a no-op success (`204`)
- **Impact**: Logging out kills all sessions (every device) instead of just the current one
- **The current approach is a valid alternative** (more secure in some threat models), but it deviates from the blueprint's single-token revoke

#### 4. **Feature B — `AuthController`: `Logout` requires `[Authorize]`**

- **Current**: `[Authorize]` on `Logout` endpoint, uses `userId` from JWT claims
- **Blueprint requires** (Section 5.2): `[AllowAnonymous]` on revoke — the refresh token itself is the credential, not the access token
- **Impact**: Can't revoke after access token expires (defeats the purpose)

#### 5. **Feature B — `AuthResponseDto`: Missing `Roles` and `RefreshToken` fields**

- **Current**: Only `Token` and `TokenExpiresOn`; refresh token is sent via cookie only
- **Blueprint requires** (Section 4.2): `AccessToken`, `RefreshToken`, `AccessTokenExpiresAt`, `Roles` (list of strings) — all in the response body
- **Note**: Cookie-based refresh tokens are a **valid and arguably more secure** approach than body-based. The blueprint explicitly states "or secure device storage on mobile" suggesting flexibility. However, the `Roles` field is definitively missing.

#### 6. **Feature A — `OrderService.PlaceOrderAsync`: Not wrapped in a DB transaction**

- **Current**: Multiple `CompleteAsync()` calls scattered throughout (lines 124, 141, 158, 197) — if any step fails mid-way, earlier steps are committed
- **Blueprint requires** (Section 2.1, step 3): "Begin a database transaction" — single atomic commit; on any failure, roll back everything
- **Impact**: Partial order creation on mid-process failures (e.g., stock conflict on 3rd item after 2 suborders are committed)
- **Fix**: Wrap entire operation in `_context.Database.BeginTransactionAsync()`

#### 7. **Feature A — `OrderService.UpdateSubOrderStatusAsync`: Sets `ShippedAt` instead of `DeliveredAt` on Delivered transition**

- **Current** (line 342): `shipping.ShippedAt = DateTime.UtcNow;` when transitioning to `Delivered`
- **Blueprint requires** (Section 2.1): `shipping.DeliveredAt = DateTime.UtcNow` when transitioning to `Delivered`
- **Impact**: Bug — `ShippedAt` gets overwritten on delivery; `DeliveredAt` never set; Feature C's return window calculation breaks
- **Fix**: Set `DeliveredAt` (after adding it to `Shipping` entity)

#### 8. **Feature A — `OrdersController`: Uses role `"Customer"` instead of `"Buyer"`**

- **Current**: `[Authorize(Roles = "Customer")]`
- **Blueprint requires** (Section 5.1): `[Authorize(Roles = "Buyer")]`
- **Impact**: This depends on what roles are actually seeded. Checking the identity seeder will confirm. If the seeded role is `Customer`, then the code is consistent but diverges from the blueprint's naming.

> [!IMPORTANT]
> **Decision needed**: Which role name does the project actually use — `Customer` or `Buyer`? The blueprint says `Buyer`, but the `RegisterDto` validates `"Customer|Seller"`. This mismatch exists across multiple controllers. We should pick one and be consistent.

#### 9. **Feature C — `ReturnService.CreateReturnAsync`: Missing return window validation**

- **Current**: Checks `SubOrder.Status == Delivered` but does NOT check the return window (`Shipping.DeliveredAt + Returns:WindowDays >= now`)
- **Blueprint requires** (Section 2.3): Return window enforcement from `Shipping.DeliveredAt`
- **Impact**: Returns can be requested indefinitely after delivery
- **Fix**: Add return window check after `Shipping.DeliveredAt` is available

#### 10. **Feature C — `ReturnService.CreateReturnAsync`: Missing exchange variant same-product validation**

- **Current**: Validates that `ExchangeVariantId` exists, but does NOT verify it belongs to the **same `ProductId`** as the original variant
- **Blueprint requires** (Section 2.3): "must belong to the same `ProductId` as the original variant"
- **Impact**: Buyer could "exchange" into a completely unrelated product

#### 11. **Feature C — `ReturnService.CreateReturnAsync`: Missing exchange variant stock check**

- **Current**: Validates existence of exchange variant but not `StockQuantity > 0`
- **Blueprint requires**: `StockQuantity > 0` for exchange target
- **Fix**: Add stock availability check

#### 12. **Feature C — `ReturnService.UpdateReturnStatusAsync`: Missing stock/payment side effects**

- **Current**: Updates `Status` and `RefundAmount` on approve, but does NOT:
  - Restock original variant on `Completed` (for returns)
  - Decrement exchange variant stock on `Approved` (for exchanges)
  - Update `Payment.Status = Refunded` on completed return
  - Re-verify exchange variant stock at approval time
- **Blueprint requires** (Section 2.3): All of the above
- **Impact**: Stock never adjusts after returns/exchanges; payment status never reflects refunds

#### 13. **Feature C — `ReturnsController`: Uses role `"Customer"` instead of `"Buyer"`**

- Same role-naming issue as #8 above

#### 14. **Feature C — `ReturnsController`: Missing Admin access on review endpoint**

- **Current**: `[Authorize(Roles = "Seller")]` only
- **Blueprint requires** (Section 8): `[Authorize(Roles = "Seller,Admin")]`
- **Impact**: Admins cannot approve/reject returns

---

### ❌ Incorrect

#### 1. **`Shipping.cs`: Missing `DeliveredAt` property**

- **Blueprint** (Section 6): Explicitly requires `DeliveredAt` column for return window calculation
- **Status**: Not present in the entity
- **Fix**: Add `public DateTime? DeliveredAt { get; set; }`

#### 2. **`AppDbContext`: Missing `HasConversion<string>()` on all enum properties**

- **Blueprint** (Section 6): All enum fields must be stored as `NVARCHAR` strings, not `INT`
- **Current**: No `HasConversion<string>()` calls anywhere
- **Fix**: Add all 14 conversion calls specified in Section 6

#### 3. **`Program.cs`: Missing `JsonStringEnumConverter`**

- **Blueprint** (Section 6): API responses must serialize enums as strings (`"Placed"` not `0`)
- **Current**: Not configured
- **Fix**: Add `JsonStringEnumConverter` to JSON options

#### 4. **`appsettings.json`: Missing `Commission` and `Returns` configuration sections**

- **Blueprint** (Section 6): `Commission:DefaultRatePercent` and `Returns:WindowDays` must be in config
- **Current**: Only `JWT` and `RefreshToken` sections exist
- **Status**: `OrderService` uses `_config["Commission:DefaultRatePercent"]` with fallback `?? "10"` — works but not explicit in config
- **Fix**: Add both sections

#### 5. **`AuthService.LoginAsync`: Does not use `SignInManager`**

- **Current**: Direct `CheckPasswordAsync` — does NOT respect account lockout
- **Blueprint** (Section 2.2): "Verify password via `SignInManager.CheckPasswordSignInAsync` (respects lockout)"
- **Fix**: Inject `SignInManager<User>` and use `CheckPasswordSignInAsync`

#### 6. **`OrdersController` filename typo: `OrdersContrcoller.cs`**

- The file is named `OrdersContrcoller.cs` (misspelled "Controller")
- Not a functional bug but should be corrected

#### 7. **`AuthController`: Login/Register endpoints are not `[AllowAnonymous]`**

- **Current**: No explicit `[AllowAnonymous]` on Login/Register. The controller itself has no class-level `[Authorize]`, so they work, but it's fragile — if someone adds a class-level attribute later, they'll break
- **Blueprint** (Section 5.2): Explicit `[AllowAnonymous]` on login, refresh, revoke

#### 8. **`LoginDto`: Uses `Username` field, not `Email`**

- **Blueprint** (Section 4.2): `LoginRequestDto` has `Email` (string) and `Password` (string)
- **Current**: `Username` and `Password`
- **Fix**: Change to `Email`

---

### ❓ Missing

| # | Missing Requirement | Blueprint Section | Priority |
|---|---|---|---|
| 1 | `Shipping.DeliveredAt` property + migration | Section 6 | **High** — blocks Feature C return window |
| 2 | Enum-to-string conversions in `AppDbContext.OnModelCreating` | Section 6 | **High** — data format mismatch |
| 3 | `JsonStringEnumConverter` in `Program.cs` | Section 6 | **High** — API responses show integers |
| 4 | `Commission:DefaultRatePercent` and `Returns:WindowDays` in `appsettings.json` | Section 6 | **Medium** — OrderService has fallback but not explicit |
| 5 | Reuse-detection in `AuthService.RefreshTokenAsync` | Section 2.2 | **High** — security requirement |
| 6 | Return window validation in `ReturnService.CreateReturnAsync` | Section 2.3 | **High** — business rule |
| 7 | Exchange variant same-product validation | Section 2.3 | **High** — business rule |
| 8 | Exchange variant stock validation in create | Section 2.3 | **Medium** — business rule |
| 9 | Stock/Payment side effects in `ReturnService.UpdateReturnStatusAsync` | Section 2.3 | **High** — business rule |
| 10 | Re-verify exchange variant stock at approval time | Section 2.3 | **Medium** — race condition protection |
| 11 | DB transaction wrapping in `PlaceOrderAsync` | Section 2.1 | **High** — atomicity |
| 12 | `DeliveredAt` timestamp in `UpdateSubOrderStatusAsync` Delivered transition | Section 2.1 | **High** — bug fix + Feature C dependency |
| 13 | Unique index on `SellerCommission.OrderItemId` | Section 6 | **Low** — data integrity hardening |
| 14 | Admin role access on `ReturnsController` review endpoint and `SellerOrdersController` | Section 8 | **Medium** — permission gap |
| 15 | `Roles` field in `AuthResponseDto` | Section 4.2 | **Medium** — client needs role info |

---

### 💡 Optional Improvements

| # | Improvement | Rationale |
|---|---|---|
| 1 | Rename `OrdersContrcoller.cs` → `OrdersController.cs` | Typo fix; improves discoverability |
| 2 | Add `[AllowAnonymous]` explicitly on Login, Register, Refresh endpoints | Defense-in-depth against future class-level `[Authorize]` additions |
| 3 | Consolidate the role name (`Customer` vs `Buyer`) project-wide | Consistency; avoids confusion |
| 4 | Move JWT generation out of `AuthService` into a dedicated `ITokenService`/`TokenService` | Blueprint Section 9.2 suggests this separation; cleaner single-responsibility |
| 5 | Add status filter parameter to `GetSellerReturns` endpoint | Blueprint Section 5.3 mentions "query: status filter" |
| 6 | Consolidate the `RefreshToken` config key naming (`JWT:RefreshTokenDays` vs `RefreshToken:DurationInDays`) | Blueprint Section 6 uses `Jwt:RefreshTokenDays`; current code uses `RefreshToken:DurationInDays` — both work but consistency helps |
| 7 | Use `IConfiguration.GetValue<int>()` instead of `Convert.ToDouble` for config values | Type safety, avoids format exceptions |

---

## Phase 3 — Proposed Changes

### Execution Order: B → A → C (per blueprint recommendation)

---

### Feature B — JWT Auth Fixes

#### [MODIFY] [AuthService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/AuthService.cs)
- Change `LoginAsync` to use email-based lookup (`FindByEmailAsync`) + `SignInManager.CheckPasswordSignInAsync`
- Inject `SignInManager<User>` into constructor
- Add reuse-detection logic to `RefreshTokenAsync`: if token found but already revoked → revoke ALL user tokens → throw
- Change `LogoutAsync` to `RevokeTokenAsync(string token)` — revoke a single specific token (keep existing `LogoutAsync` as an additional method if desired)
- Add `Roles` to the return result

#### [MODIFY] [IAuthService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Interfaces/IServices/IAuthService.cs)
- Add `RevokeTokenAsync(string token)` method signature

#### [MODIFY] [LoginDto.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/AuthDtos/LoginDto.cs)
- Rename `Username` → `Email`

#### [MODIFY] [AuthResponseDto.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/AuthDtos/AuthResponseDto.cs)
- Add `Roles` (`List<string>`) property

#### [MODIFY] [AuthResult.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/DTOs/AuthDtos/AuthResult.cs)
- Add `Roles` (`List<string>`) property

#### [MODIFY] [AuthController.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/API/Controllers/AuthController.cs)
- Add `[AllowAnonymous]` on Login, Register, Refresh
- Add Revoke endpoint (`POST api/auth/revoke`) — `[AllowAnonymous]`, takes token from request body, returns `204`
- Change Logout to also accept revoke by refresh token for blueprint compliance
- Include `Roles` in `AuthResponseDto` response

---

### Feature A — Order Splitting Fixes

#### [MODIFY] [Shipping.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Domain/Models/Shipping.cs)
- Add `public DateTime? DeliveredAt { get; set; }`

#### [MODIFY] [AppDbContext.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Infrastructure/Database/AppDbContext.cs)
- Add all enum `HasConversion<string>()` calls (14 conversions per Section 6)
- Add unique index on `SellerCommission.OrderItemId`

#### [MODIFY] [OrderService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/Orderservice.cs)
- Wrap `PlaceOrderAsync` in an explicit DB transaction
- Fix `UpdateSubOrderStatusAsync` Delivered branch: set `DeliveredAt` instead of `ShippedAt`

#### [MODIFY] [OrdersController.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/API/Controllers/OrdersContrcoller.cs) (+ rename file)
- Fix role from `"Customer"` to `"Buyer"` (or keep `"Customer"` if that's the established convention — **requires your decision**)

#### [MODIFY] [Program.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/API/Program.cs)
- Add `JsonStringEnumConverter` to JSON serialization options

#### [MODIFY] [appsettings.json](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/API/appsettings.json)
- Add `Commission` and `Returns` config sections

---

### Feature C — Returns & Exchanges Fixes

#### [MODIFY] [ReturnService.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/Application/Services/ReturnService.cs)
- Add return window validation using `Shipping.DeliveredAt + Returns:WindowDays`
- Add same-product validation for exchange variant
- Add stock check for exchange variant on creation
- Add stock/payment side effects in `UpdateReturnStatusAsync`:
  - On `Approved` + `Exchange`: re-verify & decrement exchange variant stock
  - On `Completed` + `Return`: restock original variant, update `Payment.Status = Refunded`
  - On `Completed` + `Exchange`: restock original variant

#### [MODIFY] [ReturnsController.cs](file:///e:/Projects/C%20Sharp/MenaCart/MenaCart/API/Controllers/ReturnsController.cs)
- Change role to `"Buyer"` (or `"Customer"`) on buyer endpoints
- Add `Admin` to the roles on seller review endpoint: `[Authorize(Roles = "Seller,Admin")]`

---

## Open Questions

> [!IMPORTANT]
> **Role naming**: The blueprint uses `Buyer`/`Seller`/`Admin`, but the existing codebase uses `Customer`/`Seller`/`Admin` (see `RegisterDto` validation: `"^(Customer|Seller)$"`). Which should we standardize on?
> - **Option A**: Keep `Customer` (preserves existing user data in `AspNetRoles`)
> - **Option B**: Change to `Buyer` (matches blueprint; requires migration of role data)
> - **Recommendation**: Keep `Customer` to avoid breaking existing user accounts, and update the blueprint references accordingly. This is a naming-only difference with no functional impact.

> [!IMPORTANT]
> **Refresh token delivery**: The blueprint sends the refresh token in the response body. The existing implementation sends it via HttpOnly cookie (more secure against XSS). Should we:
> - **Option A**: Keep cookie-only (current, more secure)
> - **Option B**: Switch to body-only (blueprint spec)
> - **Option C**: Send in both body and cookie (maximum flexibility for web + mobile clients)
> - **Recommendation**: Option C — include in body for mobile clients while keeping the cookie for web.

> [!IMPORTANT]
> **Logout behavior**: Blueprint's revoke = single-token revoke. Current = nuclear all-token revoke. Should we:
> - **Option A**: Replace current `LogoutAsync` with single-token `RevokeTokenAsync` only
> - **Option B**: Keep both — add `RevokeTokenAsync` for blueprint compliance, keep `LogoutAsync` as an additional "revoke all" endpoint
> - **Recommendation**: Option B — maximum flexibility.

> [!WARNING]
> **File rename `OrdersContrcoller.cs` → `OrdersController.cs`**: This will show as a delete + create in Git history. Acceptable?

---

## Verification Plan

### Build Verification
```bash
dotnet build
```

### Migration
```bash
dotnet ef migrations add AddDeliveredAtAndEnumStringConversions --project Infrastructure --startup-project API
dotnet ef database update --project Infrastructure --startup-project API
```

### Manual Verification
- Auth: Login → Refresh with rotation → Present already-rotated token (expect reuse detection) → Revoke
- Orders: Multi-seller checkout → Verify stock decrement → Verify commission → Shipped with tracking → Delivered with `DeliveredAt`
- Returns: Request return on delivered item → Verify window → Approve → Complete → Verify stock restock + payment refund
