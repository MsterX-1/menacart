export interface WishlistItem {
  wishlistId: number;
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  price: number;
  stockQuantity: number;
  mainImageUrl?: string;
  addedAt: string;
}
