import { apiClient } from '../../../api/client';

export interface ShippingRule {
  ruleId: number;
  city: string;
  country: string;
  shippingCost: number;
  freeShippingAbove?: number | null;
  estimatedDays: number;
}

export interface CreateShippingRuleRequest {
  city: string;
  country: string;
  shippingCost: number;
  freeShippingAbove?: number | null;
  estimatedDays: number;
}

export const getMyShippingRules = async (): Promise<ShippingRule[]> => {
  const response = await apiClient.get<ShippingRule[]>('/seller/shipping-rules');
  return response.data;
};

export const createShippingRule = async (data: CreateShippingRuleRequest): Promise<void> => {
  await apiClient.post('/seller/shipping-rules', data);
};

export const deleteShippingRule = async (ruleId: number): Promise<void> => {
  await apiClient.delete(`/seller/shipping-rules/${ruleId}`);
};
