export interface ReturnResponse {
  returnId: number;
  orderItemId: number;
  productName: string;
  color: string | null;
  size: string | null;
  quantity: number;
  priceAtPurchase: number;
  type: 'Return' | 'Exchange';
  exchangeVariantSku: string | null;
  reason: string;
  refundAmount: number | null;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnRequest {
  orderItemId: number;
  type: 'Return' | 'Exchange';
  exchangeVariantId?: number | null;
  reason: string;
}

export interface UpdateReturnStatusRequest {
  status: 'Approved' | 'Rejected' | 'Completed';
  refundAmount?: number | null;
  note?: string | null;
}
