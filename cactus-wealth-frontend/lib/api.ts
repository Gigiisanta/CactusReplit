import {
  Token,
  LoginCredentials,
  UserCreate,
  Client,
  ClientCreate,
  ClientUpdate,
  PortfolioValuation,
  ApiError,
  DashboardSummaryResponse,
  ReportGenerationResponse,
  InvestmentAccount,
  InsurancePolicy,
  Notification,
} from '@/types';
import { apiClientInterceptor } from './apiClient';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): HeadersInit {
    // Now we'll rely on the interceptor for auth headers, but keep this for special cases
    return {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Handle empty responses (like for DELETE operations)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Auth methods
  async login(credentials: LoginCredentials): Promise<Token> {
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);
    params.append('grant_type', 'password');
    params.append('scope', '');
    params.append('client_id', '');
    params.append('client_secret', '');

    const response = await fetch(`${this.baseURL}/login/access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      let errorMsg = 'Login failed';
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        errorMsg = response.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  }

  async register(userCreate: UserCreate): Promise<any> {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify(userCreate),
    });
  }

  // Client methods (using interceptor for automatic auth)
  async getClients(): Promise<Client[]> {
    const response = await apiClientInterceptor
      .getClient()
      .get<Client[]>('/clients/');
    return response.data;
  }

  async getClient(clientId: number): Promise<Client> {
    const response = await apiClientInterceptor
      .getClient()
      .get<Client>(`/clients/${clientId}`);
    return response.data;
  }

  async createClient(client: ClientCreate): Promise<Client> {
    const response = await apiClientInterceptor
      .getClient()
      .post<Client>('/clients/', client);
    return response.data;
  }

  async updateClient(clientId: number, client: ClientUpdate): Promise<Client> {
    const response = await apiClientInterceptor
      .getClient()
      .put<Client>(`/clients/${clientId}`, client);
    return response.data;
  }

  async deleteClient(clientId: number): Promise<Client> {
    const response = await apiClientInterceptor
      .getClient()
      .delete<Client>(`/clients/${clientId}`);
    return response.data;
  }

  // Portfolio methods
  async getPortfolioValuation(
    portfolioId: number
  ): Promise<PortfolioValuation> {
    return this.request<PortfolioValuation>(
      `/portfolios/${portfolioId}/valuation`
    );
  }

  async downloadPortfolioReport(portfolioId: number): Promise<Blob> {
    const response = await fetch(
      `${this.baseURL}/portfolios/${portfolioId}/report/download`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || 'Failed to download report');
    }

    return await response.blob();
  }

  // Dashboard methods (using interceptor for automatic auth)
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    const response = await apiClientInterceptor
      .getClient()
      .get<DashboardSummaryResponse>('/dashboard/summary');
    return response.data;
  }

  // 🚀 INSIGHT ANALYTICS: Get AUM historical data for charts
  async getAumHistory(
    days: number = 30
  ): Promise<Array<{ date: string; value: number }>> {
    const response = await apiClientInterceptor
      .getClient()
      .get<
        Array<{ date: string; value: number }>
      >(`/dashboard/aum-history?days=${days}`);
    return response.data;
  }

  // Report methods (using interceptor for automatic auth)
  async generateReport(
    clientId: number,
    reportType: string = 'PORTFOLIO_SUMMARY'
  ): Promise<ReportGenerationResponse> {
    const response = await apiClientInterceptor
      .getClient()
      .post<ReportGenerationResponse>(
        `/reports/clients/${clientId}/generate-report`,
        {
          client_id: clientId,
          report_type: reportType,
        }
      );
    return response.data;
  }

  // Investment Account methods
  async createInvestmentAccount(
    clientId: number,
    account: {
      platform: string;
      account_number?: string;
      aum: number;
    }
  ): Promise<InvestmentAccount> {
    return this.request<InvestmentAccount>(
      `/clients/${clientId}/investment-accounts/`,
      {
        method: 'POST',
        body: JSON.stringify({
          ...account,
          client_id: clientId,
        }),
      }
    );
  }

  async updateInvestmentAccount(
    accountId: number,
    account: {
      platform?: string;
      account_number?: string;
      aum?: number;
    }
  ): Promise<InvestmentAccount> {
    return this.request<InvestmentAccount>(
      `/investment-accounts/${accountId}`,
      {
        method: 'PUT',
        body: JSON.stringify(account),
      }
    );
  }

  async deleteInvestmentAccount(accountId: number): Promise<InvestmentAccount> {
    return this.request<InvestmentAccount>(
      `/investment-accounts/${accountId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Insurance Policy methods
  async createInsurancePolicy(
    clientId: number,
    policy: {
      policy_number: string;
      insurance_type: string;
      premium_amount: number;
      coverage_amount: number;
    }
  ): Promise<InsurancePolicy> {
    return this.request<InsurancePolicy>(
      `/clients/${clientId}/insurance-policies/`,
      {
        method: 'POST',
        body: JSON.stringify({
          ...policy,
          client_id: clientId,
        }),
      }
    );
  }

  async updateInsurancePolicy(
    policyId: number,
    policy: {
      policy_number?: string;
      insurance_type?: string;
      premium_amount?: number;
      coverage_amount?: number;
    }
  ): Promise<InsurancePolicy> {
    return this.request<InsurancePolicy>(`/insurance-policies/${policyId}`, {
      method: 'PUT',
      body: JSON.stringify(policy),
    });
  }

  async deleteInsurancePolicy(policyId: number): Promise<InsurancePolicy> {
    return this.request<InsurancePolicy>(`/insurance-policies/${policyId}`, {
      method: 'DELETE',
    });
  }

  // Notification methods (using interceptor for automatic auth)
  async getNotifications(limit: number = 10): Promise<Notification[]> {
    const response = await apiClientInterceptor
      .getClient()
      .get<Notification[]>(`/notifications?limit=${limit}`);
    return response.data;
  }

  // 🚀 LIVE-OPS: Crear notificación de prueba
  async createNotification(notification: {
    message: string;
  }): Promise<Notification> {
    const response = await apiClientInterceptor
      .getClient()
      .post<Notification>('/notifications/', notification);
    return response.data;
  }

  // Model Portfolio methods (using interceptor for automatic auth)
  async getModelPortfolios(): Promise<any[]> {
    const response = await apiClientInterceptor
      .getClient()
      .get<any[]>('/model-portfolios/');
    return response.data;
  }

  async createModelPortfolio(portfolio: {
    name: string;
    description?: string;
    risk_profile: 'LOW' | 'MEDIUM' | 'HIGH';
  }): Promise<any> {
    const response = await apiClientInterceptor
      .getClient()
      .post<any>('/model-portfolios/', portfolio);
    return response.data;
  }

  async updateModelPortfolio(
    portfolioId: number,
    portfolio: {
      name?: string;
      description?: string;
      risk_profile?: 'LOW' | 'MEDIUM' | 'HIGH';
    }
  ): Promise<any> {
    const response = await apiClientInterceptor
      .getClient()
      .put<any>(`/model-portfolios/${portfolioId}`, portfolio);
    return response.data;
  }

  async deleteModelPortfolio(portfolioId: number): Promise<any> {
    const response = await apiClientInterceptor
      .getClient()
      .delete<any>(`/model-portfolios/${portfolioId}`);
    return response.data;
  }

  // Get specific model portfolio with positions
  async getModelPortfolio(portfolioId: number): Promise<any> {
    const response = await apiClientInterceptor
      .getClient()
      .get<any>(`/model-portfolios/${portfolioId}`);
    return response.data;
  }

  // Asset search methods (using interceptor for automatic auth)
  async searchAssets(query: string, limit: number = 10): Promise<any[]> {
    const response = await apiClientInterceptor
      .getClient()
      .get<
        any[]
      >(`/assets/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  }

  // Model Portfolio Position methods (using interceptor for automatic auth)
  async addModelPortfolioPosition(
    portfolioId: number,
    position: {
      asset_id: number;
      weight: number;
    }
  ): Promise<any> {
    const response = await apiClientInterceptor
      .getClient()
      .post<any>(`/model-portfolios/${portfolioId}/positions`, position);
    return response.data;
  }

  async updateModelPortfolioPosition(
    portfolioId: number,
    positionId: number,
    position: {
      weight?: number;
    }
  ): Promise<any> {
    const response = await apiClientInterceptor
      .getClient()
      .put<any>(
        `/model-portfolios/${portfolioId}/positions/${positionId}`,
        position
      );
    return response.data;
  }

  async deleteModelPortfolioPosition(
    portfolioId: number,
    positionId: number
  ): Promise<any> {
    const response = await apiClientInterceptor
      .getClient()
      .delete<any>(`/model-portfolios/${portfolioId}/positions/${positionId}`);
    return response.data;
  }

  // Portfolio Backtesting methods (using interceptor for automatic auth)
  async backtestPortfolio(request: {
    composition: Array<{
      ticker: string;
      weight: number;
    }>;
    benchmarks: string[];
    period: string;
  }): Promise<{
    start_date: string;
    end_date: string;
    portfolio_composition: Array<{
      ticker: string;
      weight: number;
    }>;
    benchmarks: string[];
    data_points: Array<{
      date: string;
      portfolio_value: number;
      benchmark_values: Record<string, number>;
      dividend_events: Array<{
        ticker: string;
        amount: number;
      }>;
    }>;
    performance_metrics: Record<string, number>;
  }> {
    const response = await apiClientInterceptor
      .getClient()
      .post(`/portfolios/backtest`, request);
    return response.data;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { ApiClient };
