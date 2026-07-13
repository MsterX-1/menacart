export interface LoyaltyLedgerEntry {
  pointsId: number;
  points: number;
  reason: string;
  createdAt: string;
}

export interface Loyalty {
  balance: number;
  ledger: LoyaltyLedgerEntry[];
}
