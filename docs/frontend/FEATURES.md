# MenaCart Frontend — Feature Implementation Tracker

> **Source of truth hierarchy**: Actual Backend Code > Backend Documentation > Implementation Blueprint > Frontend Blueprint.
> This document tracks every feature that needs frontend implementation, grouped by priority and dependency order.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete |
| 🔨 | In Progress |
| ⬜ | Not Started |
| 🔒 | Blocked by another feature |

---

## Phase 0 — Foundation (Prerequisite for all features)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 0.1 | Project Scaffolding (Vite + React + TS) | ✅ | Port 3000, proxy to `https://localhost:7210` |
| 0.2 | Design System (tokens, reset, global CSS) | ✅ | OKLCH-based, light/dark, Impeccable product register |
| 0.3 | Shared UI Components (Button, Input, Skeleton, Toast, Logo) | ✅ | All states implemented |
| 0.4 | API Client + Silent Refresh Interceptor | ✅ | In-memory JWT, HTTP-only cookie rotation |
| 0.5 | AuthContext + Route Guards | ✅ | ProtectedRoute, RoleRoute, auto-restore on mount |
| 0.6 | App Shell Layouts (AuthLayout, AppLayout) | ✅ | Responsive header, role-based nav, footer |

---

## Phase 1 — Authentication ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 1.1 | Login Page | ✅ | `AuthController.Login` | `/login` |
| 1.2 | Register Page (Customer/Seller role picker) | ✅ | `AuthController.Register` | `/register` |
| 1.3 | Logout / Logout All | ✅ | `AuthController.Logout`, `LogoutAll` | via AppLayout |
| 1.4 | Session Restore (silent refresh on mount) | ✅ | `AuthController.RefreshToken` | automatic |
| 1.5 | `/api/auth/me` user profile fetch | ✅ | `AuthController.Me` | automatic |

---

## Phase 2 — Product Catalog ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 2.1 | Product List Page (public browse) | ✅ | `ProductsController.Browse` (GET `/api/products`) | `/products` |
| 2.2 | Product Detail Page (public) | ✅ | `ProductsController.GetById` (GET `/api/products/{id}`) | `/products/:id` |
| 2.3 | Seller Product List (my products) | ✅ | `ProductsController.GetMy` (GET `/api/products/my`) | `/seller/products` |
| 2.4 | Create Product Form (Seller) | ✅ | `ProductsController.Create` (POST `/api/products`) | `/seller/products/new` |
| 2.5 | Edit Product Form (Seller) | ✅ | `ProductsController.Update` (PUT `/api/products/{id}`) | `/seller/products/:id/edit` |
| 2.6 | Delete Product (Seller) | ✅ | `ProductsController.Delete` (DELETE `/api/products/{id}`) | via product list |
| 2.7 | Admin Product Approval Queue | ✅ | `ProductsController.Approve` (PATCH `/api/products/{id}/approve`) | `/admin/products` |

### Backend endpoints (verified from controller):
```
GET    /api/products                      — Public browse (search, categoryId, sellerId, page, pageSize)
GET    /api/products/{productId}          — Public product detail
GET    /api/products/my                   — Seller's own products
POST   /api/products                      — Seller create product
PUT    /api/products/{productId}          — Seller update product
DELETE /api/products/{productId}          — Seller delete product
PATCH  /api/products/{productId}/approve  — Admin approve/reject
```

---

## Phase 3 — Categories ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 3.1 | Category List (public, for product filters) | ✅ | `CategoriesController` (GET `/api/categories`) | used in product browse |
| 3.2 | Category Detail | ✅ | GET `/api/categories/{id}` | used in product browse |
| 3.3 | Admin Category CRUD | ✅ | POST/PUT/DELETE `/api/categories/admin` | `/admin/categories` |

### Backend endpoints:
```
GET    /api/categories              — List all
GET    /api/categories/{id}         — Get by ID
POST   /api/categories/admin        — Admin create
PUT    /api/categories/admin/{id}   — Admin update
DELETE /api/categories/admin/{id}   — Admin delete
```

---

## Phase 4 — Cart ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 4.1 | View Cart | ✅ | `CartController` (GET `/api/cart`) | `/cart` |
| 4.2 | Add Item to Cart | ✅ | POST `/api/cart/items` | product detail page |
| 4.3 | Update Cart Item Quantity | ✅ | PUT `/api/cart/items/{id}` | `/cart` |
| 4.4 | Remove Cart Item | ✅ | DELETE `/api/cart/items/{id}` | `/cart` |

### Backend endpoints:
```
GET    /api/cart                — View cart with stock warnings
POST   /api/cart/items          — Add item (VariantId, Quantity)
PUT    /api/cart/items/{id}     — Update quantity
DELETE /api/cart/items/{id}     — Remove item
```

---

