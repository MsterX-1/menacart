import { apiClient } from '../../../api/client';
import type { Address, CreateAddressRequest, UpdateAddressRequest } from '../../../types/address';

export const getMyAddresses = async (): Promise<Address[]> => {
  const response = await apiClient.get<Address[]>('/addresses');
  return response.data;
};

export const addAddress = async (data: CreateAddressRequest): Promise<Address> => {
  const response = await apiClient.post<Address>('/addresses', data);
  return response.data;
};

export const updateAddress = async (id: number, data: UpdateAddressRequest): Promise<Address> => {
  const response = await apiClient.put<Address>(`/addresses/${id}`, data);
  return response.data;
};

export const deleteAddress = async (id: number): Promise<void> => {
  await apiClient.delete(`/addresses/${id}`);
};

export const setDefaultAddress = async (id: number): Promise<Address> => {
  const response = await apiClient.patch<Address>(`/addresses/${id}/default`);
  return response.data;
};
