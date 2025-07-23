import { ClientService } from '@/services/client.service';
import { RiskProfile, ClientStatus } from '@/types';

// Mock the API client
jest.mock('../../lib/api', () => ({
  apiClient: {
    getClients: jest.fn(),
    getClient: jest.fn(),
    createClient: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn(),
  },
}));

import { apiClient } from '@/lib/api';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ClientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClients', () => {
    it('should fetch clients successfully', async () => {
      // Client requiere id, first_name, last_name, risk_profile, status, owner_id, created_at, updated_at
      const mockClients = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          risk_profile: RiskProfile.MEDIUM,
          status: ClientStatus.ACTIVE_INSURED,
          owner_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
          risk_profile: RiskProfile.LOW,
          status: ClientStatus.DORMANT,
          owner_id: 2,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockApiClient.getClients.mockResolvedValueOnce(mockClients);

      const result = await ClientService.getClients();

      expect(mockApiClient.getClients).toHaveBeenCalled();
      expect(result).toEqual(mockClients);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch clients');
      mockApiClient.getClients.mockRejectedValueOnce(error);

      await expect(ClientService.getClients()).rejects.toThrow(
        'Failed to fetch clients'
      );
    });
  });

  describe('getClient', () => {
    it('should fetch a single client successfully', async () => {
      const mockClient = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        risk_profile: RiskProfile.MEDIUM,
        status: ClientStatus.ACTIVE_INSURED,
        owner_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockApiClient.getClient.mockResolvedValueOnce(mockClient);

      const result = await ClientService.getClient(1);

      expect(mockApiClient.getClient).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockClient);
    });

    it('should handle client not found', async () => {
      const error = new Error('Client not found');
      mockApiClient.getClient.mockRejectedValueOnce(error);

      await expect(ClientService.getClient(999)).rejects.toThrow(
        'Client not found'
      );
    });
  });

  describe('createClient', () => {
    it('should create a client successfully', async () => {
      // ClientCreate requiere first_name, last_name, email, risk_profile
      const clientData = {
        first_name: 'New',
        last_name: 'Client',
        email: 'new@example.com',
        risk_profile: RiskProfile.LOW,
      };

      const mockResponse = {
        id: 3,
        ...clientData,
        status: ClientStatus.ACTIVE_INSURED,
      };

      mockApiClient.createClient.mockResolvedValueOnce(mockResponse);

      const result = await ClientService.createClient(clientData);

      expect(mockApiClient.createClient).toHaveBeenCalledWith(clientData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      const error = new Error('Invalid email format');
      mockApiClient.createClient.mockRejectedValueOnce(error);

      const clientData = {
        first_name: 'Test Client',
        last_name: 'Test',
        email: 'invalid-email',
        risk_profile: RiskProfile.MEDIUM,
      };

      await expect(ClientService.createClient(clientData)).rejects.toThrow(
        'Invalid email format'
      );
    });
  });

  describe('updateClient', () => {
    it('should update a client successfully', async () => {
      // ClientUpdate ejemplo
      const clientUpdateData = {
        first_name: 'Updated',
        last_name: 'Client',
        phone: '+1234567890',
        risk_profile: RiskProfile.HIGH,
      };

      // Mock de respuesta para updateClient
      const updatedClient = {
        id: 1,
        first_name: 'Updated',
        last_name: 'Client',
        email: 'updated@example.com',
        phone: '+1234567890',
        risk_profile: RiskProfile.HIGH,
        status: ClientStatus.ACTIVE_INSURED,
        owner_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };
      mockApiClient.updateClient.mockResolvedValueOnce(updatedClient);
      const result = await ClientService.updateClient(1, clientUpdateData);
      expect(result).toEqual(updatedClient);
    });

    it('should handle update errors', async () => {
      const error = new Error('Client not found');
      mockApiClient.updateClient.mockRejectedValueOnce(error);

      const clientData = {
        first_name: 'Updated Client',
        last_name: 'Updated',
        email: 'updated@example.com',
        risk_profile: RiskProfile.LOW,
      };

      await expect(ClientService.updateClient(999, clientData)).rejects.toThrow(
        'Client not found'
      );
    });
  });

  describe('deleteClient', () => {
    it('should delete a client successfully', async () => {
      // Mock de respuesta para deleteClient
      const deletedClient = {
        id: 1,
        first_name: 'Deleted',
        last_name: 'Client',
        email: 'deleted@example.com',
        phone: '+1234567890',
        risk_profile: RiskProfile.LOW,
        status: ClientStatus.DORMANT,
        owner_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };
      mockApiClient.deleteClient.mockResolvedValueOnce(deletedClient);
      const deleteResult = await ClientService.deleteClient(1);
      expect(deleteResult).toEqual(deletedClient);
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Cannot delete client with active investments');
      mockApiClient.deleteClient.mockRejectedValueOnce(error);

      await expect(ClientService.deleteClient(1)).rejects.toThrow(
        'Cannot delete client with active investments'
      );
    });
  });
});
