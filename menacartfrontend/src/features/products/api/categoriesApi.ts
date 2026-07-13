import { apiClient } from '../../../api/client';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../../types/category';

export const getCategoriesTree = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/categories');
  return response.data;
};

export const getCategoryById = async (id: number): Promise<Category> => {
  const response = await apiClient.get<Category>(`/categories/${id}`);
  return response.data;
};

export const createCategory = async (data: CreateCategoryRequest): Promise<Category> => {
  const response = await apiClient.post<Category>('/categories/admin', data);
  return response.data;
};

export const updateCategory = async (id: number, data: UpdateCategoryRequest): Promise<Category> => {
  const response = await apiClient.put<Category>(`/categories/admin/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/categories/admin/${id}`);
};
