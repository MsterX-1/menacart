export interface TopProduct {
  productId: number;
  name: string;
  totalSold: number;
  revenue: number;
  averageRating: number;
}

export interface SellerRevenue {
  sellerId: number;
  storeName: string;
  totalRevenue: number;
  pendingRevenue: number;
  pendingPayoutBalance: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  platformCommissionProfit: number;
  pendingSellerApplications: number;
  pendingPayouts: number;
  topProducts: TopProduct[];
  sellerRevenues: SellerRevenue[];
}

export interface AdminTransactionDto {
  orderId: number;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

export interface AdminTransactionsPagedResponseDto {
  items: AdminTransactionDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminOrderItemDto {
  productName: string;
  color?: string;
  size?: string;
  quantity: number;
  priceAtPurchase: number;
  saleAmount: number;
}

export interface AdminSubOrderDto {
  subOrderId: number;
  sellerId: number;
  storeName: string;
  status: string;
  shippingCost: number;
  subOrderTotal: number;
  carrier?: string;
  trackingNumber?: string;
  items: AdminOrderItemDto[];
}

export interface AdminTransactionDetailDto {
  orderId: number;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  platformDiscount: number;
  couponDiscount: number;
  couponCode?: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  subOrders: AdminSubOrderDto[];
}
