import { AuthService } from '@/services/auth.service';
import { UserRole } from '@/types';

// Mock the API client
jest.mock('../../lib/api', () => ({
  apiClient: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

import { apiClient } from '@/lib/api';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      // LoginCredentials requiere username y password
      const credentials = {
        username: 'testuser',
        password: 'password',
      };

      mockApiClient.login.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.login(credentials);

      expect(mockApiClient.login).toHaveBeenCalledWith(credentials);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on login failure', async () => {
      const error = new Error('Invalid credentials');
      mockApiClient.login.mockRejectedValueOnce(error);

      // En el test de error, también usar username
      const credentialsError = {
        username: 'testuser',
        password: 'wrong-password',
      };

      await expect(AuthService.login(credentialsError)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('register', () => {
    it('should register successfully with valid data', async () => {
      const mockResponse = {
        id: 1,
        email: 'new@example.com',
        username: 'newuser',
      };

      // UserCreate requiere username, email, password, role
      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        role: UserRole.ADMIN,
      };

      mockApiClient.register.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.register(registerData);

      expect(mockApiClient.register).toHaveBeenCalledWith(registerData);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on registration failure', async () => {
      const error = new Error('Email already exists');
      mockApiClient.register.mockRejectedValueOnce(error);

      const registerDataError = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        role: UserRole.ADMIN,
      };

      await expect(AuthService.register(registerDataError)).rejects.toThrow(
        'Email already exists'
      );
    });
  });
});
