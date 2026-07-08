export type UserRole = 'Customer' | 'Seller' | 'Admin';

export interface User {
  userId: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  tokenExpiresOn: string;
  roles: string[];
}

export interface AuthContextType {
  user: User | null;
  roles: UserRole[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequestData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  clearAuth: () => void;
}

export interface RegisterRequestData {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'Customer' | 'Seller';
}
