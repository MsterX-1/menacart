import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { browseProducts, getProductById, getMyProducts, createProduct, updateProduct, deleteProduct, approveProduct, getPendingProducts } from '../api/productsApi';
import type { ProductBrowseParams, CreateProductRequest, UpdateProductRequest, ApproveProductRequest } from '../../../types/product';

export const productKeys = {
  all: ['products'] as const,
  browse: (params: ProductBrowseParams) => ['products', 'browse', params] as const,
  detail: (id: number) => ['products', 'detail', id] as const,
  my: (page: number, pageSize: number) => ['products', 'my', page, pageSize] as const,
  pending: (page: number, pageSize: number) => ['products', 'pending', page, pageSize] as const,
};

export const useBrowseProducts = (params: ProductBrowseParams = {}) => {
  return useQuery({
    queryKey: productKeys.browse(params),
    queryFn: () => browseProducts(params),
  });
};

export const useProductDetail = (productId: number) => {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => getProductById(productId),
    enabled: productId > 0,
  });
};

export const useMyProducts = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: productKeys.my(page, pageSize),
    queryFn: () => getMyProducts(page, pageSize),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: UpdateProductRequest }) =>
      updateProduct(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

export const useApproveProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: ApproveProductRequest }) =>
      approveProduct(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

export const usePendingProducts = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: productKeys.pending(page, pageSize),
    queryFn: () => getPendingProducts(page, pageSize),
  });
};
