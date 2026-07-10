export interface ProductVariant {
  variantId: number;
  sku: string;
  color: string | null;
  size: string | null;
  stockQuantity: number;
  price: number;
  mainImageUrl: string | null;
  variantImages: string[];
}

export interface Product {
  productId: number;
  name: string;
  description: string | null;
  basePrice: number;
  brand: string | null;
  approvalStatus: string;
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
  rejectionReason: string | null;
  mainImageUrl: string | null;
  categoryId: number;
  categoryName: string;
  sellerId: number;
  storeName: string;
  createdAt: string;
  productImages: string[];
  variants: ProductVariant[];
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  basePrice: number;
  brand?: string;
  categoryId: number;
  mainImageUrl?: string;
  productImages?: string[];
  variants: CreateVariantRequest[];
}

export interface CreateVariantRequest {
  sku: string;
  color?: string;
  size?: string;
  stockQuantity: number;
  price: number;
  mainImageUrl?: string;
  variantImages?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  basePrice?: number;
  brand?: string;
  categoryId?: number;
  mainImageUrl?: string;
  productImages?: string[];
  variants?: UpdateVariantRequest[];
}

export interface UpdateVariantRequest {
  variantId?: number;
  sku?: string;
  color?: string;
  size?: string;
  stockQuantity?: number;
  price?: number;
  mainImageUrl?: string;
  variantImages?: string[];
}

export interface ApproveProductRequest {
  status: 'Approved' | 'Rejected';
  rejectionReason?: string;
}

export interface ProductBrowseParams {
  search?: string;
  categoryId?: number;
  sellerId?: number;
  page?: number;
  pageSize?: number;
}
