import React, { useState } from 'react';
import { useAdminUsers, useAdminDeleteUser } from './hooks/useAdminUsers';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import './AdminUsersPage.css';

export const AdminUsersPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: users, isLoading, error, refetch } = useAdminUsers();
  const deleteMutation = useAdminDeleteUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const handleDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action is permanent and cannot be undone.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(userId);
      toastSuccess(`User "${userName}" has been successfully deleted.`);
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to delete user.');
    }
  };

  if (isLoading) {
    return (
      <div className="admin-users-container loading">
        <LoadingSkeleton variant="text" width="200px" height={32} />
        <div style={{ marginTop: '20px' }}>
          <LoadingSkeleton variant="rect" height="400px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-users-container error ">
        <p className="error-text">Failed to load platform users: {(error as any).message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const allUsers = users || [];

  // Filter logic
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = 
      roleFilter === 'all' || 
      user.roles.some((r) => r.toLowerCase() === roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-users-container animate-fade-in">
      <div className="admin-users-header">
        <div>
          <h1 className="admin-users-title">User Account Registry</h1>
          <p className="admin-users-subtitle">Monitor registered accounts, check user roles, and revoke platform access.</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="admin-users-controls ">
        <div className="search-input-wrapper">
          <Input
            label="Search Accounts"
            placeholder="Search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
          />
        </div>
        <div className="role-filter-wrapper">
          <label className="filter-label" htmlFor="role-filter-select">Role Group</label>
          <select
            id="role-filter-select"
            className="role-filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Groups</option>
            <option value="customer">Customers</option>
            <option value="seller">Sellers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="users-empty ">
          <h2>No matching accounts</h2>
          <p>No user records fit your query or role filter.</p>
        </div>
      ) : (
        <div className="users-table-wrapper ">
          <table className="users-table">
            <thead>
              <tr>
                <th>Profile ID</th>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email Address</th>
                <th>Assigned Roles</th>
                <th>Exclusion</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <span className="user-id-badge">#{user.userId.substring(0, 8)}</span>
                  </td>
                  <td>
                    <strong className="user-table-fullname">{user.firstName} {user.lastName}</strong>
                  </td>
                  <td>
                    <span className="user-table-username">@{user.userName}</span>
                  </td>
                  <td className="user-table-email">{user.email}</td>
                  <td>
                    <div className="user-roles-cell">
                      {user.roles.map((role) => (
                        <span key={role} className={`role-badge role-${role.toLowerCase()}`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(user.userId, user.userName)}
                      isLoading={deleteMutation.isPending && deleteMutation.variables === user.userId}
                    >
                      Delete Account
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
