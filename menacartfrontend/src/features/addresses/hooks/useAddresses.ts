import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../api/addressApi';
import type { CreateAddressRequest, UpdateAddressRequest } from '../../../types/address';

export const addressKeys = {
  all: ['addresses'] as const,
  list: () => ['addresses', 'list'] as const,
};

export const useAddresses = () => {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: getMyAddresses,
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAddressRequest) => addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAddressRequest }) => updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
};
