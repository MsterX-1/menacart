import { apiClient } from '../../../api/client';

export interface TopSellerProductDto {
  productId: number;
  name: string;
  totalSold: number;
  revenue: number;
  averageRating: number;
}

export interface SellerDashboardStatsDto {
  totalRevenue: number;
  totalCommissionPaid: number;
  netProfit: number;
  totalOrders: number;
  totalProducts: number;
  pendingPayoutBalance: number;
  availableBalance: number;
  pendingBalance: number;
  topProducts: TopSellerProductDto[];
}

export const getSellerDashboardStats = async (): Promise<SellerDashboardStatsDto> => {
  const response = await apiClient.get<SellerDashboardStatsDto>('/seller-dashboard/stats');
  return response.data;
};
