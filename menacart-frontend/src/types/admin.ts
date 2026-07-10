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
