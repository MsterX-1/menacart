import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProductReviews, 
  submitProductReview, 
  getSellerReviews, 
  submitSellerReview 
} from '../api/reviewApi';
import type { CreateReviewRequest, CreateSellerReviewRequest } from '../../../types/review';

export const reviewKeys = {
  all: ['reviews'] as const,
  products: () => ['reviews', 'product'] as const,
  product: (productId: number, page: number, pageSize: number) => 
    ['reviews', 'product', productId, { page, pageSize }] as const,
  sellers: () => ['reviews', 'seller'] as const,
  seller: (sellerId: number, page: number, pageSize: number) => 
    ['reviews', 'seller', sellerId, { page, pageSize }] as const,
};

export const useProductReviews = (productId: number, page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: reviewKeys.product(productId, page, pageSize),
    queryFn: () => getProductReviews(productId, page, pageSize),
    enabled: !!productId && !isNaN(productId),
  });
};

export const useSubmitProductReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReviewRequest) => submitProductReview(data),
    onSuccess: (_, variables) => {
      // Invalidate target product reviews cache
      queryClient.invalidateQueries({ 
        queryKey: ['reviews', 'product', variables.productId] 
      });
      // Also invalidate product queries because the rating average might change
      queryClient.invalidateQueries({
        queryKey: ['products']
      });
    },
  });
};

export const useSellerReviews = (sellerId: number, page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: reviewKeys.seller(sellerId, page, pageSize),
    queryFn: () => getSellerReviews(sellerId, page, pageSize),
    enabled: !!sellerId && !isNaN(sellerId),
  });
};

export const useSubmitSellerReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSellerReviewRequest) => submitSellerReview(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['reviews', 'seller', variables.sellerId] 
      });
    },
  });
};
