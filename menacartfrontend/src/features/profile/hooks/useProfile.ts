import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserById, updateUser, changePassword, deleteUser } from '../api/profileApi';
import type { UpdateUserRequest, ChangePasswordRequest } from '../api/profileApi';

export const profileKeys = {
  all: ['profile'] as const,
  detail: (id: string) => ['profile', id] as const,
};

export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserRequest) => updateUser(data),
    onSuccess: (_, variables) => {
      // Invalidate target user details cache
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) });
      // Invalidate current auth session user details
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
