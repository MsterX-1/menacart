import { apiClient } from '../../../api/client';
import type { 
  CreateReviewRequest, 
  Review, 
  CreateSellerReviewRequest, 
  SellerReview
} from '../../../types/review';

export const submitProductReview = async (data: CreateReviewRequest): Promise<Review> => {
  const response = await apiClient.post<Review>('/reviews', data);
  return response.data;
};

export const getProductReviews = async (
  productId: number,
  page = 1,
  pageSize = 10
): Promise<Review[]> => {
  const response = await apiClient.get<Review[]>(`/reviews/product/${productId}`, {
    params: { page, pageSize },
  });
  return response.data;
};

export const submitSellerReview = async (data: CreateSellerReviewRequest): Promise<SellerReview> => {
  const response = await apiClient.post<SellerReview>('/reviews/seller', data);
  return response.data;
};

export const getSellerReviews = async (
  sellerId: number,
  page = 1,
  pageSize = 10
): Promise<SellerReview[]> => {
  const response = await apiClient.get<SellerReview[]>(`/reviews/seller/${sellerId}`, {
    params: { page, pageSize },
  });
  return response.data;
};
