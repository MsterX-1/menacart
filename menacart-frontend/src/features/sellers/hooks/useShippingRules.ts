import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyShippingRules, createShippingRule, deleteShippingRule } from '../api/shippingRulesApi';
import type { CreateShippingRuleRequest } from '../api/shippingRulesApi';

export const useMyShippingRules = () => {
  return useQuery({
    queryKey: ['seller-shipping-rules'],
    queryFn: getMyShippingRules,
  });
};

export const useCreateShippingRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShippingRuleRequest) => createShippingRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-shipping-rules'] });
    },
  });
};

export const useDeleteShippingRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: number) => deleteShippingRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-shipping-rules'] });
    },
  });
};
