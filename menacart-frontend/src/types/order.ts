export interface OrderItem {
  orderItemId: number;
  variantId: number;
  productId: number;
  productName: string;
  color: string | null;
  size: string | null;
  quantity: number;
  priceAtPurchase: number;
}

export interface SubOrder {
  subOrderId: number;
  sellerId: number;
  storeName: string;
  status: 'Placed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingCost: number;
  items: OrderItem[];
}

export interface Order {
  orderId: number;
  totalAmount: number;
  status: 'Placed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentUrl: string;
  sessionId: string;
  createdAt: string;
  subOrders: SubOrder[];
}

export interface CreateOrderRequest {
  addressId: number | null;
  couponCode: string | null;
  redeemPoints: boolean;
}

export interface UpdateSubOrderStatusRequest {
  status: 'Placed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  carrier?: string | null;
  trackingNumber?: string | null;
}
