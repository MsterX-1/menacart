export interface Address {
  addressId: number;
  addressType: 'Shipping' | 'Billing';
  street: string;
  city: string;
  state: string | null;
  country: string;
  zipCode: string | null;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  addressType: 'Shipping' | 'Billing';
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  addressType?: 'Shipping' | 'Billing';
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  isDefault?: boolean;
}
