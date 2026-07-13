import { apiClient } from '../../../api/client';

export interface SystemSettingDto {
  key: string;
  value: string;
}

export interface UpdateSystemSettingDto {
  value: string;
}

export const getSystemSetting = async (key: string): Promise<SystemSettingDto> => {
  const response = await apiClient.get<SystemSettingDto>(`/admin/settings/${key}`);
  return response.data;
};

export const updateSystemSetting = async (key: string, data: UpdateSystemSettingDto): Promise<SystemSettingDto> => {
  const response = await apiClient.put<SystemSettingDto>(`/admin/settings/${key}`, data);
  return response.data;
};
