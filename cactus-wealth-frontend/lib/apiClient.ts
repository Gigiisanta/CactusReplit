import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { isTokenExpired } from './token-utils';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiClientInterceptor {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache for GET requests
        Pragma: 'cache',
      },
      // Optimized timeout for better UX
      timeout: 15000, // Reduced from 30s to 15s
      validateStatus: (status) => status < 500, // Accept 4xx errors for proper handling
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add token and check expiry
    this.client.interceptors.request.use(
      (config) => {
        const { token, logout } = useAuthStore.getState();

        if (token) {
          // Check if token is expired before making request
          if (isTokenExpired(token, 2)) {
            // 2 minute buffer
            console.warn('🔒 Token expired, performing automatic logout');
            logout();

            // Dispatch logout event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:logout'));
            }

            // Reject the request to prevent it from going through
            return Promise.reject(
              new Error('Token expired - automatic logout')
            );
          }

          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add cache headers for GET requests
        if (config.method?.toLowerCase() === 'get') {
          config.headers['Cache-Control'] = 'public, max-age=300'; // 5 minutes
        } else {
          config.headers['Cache-Control'] = 'no-cache';
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('🔒 Received 401 error, performing automatic logout');

          // Clear auth state aggressively
          const { logout } = useAuthStore.getState();
          logout();

          // Clear localStorage manually as backup
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cactus-auth-storage');

            // Dispatch logout event to notify all components
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance
const apiClientInterceptorInstance = new ApiClientInterceptor(API_BASE_URL);
export const apiClientInterceptor = apiClientInterceptorInstance;
export const apiClient = apiClientInterceptorInstance.getClient();

// Test-only: permite crear una instancia nueva para tests
// @ts-ignore
if (process.env.NODE_ENV === 'test') {
  // @ts-ignore
  module.exports.createTestApiClientInterceptor = (baseURL: string) =>
    new ApiClientInterceptor(baseURL);
}

// Extended API client with additional methods
export const extendedApiClient = {
  bulkUploadInvestmentAccounts: async (
    clientId: number,
    formData: FormData
  ) => {
    const response = await apiClientInterceptor
      .getClient()
      .post(`/clients/${clientId}/investment-accounts/bulk-upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    return response;
  },
};
