import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSystemSetting, updateSystemSetting } from './api/adminSettingsApi';
import { FiSave, FiSettings, FiDollarSign } from 'react-icons/fi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import './AdminSettingsPage.css';

export const AdminSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [rate, setRate] = useState<string>('');
  const [earnRate, setEarnRate] = useState<string>('');

  const { data: loyaltyRate, isLoading: isRateLoading } = useQuery({
    queryKey: ['systemSetting', 'Loyalty:PointsToCurrencyRate'],
    queryFn: () => getSystemSetting('Loyalty:PointsToCurrencyRate'),
    retry: false
  });

  const { data: loyaltyEarnRate, isLoading: isEarnRateLoading } = useQuery({
    queryKey: ['systemSetting', 'Loyalty:EarnRate'],
    queryFn: () => getSystemSetting('Loyalty:EarnRate'),
    retry: false
  });

  // Keep internal state in sync with fetched data, but only on first load
  React.useEffect(() => {
    if (loyaltyRate?.value) {
      setRate(loyaltyRate.value);
    } else if (!isRateLoading) {
      setRate('100'); // Default fallback if not set in DB
    }
  }, [loyaltyRate, isRateLoading]);

  React.useEffect(() => {
    if (loyaltyEarnRate?.value) {
      setEarnRate(loyaltyEarnRate.value);
    } else if (!isEarnRateLoading) {
      setEarnRate('10'); // Default fallback if not set in DB
    }
  }, [loyaltyEarnRate, isEarnRateLoading]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { key: string, value: string }) => {
      return updateSystemSetting(payload.key, { value: payload.value });
    },
    onSuccess: () => {
      toast.success('Setting updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['systemSetting'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update setting.');
    }
  });

  const handleSaveRate = () => {
    if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) {
      toast.error('Please enter a valid number greater than 0.');
      return;
    }
    updateMutation.mutate({ key: 'Loyalty:PointsToCurrencyRate', value: rate });
  };

  const handleSaveEarnRate = () => {
    if (!earnRate || isNaN(Number(earnRate)) || Number(earnRate) <= 0) {
      toast.error('Please enter a valid number greater than 0.');
      return;
    }
    updateMutation.mutate({ key: 'Loyalty:EarnRate', value: earnRate });
  };

  const isLoading = isRateLoading || isEarnRateLoading;

  return (
    <div className="admin-settings-container">
      <div className="admin-settings-header">
        <div className="admin-settings-icon-wrapper">
          <FiSettings className="w-6 h-6 text-brand-700" />
        </div>
        <div>
          <h1 className="admin-settings-title">System Settings</h1>
          <p className="admin-settings-subtitle">Configure global platform settings</p>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">
            <FiDollarSign className="w-5 h-5 text-gray-500" />
            Loyalty & Rewards
          </h3>
        </div>
        
        <div className="settings-card-body">
          <div className="settings-form-group mb-8">
            <div>
              <label className="settings-label">
                Points to Currency Conversion Rate (Redemption)
              </label>
              <p className="settings-desc">
                How many loyalty points equal 1 unit of currency (EGP)? For example, if you enter "100", then 100 points = 1 EGP discount.
              </p>
              <div className="settings-input-group">
                <span className="settings-input-prefix">
                  Points
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="settings-input"
                  placeholder="e.g. 100"
                />
                <span className="settings-input-suffix">
                  = 1 EGP
                </span>
              </div>
            </div>

            <div className="settings-actions">
              <button
                onClick={handleSaveRate}
                disabled={isLoading || updateMutation.isPending}
                className="settings-save-btn"
              >
                {updateMutation.isPending ? (
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                ) : (
                  <FiSave className="mr-2 -ml-1 h-4 w-4" />
                )}
                Save Rate
              </button>
            </div>
          </div>

          <div className="settings-form-group pt-6 border-t border-gray-100">
            <div>
              <label className="settings-label">
                Points Earned per Currency Unit
              </label>
              <p className="settings-desc">
                How many loyalty points does a user earn for every 1 EGP spent? For example, if you enter "10", a user spending 100 EGP will earn 1000 points.
              </p>
              <div className="settings-input-group">
                <span className="settings-input-prefix">
                  1 EGP Spent =
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={earnRate}
                  onChange={(e) => setEarnRate(e.target.value)}
                  className="settings-input"
                  placeholder="e.g. 10"
                />
                <span className="settings-input-suffix">
                  Points Earned
                </span>
              </div>
            </div>

            <div className="settings-actions">
              <button
                onClick={handleSaveEarnRate}
                disabled={isLoading || updateMutation.isPending}
                className="settings-save-btn"
              >
                {updateMutation.isPending ? (
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                ) : (
                  <FiSave className="mr-2 -ml-1 h-4 w-4" />
                )}
                Save Earn Rate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