## Phase 5 — Orders & Checkout ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 5.1 | Checkout Page (address, coupon, payment) | ✅ | `OrdersController.PlaceOrder` (POST `/api/orders`) | `/checkout` |
| 5.2 | Order History (buyer) | ✅ | GET `/api/orders/myOrders` | `/orders` |
| 5.3 | Order Detail (buyer) | ✅ | GET `/api/orders/{orderId}` | `/orders/:id` |
| 5.4 | Cancel Order | ✅ | DELETE `/api/orders/Cancel{orderId}` | `/orders/:id` |
| 5.5 | Seller Sub-Orders List | ✅ | `SellerOrdersController` (GET `/api/seller-orders`) | `/seller/orders` |
| 5.6 | Seller Update Sub-Order Status | ✅ | PATCH `/api/seller-orders/{subOrderId}/status` | `/seller/orders` |

### Backend endpoints:
```
POST   /api/orders                              — Place order (from cart)
GET    /api/orders/{orderId}                     — Get order detail
GET    /api/orders/myOrders                      — Buyer order history
DELETE /api/orders/Cancel{orderId}               — Cancel order
GET    /api/seller-orders                        — Seller's sub-orders
PATCH  /api/seller-orders/{subOrderId}/status    — Update sub-order status
```

---

## Phase 6 — Returns ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 6.1 | Request Return (buyer) | ✅ | POST `/api/returns` | `/orders/:id` |
| 6.2 | My Returns List (buyer) | ✅ | GET `/api/returns/my` | `/returns` |
| 6.3 | Seller Returns Queue | ✅ | GET `/api/seller/returns` | `/seller/returns` |
| 6.4 | Seller Approve/Reject Return | ✅ | PATCH `/api/seller/returns/{returnId}/status` | `/seller/returns` |

### Backend endpoints:
```
POST   /api/returns                              — Buyer request return
GET    /api/returns/my                            — Buyer's returns
GET    /api/seller/returns                        — Seller's return requests
PATCH  /api/seller/returns/{returnId}/status      — Seller review return
```

---

## Phase 7 — Reviews & Ratings ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 7.1 | Submit Product Review | ✅ | POST `/api/reviews` | `/products/:id` |
| 7.2 | View Product Reviews | ✅ | GET `/api/reviews/product/{productId}` | `/products/:id` |
| 7.3 | Submit Seller Review | ✅ | POST `/api/reviews/seller` | `/sellers/:id` |
| 7.4 | View Seller Reviews | ✅ | GET `/api/reviews/seller/{sellerId}` | `/sellers/:id` |

### Backend endpoints:
```
POST   /api/reviews                      — Submit product review
GET    /api/reviews/product/{productId}  — Get product reviews
POST   /api/reviews/seller               — Submit seller review
GET    /api/reviews/seller/{sellerId}    — Get seller reviews
```

---

## Phase 8 — Seller Onboarding & KYC ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 8.1 | Seller Application Form | ✅ | POST `/api/seller-onboarding/apply` | `/sell/apply` |
| 8.2 | Seller Profile View/Edit | ✅ | GET/PUT `/api/seller-onboarding/profile` | `/seller/dashboard` |
| 8.3 | Upload KYC Documents | ✅ | POST `/api/seller-documents` | `/seller/documents` |
| 8.4 | View My Documents | ✅ | GET `/api/seller-documents` | `/seller/documents` |
| 8.5 | Admin View Seller Documents | ✅ | GET `/api/seller-documents/admin/{sellerId}` | `/admin/sellers` |
| 8.6 | Admin Review Document | ✅ | PATCH `/api/seller-documents/admin/{documentId}/review` | `/admin/sellers` |
| 8.7 | Admin Seller Approval Page | ✅ | GET `/api/seller-onboarding/profile/{sellerId}` | `/admin/sellers` |

### Backend endpoints:
```
POST   /api/seller-onboarding/apply                        — Apply as seller
GET    /api/seller-onboarding/profile                      — Own profile
PUT    /api/seller-onboarding/profile                      — Update profile
GET    /api/seller-onboarding/profile/{sellerId}           — Admin view seller
POST   /api/seller-documents                               — Upload document
GET    /api/seller-documents                               — Own documents
GET    /api/seller-documents/admin/{sellerId}              — Admin view docs
PATCH  /api/seller-documents/admin/{documentId}/review     — Admin review doc
```

---

## Phase 9 — Payouts ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 9.1 | Seller Request Payout | ✅ | POST `/api/payouts/seller` | `/seller/payouts` |
| 9.2 | Seller View Payouts | ✅ | GET `/api/payouts/seller` | `/seller/payouts` |
| 9.3 | Admin View All Payouts | ✅ | GET `/api/payouts/admin` | `/admin/payouts` |
| 9.4 | Admin Review Payout | ✅ | PATCH `/api/payouts/admin/{payoutId}/review` | `/admin/payouts` |

### Backend endpoints:
```
POST   /api/payouts/seller                       — Request payout
GET    /api/payouts/seller                        — Seller's payouts
GET    /api/payouts/admin                         — Admin all payouts
PATCH  /api/payouts/admin/{payoutId}/review       — Admin review payout
```

