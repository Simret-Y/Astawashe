import { postJson, getJson, setToken, getToken, clearToken } from './api';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR' | 'HOSPITAL_ADMIN' | 'SYSTEM_ADMIN';
  fullName?: string;
  status?: 'PENDING' | 'PENDING_HOSPITAL_APPROVAL' | 'PENDING_DOCTOR_APPROVAL' | 'HOSPITAL_APPROVED' | 'DOCTOR_APPROVED' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  emailVerified?: boolean;
  profileData?: any;
}

export interface AuthResponse {
  user?: User;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
  };
  requiresEmailVerification?: boolean;
  message?: string;
}

let currentUser: User | null = (() => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
})();

const setUserSession = (user: User | undefined, accessToken?: string) => {
  if (accessToken) {
    setToken(accessToken);
  }
  if (user) {
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
  }
};

const register = async (registerPayload: Record<string, any>): Promise<AuthResponse> => {
  const payload = { ...registerPayload };
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  
  const response = await postJson<AuthResponse>('/auth/register', payload, false);
  if (response.tokens?.accessToken && response.user) {
    setUserSession(response.user, response.tokens.accessToken);
  }
  return response;
};

const login = async (email_or_phone: string, password: string): Promise<AuthResponse> => {
  const isEmail = email_or_phone.includes('@');
  const payload = isEmail 
    ? { email: email_or_phone, password }
    : { phone: email_or_phone, password };

  const response = await postJson<AuthResponse>('/auth/login', payload, false);
  if (response.tokens?.accessToken && response.user) {
    setUserSession(response.user, response.tokens.accessToken);
  }
  return response;
};

const fetchCurrentUser = async (): Promise<User | null> => {
  if (!getToken()) return null;
  try {
    const res = await getJson<{ user: User }>('/auth/me', true);
    if (res.user) {
      setUserSession(res.user);
      return res.user;
    }
  } catch {
    // If token invalid, clear
    logout();
  }
  return null;
};

const logout = () => {
  clearToken();
  localStorage.removeItem('user');
  currentUser = null;
};

const getCurrentUser = (): User | null => {
  if (currentUser) return currentUser;
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      currentUser = JSON.parse(stored);
      return currentUser;
    }
  } catch {
    return null;
  }
  return null;
};

const isAuthenticated = (): boolean => {
  return !!getToken();
};

export { register, login, logout, getCurrentUser, fetchCurrentUser, isAuthenticated, setUserSession };
