import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, deleteUser } from '../api/usersApi';

export const adminUserKeys = {
  all: ['admin-users'] as const,
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: adminUserKeys.all,
    queryFn: getAllUsers,
  });
};

export const useAdminDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
};
