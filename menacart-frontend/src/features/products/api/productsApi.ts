import { apiClient } from '../../../api/client';
import type { Product, ProductBrowseParams, CreateProductRequest, UpdateProductRequest, ApproveProductRequest } from '../../../types/product';

export const browseProducts = async (params: ProductBrowseParams = {}): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>('/products', { params });
  return response.data;
};

export const getProductById = async (productId: number): Promise<Product> => {
  const response = await apiClient.get<Product>(`/products/${productId}`);
  return response.data;
};

export const getMyProducts = async (page = 1, pageSize = 20): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>('/products/my', { params: { page, pageSize } });
  return response.data;
};

export const createProduct = async (data: CreateProductRequest): Promise<Product> => {
  const response = await apiClient.post<Product>('/products', data);
  return response.data;
};

export const updateProduct = async (productId: number, data: UpdateProductRequest): Promise<Product> => {
  const response = await apiClient.put<Product>(`/products/${productId}`, data);
  return response.data;
};

export const deleteProduct = async (productId: number): Promise<void> => {
  await apiClient.delete(`/products/${productId}`);
};

export const approveProduct = async (productId: number, data: ApproveProductRequest): Promise<Product> => {
  const response = await apiClient.patch<Product>(`/products/${productId}/approve`, data);
  return response.data;
};

export const getPendingProducts = async (page = 1, pageSize = 20): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>('/products/admin/pending', { params: { page, pageSize } });
  return response.data;
};
