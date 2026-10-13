const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lms_token');
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lms_token', token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
  }
};

export async function openProtectedFile(endpoint: string): Promise<void> {
  const fileWindow = window.open('about:blank', '_blank');
  const token = getAuthToken();
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Unable to access this document.');
    const fileUrl = URL.createObjectURL(await response.blob());
    if (fileWindow) fileWindow.location.href = fileUrl;
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
  } catch (error) {
    fileWindow?.close();
    throw error;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Unable to parse server response.',
  }));

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.message || `HTTP error ${response.status}`,
      errors: data.errors || null,
      data: data.data || null,
    };
  }

  return data;
}
