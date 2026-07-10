export interface CreateReviewRequest {
  productId: number;
  rating: number;
  comment: string;
}

export interface Review {
  reviewId: number;
  userId: string;
  userName: string;
  productId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateSellerReviewRequest {
  sellerId: number;
  rating: number;
  comment: string;
}

export interface SellerReview {
  sellerReviewId: number;
  sellerId: number;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PaginatedReviews<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
