import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClientInterceptor {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        console.log('INTERCEPTOR REQUEST: Attaching token:', token);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('INTERCEPTOR REQUEST: Headers:', config.headers);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle 401 errors globally
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.log('INTERCEPTOR RESPONSE: Caught 401 Error', error.config?.url);
          // Token is invalid/expired, logout automatically
          const { logout } = useAuthStore.getState();
          logout();
          
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Expose the axios instance
  getInstance(): AxiosInstance {
    return this.client;
  }

  // Helper methods for common operations
  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

// Create singleton instance
export const apiClientInterceptor = new ApiClientInterceptor(API_BASE_URL);

// Export the axios instance for direct use if needed
export const axiosInstance = apiClientInterceptor.getInstance(); 