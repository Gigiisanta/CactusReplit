/**
 * 🚀 CLEAN ARCHITECTURE: Client Service
 *
 * Centralized service for all client-related API operations.
 * Components should use this service instead of direct apiClient calls.
 */

import {
  Client,
  ClientCreate,
  ClientUpdate,
  InvestmentAccount,
  InsurancePolicy,
} from '@/types';
import { apiClient } from '@/lib/api';

export class ClientService {
  /**
   * Get all clients for the current advisor
   */
  static async getClients(): Promise<Client[]> {
    return apiClient.getClients();
  }

  /**
   * Get a specific client by ID
   */
  static async getClient(clientId: number): Promise<Client> {
    return apiClient.getClient(clientId);
  }

  /**
   * Create a new client
   */
  static async createClient(clientData: ClientCreate): Promise<Client> {
    return apiClient.createClient(clientData);
  }

  /**
   * Update an existing client
   */
  static async updateClient(
    clientId: number,
    clientData: ClientUpdate
  ): Promise<Client> {
    return apiClient.updateClient(clientId, clientData);
  }

  /**
   * Delete a client
   */
  static async deleteClient(clientId: number): Promise<Client> {
    return apiClient.deleteClient(clientId);
  }

  /**
   * Investment Account Operations
   */
  static async createInvestmentAccount(
    clientId: number,
    accountData: {
      platform: string;
      account_number?: string;
      aum: number;
    }
  ): Promise<InvestmentAccount> {
    return apiClient.createInvestmentAccount(clientId, accountData);
  }

  static async updateInvestmentAccount(
    accountId: number,
    accountData: {
      platform?: string;
      account_number?: string;
      aum?: number;
    }
  ): Promise<InvestmentAccount> {
    return apiClient.updateInvestmentAccount(accountId, accountData);
  }

  static async deleteInvestmentAccount(
    accountId: number
  ): Promise<InvestmentAccount> {
    return apiClient.deleteInvestmentAccount(accountId);
  }

  /**
   * Insurance Policy Operations
   */
  static async createInsurancePolicy(
    clientId: number,
    policyData: {
      policy_number: string;
      insurance_type: string;
      premium_amount: number;
      coverage_amount: number;
    }
  ): Promise<InsurancePolicy> {
    return apiClient.createInsurancePolicy(clientId, policyData);
  }

  static async updateInsurancePolicy(
    policyId: number,
    policyData: {
      policy_number?: string;
      insurance_type?: string;
      premium_amount?: number;
      coverage_amount?: number;
    }
  ): Promise<InsurancePolicy> {
    return apiClient.updateInsurancePolicy(policyId, policyData);
  }

  static async deleteInsurancePolicy(
    policyId: number
  ): Promise<InsurancePolicy> {
    return apiClient.deleteInsurancePolicy(policyId);
  }
}
