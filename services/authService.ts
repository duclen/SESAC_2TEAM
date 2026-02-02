const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  user_seq_no?: string;
}

export interface UserInfo {
  user_seq_no: string;
  user_name: string;
  user_ci: string;
  user_email?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userInfo: UserInfo | null;
}

// Get OAuth login URL from backend
export const getLoginUrl = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`);
  if (!response.ok) {
    throw new Error('Failed to get login URL');
  }
  const data = await response.json();
  return data.auth_url;
};

// Exchange authorization code for tokens
export const exchangeCodeForToken = async (code: string): Promise<TokenResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to exchange code for token');
  }

  return response.json();
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string): Promise<TokenResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to refresh token');
  }

  return response.json();
};

// Get user info
export const getUserInfo = async (accessToken: string): Promise<UserInfo> => {
  const response = await fetch(
    `${API_BASE_URL}/api/user/info?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get user info');
  }

  return response.json();
};

// Local storage helpers
const AUTH_STORAGE_KEY = 'legacy_flow_auth';

export const saveAuthState = (state: Partial<AuthState>): void => {
  const existing = getAuthState();
  const updated = { ...existing, ...state };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
};

export const getAuthState = (): AuthState => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      userInfo: null,
    };
  }
  return JSON.parse(stored);
};

export const clearAuthState = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

// Start login flow
export const login = async (): Promise<void> => {
  const authUrl = await getLoginUrl();
  window.location.href = authUrl;
};

// Handle logout
export const logout = (): void => {
  clearAuthState();
  window.location.href = '/';
};
