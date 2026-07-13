import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategoriesTree, createCategory, updateCategory, deleteCategory } from '../api/categoriesApi';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../../../types/category';

export const categoryKeys = {
  all: ['categories'] as const,
  tree: () => ['categories', 'tree'] as const,
};

export const useCategoriesTree = () => {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: getCategoriesTree,
    staleTime: 10 * 60 * 1000, // Categories change infrequently
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryRequest }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};