---

## Phase 10 — Addresses ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 10.1 | Address Book CRUD | ✅ | `AddressesController` | `/account/addresses` |
| 10.2 | Address Selector in Checkout | ✅ | (consumed by checkout page) | `/checkout` |

### Backend endpoints:
```
GET    /api/addresses            — List user's addresses
POST   /api/addresses            — Add address
PUT    /api/addresses/{id}       — Update address
DELETE /api/addresses/{id}       — Delete address
```

---

## Phase 11 — Coupons ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 11.1 | Validate Coupon at Checkout | ✅ | GET `/api/coupons/{code}` | `/checkout` |
| 11.2 | Admin Coupon CRUD | ✅ | POST/PUT/DELETE `/api/admin/coupons` | `/admin/coupons` |
| 11.3 | Admin List Coupons | ✅ | GET `/api/admin/coupons` | `/admin/coupons` |

### Backend endpoints:
```
GET    /api/coupons/{code}       — Validate coupon by code
POST   /api/admin/coupons        — Admin create coupon
PUT    /api/admin/coupons/{id}   — Admin update coupon
DELETE /api/admin/coupons/{id}   — Admin delete coupon
GET    /api/admin/coupons        — Admin list all coupons
```

---

## Phase 12 — Loyalty Points ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 12.1 | View Loyalty Balance | ✅ | GET `/api/loyalty` | `/account/loyalty` |
| 12.2 | Redeem Points at Checkout | ✅ | (consumed by checkout) | `/checkout` |

### Backend endpoints:
```
GET    /api/loyalty              — Get user's loyalty point balance
```

---

## Phase 13 — User Profile ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 13.1 | View Profile | ✅ | GET `/api/user/GetUserById/{id}` | `/account` |
| 13.2 | Update Profile | ✅ | PUT `/api/user/UpdateUser` | `/account` |
| 13.3 | Change Password | ✅ | PUT `/api/user/ChangePassword` | `/account` |
| 13.4 | Delete Account | ✅ | DELETE `/api/user/DeleteUser/{id}` | `/account` |

### Backend endpoints:
```
GET    /api/user/GetAllUsers         — Admin list all users
GET    /api/user/GetUserById/{id}    — Get user by ID
PUT    /api/user/UpdateUser          — Update profile
PUT    /api/user/ChangePassword      — Change password
DELETE /api/user/DeleteUser/{id}     — Delete account
```

---

## Phase 14 — Admin Dashboard ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 14.1 | Admin Overview Dashboard | ✅ | `AdminController` | `/admin/dashboard` |
| 14.2 | Admin User Management | ✅ | `AdminController` + `UserController` | `/admin/users` |

### Backend endpoints (AdminController):
```
(Review AdminController.cs for exact endpoints)
```

---

## Phase 15 — Wishlist ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 15.1 | View Wishlist | ✅ | `WishlistsController` | `/wishlist` |
| 15.2 | Add/Remove Wishlist Items | ✅ | `WishlistsController` | `/products/:id` + `/wishlist` |

> **Note**: Wishlist controller, repository, and service implemented in Phase 15 sprint.

---

## Phase 16 — Notifications ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 16.1 | Notifications List | ✅ | `NotificationsController` | `/notifications` (dropdown overlay) |
| 16.2 | Mark as Read | ✅ | `NotificationsController` | `/notifications` (dropdown overlay) |

> **Note**: Notification controller, repository, and service implemented in Phase 16 sprint.

---

## Phase 17 — Webhooks / Payment Gateway ✅

| # | Feature | Status | Backend Controller | Key Routes |
|---|---------|--------|--------------------|------------|
| 17.1 | Payment Confirmation Webhook | ✅ | `WebhookController` (POST) | backend-only |
| 17.2 | Payment Status UI in Checkout | ✅ | (consumed by checkout) | `/checkout` |

---

## Implementation Priority Order

The recommended build order follows dependency chains:

1. ~~**Auth** (Phase 1)~~ ✅ — Foundation for everything
2. **Product Catalog** (Phase 2) + **Categories** (Phase 3) — Core browsing experience
3. **Cart** (Phase 4) — Requires products to exist
4. **Addresses** (Phase 10) — Needed before checkout
5. **Orders & Checkout** (Phase 5) + **Coupons** (Phase 11) + **Loyalty** (Phase 12) — The purchase flow
6. **Returns** (Phase 6) — Post-purchase
7. **Reviews** (Phase 7) — Post-purchase engagement
8. **User Profile** (Phase 13) — Account management
9. **Seller Onboarding & KYC** (Phase 8) — Seller lifecycle
10. **Payouts** (Phase 9) — Seller earnings
11. **Admin Dashboard** (Phase 14) — Platform management
12. **Wishlist** (Phase 15) — Engagement feature
13. **Notifications** (Phase 16) — Cross-cutting
14. **Webhooks/Payment** (Phase 17) — Backend integration
