import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon 
} from '../api/adminCouponApi';
import type { CreateCouponRequest } from '../api/adminCouponApi';

export const adminCouponKeys = {
  all: ['admin-coupons'] as const,
};

export const useAdminCoupons = () => {
  return useQuery({
    queryKey: adminCouponKeys.all,
    queryFn: getAllCoupons,
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCouponRequest) => createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.all });
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateCouponRequest }) => 
      updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.all });
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.all });
    },
  });
};
