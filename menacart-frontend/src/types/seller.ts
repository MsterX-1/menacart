export type SellerProfileStatus = 'Pending' | 'Active' | 'Suspended' | 'Rejected';
export type SellerDocumentStatus = 'Pending' | 'Approved' | 'Rejected';

export interface SellerProfile {
  sellerId: number;
  userId: string;
  storeName: string;
  storeDescription: string;
  storeLogoUrl: string;
  storeBannerUrl: string;
  storeAddress: string;
  phone: string;
  rating: number;
  isVerified: boolean;
  status: SellerProfileStatus;
  rejectionReason: string | null;
  stripeAccountId: string | null;
  commissionRate: number | null;
  baseShippingCost: number | null;
  freeShippingThreshold: number | null;
  createdAt: string;
}

export interface SellerDocument {
  sellerDocumentId: number;
  sellerId: number;
  documentType: string;
  documentUrl: string;
  status: SellerDocumentStatus;
  rejectionReason: string | null;
  createdAt: string;
}

export interface ApplySellerRequest {
  storeName: string;
  storeDescription: string;
  storeLogoUrl: string;
  storeBannerUrl: string;
  storeAddress: string;
  phone: string;
  stripeAccountId?: string | null;
  baseShippingCost?: number | null;
  freeShippingThreshold?: number | null;
}

export interface ReviewSellerDocumentRequest {
  status: 'Approved' | 'Rejected';
  rejectionReason: string | null;
}

export interface UpdateSellerStatusRequest {
  status: 'Active' | 'Suspended' | 'Rejected';
  reason: string | null;
}

export interface SellerResponse {
  sellerId: number;
  userId: string;
  storeName: string;
  email: string;
  status: SellerProfileStatus;
  isVerified: boolean;
  commissionRate: number | null;
  createdAt: string;
}

export interface PublicSellerProfile {
  sellerId: number;
  storeName: string;
  storeDescription: string;
  storeLogoUrl: string;
  storeBannerUrl: string;
  rating: number;
  isVerified: boolean;
  createdAt: string;
}

export interface PublicSellerListResponse {
  items: PublicSellerProfile[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
