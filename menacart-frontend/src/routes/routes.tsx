import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { ProductListPage } from '../features/products/ProductListPage';
import { ProductDetailPage } from '../features/products/ProductDetailPage';
import { CartPage } from '../features/cart/CartPage';
import { WishlistPage } from '../features/wishlist/WishlistPage';
import { SellerProductListPage } from '../features/products/seller/SellerProductListPage';
import { SellerProductFormPage } from '../features/products/seller/SellerProductFormPage';
import { AdminProductQueuePage } from '../features/products/admin/AdminProductQueuePage';
import { AdminCategoryListPage } from '../features/categories/admin/AdminCategoryListPage';
import { AddressListPage } from '../features/addresses/AddressListPage';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { CheckoutSuccessPage } from '../features/checkout/CheckoutSuccessPage';
import { PaymentProcessingPage } from '../features/checkout/PaymentProcessingPage';
import { PaymentCancelledPage } from '../features/checkout/PaymentCancelledPage';
import { OrderListPage } from '../features/orders/OrderListPage';
import { OrderDetailPage } from '../features/orders/OrderDetailPage';
import { SellerOrderListPage } from '../features/orders/SellerOrderListPage';
import { ReturnListPage } from '../features/returns/ReturnListPage';
import { SellerReturnListPage } from '../features/returns/SellerReturnListPage';
import { AccountLayout } from '../features/profile/AccountLayout';
import { AccountDashboardPage } from '../features/profile/AccountDashboardPage';
import { LoyaltyDashboardPage } from '../features/profile/LoyaltyDashboardPage';
import { AdminCouponsPage } from '../features/admin/AdminCouponsPage';
import { ApplySellerPage } from '../features/seller-onboarding/ApplySellerPage';
import { KYCDocumentsPage } from '../features/seller-onboarding/KYCDocumentsPage';
import { AdminSellersPage } from '../features/admin/AdminSellersPage';
import { SellerPayoutsPage } from '../features/payouts/SellerPayoutsPage';
import { AdminPayoutsPage } from '../features/payouts/AdminPayoutsPage';
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage';
import { AdminUsersPage } from '../features/admin/AdminUsersPage';
import { AdminTransactionsPage } from '../features/admin/AdminTransactionsPage';
import {
  WishlistPlaceholder,
  ForbiddenPage,
  NotFoundPage
} from '../pages/Placeholders';

import { HomePage } from '../features/home/HomePage';
import { SellersListPage } from '../features/sellers/SellersListPage';
import { SellerProfilePage } from '../features/sellers/SellerProfilePage';
import { SellerSettingsPage } from '../features/sellers/SellerSettingsPage';
import { ShippingRulesPage } from '../features/sellers/ShippingRulesPage';
import { SellerDashboardPage } from '../features/sellers/SellerDashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'products',
        element: <ProductListPage />,
      },
      {
        path: 'products/:productId',
        element: <ProductDetailPage />,
      },
      {
        path: 'sellers',
        element: <SellersListPage />,
      },
      {
        path: 'seller/:id',
        element: <SellerProfilePage />,
      },
      {
        path: 'forbidden',
        element: <ForbiddenPage />,
      },
      /* Customer Protected Routes */
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <CartPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'wishlist',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <WishlistPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <OrderListPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <OrderDetailPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'returns',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <ReturnListPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <CheckoutPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout/success/:orderId',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <CheckoutSuccessPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'payment/processing/:orderId',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <PaymentProcessingPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'sell/apply',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <ApplySellerPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'payment/cancelled',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <PaymentCancelledPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'wishlist',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Customer']}>
              <WishlistPlaceholder />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'account',
        element: (
          <ProtectedRoute>
            <AccountLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <AccountDashboardPage />,
          },
          {
            path: 'addresses',
            element: (
              <RoleRoute allowedRoles={['Customer']}>
                <AddressListPage />
              </RoleRoute>
            ),
          },
          {
            path: 'loyalty',
            element: (
              <RoleRoute allowedRoles={['Customer']}>
                <LoyaltyDashboardPage />
              </RoleRoute>
            ),
          },
        ],
      },
      /* Seller Protected Routes */
      {
        path: 'seller/dashboard',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerDashboardPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'seller/settings',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerSettingsPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'seller/shipping-rules',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <ShippingRulesPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'seller/products',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerProductListPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'seller/products/new',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerProductFormPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'seller/products/:id/edit',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerProductFormPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'seller/orders',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerOrderListPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'seller/returns',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerReturnListPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'seller/documents',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <KYCDocumentsPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'seller/payouts',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerPayoutsPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      /* Admin Protected Routes */
      {
        path: 'admin/dashboard',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <AdminDashboardPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <AdminUsersPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/products',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <AdminProductQueuePage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/sellers',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <AdminSellersPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/payouts',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <AdminPayoutsPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/transactions',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <AdminTransactionsPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/categories',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <AdminCategoryListPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/coupons',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <AdminCouponsPage />
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
    ],
  },
  /* Authentication Layout Routes */
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  /* Fallback wildcards */
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);
