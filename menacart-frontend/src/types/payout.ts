export type PayoutStatus = 'Pending' | 'Processing' | 'Paid' | 'Failed';

export interface PayoutResponse {
  payoutId: number;
  sellerId: number;
  amount: number;
  status: PayoutStatus;
  paymentMethod: string;
  transactionRef?: string;
  payoutDate?: string;
  createdAt: string;
}

export interface RequestPayoutDto {
  paymentMethod: string;
}

export interface ReviewPayoutDto {
  status: 'Paid' | 'Failed';
  transactionRef: string;
}

export interface AvailableBalanceResponse {
  availableBalance: number;
}
