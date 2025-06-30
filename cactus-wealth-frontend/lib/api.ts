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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('cactus_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${this.baseURL}/login/access-token`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    return await response.json();
  }

  async register(userCreate: UserCreate): Promise<any> {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify(userCreate),
    });
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    return this.request<Client[]>('/clients/');
  }

  async getClient(clientId: number): Promise<Client> {
    return this.request<Client>(`/clients/${clientId}`);
  }

  async createClient(client: ClientCreate): Promise<Client> {
    return this.request<Client>('/clients/', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  async updateClient(clientId: number, client: ClientUpdate): Promise<Client> {
    return this.request<Client>(`/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  }

  async deleteClient(clientId: number): Promise<Client> {
    return this.request<Client>(`/clients/${clientId}`, {
      method: 'DELETE',
    });
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

  // Dashboard methods
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    return this.request<DashboardSummaryResponse>('/dashboard/summary');
  }

  // Report methods
  async generateReport(clientId: number, reportType: string = 'PORTFOLIO_SUMMARY'): Promise<ReportGenerationResponse> {
    return this.request<ReportGenerationResponse>(`/reports/clients/${clientId}/generate-report`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        report_type: reportType,
      }),
    });
  }

  // Investment Account methods
  async createInvestmentAccount(clientId: number, account: {
    platform: string;
    account_number?: string;
    aum: number;
  }): Promise<InvestmentAccount> {
    return this.request<InvestmentAccount>(`/clients/${clientId}/investment-accounts/`, {
      method: 'POST',
      body: JSON.stringify({
        ...account,
        client_id: clientId,
      }),
    });
  }

  async updateInvestmentAccount(accountId: number, account: {
    platform?: string;
    account_number?: string;
    aum?: number;
  }): Promise<InvestmentAccount> {
    return this.request<InvestmentAccount>(`/investment-accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(account),
    });
  }

  async deleteInvestmentAccount(accountId: number): Promise<InvestmentAccount> {
    return this.request<InvestmentAccount>(`/investment-accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // Insurance Policy methods
  async createInsurancePolicy(clientId: number, policy: {
    policy_number: string;
    insurance_type: string;
    premium_amount: number;
    coverage_amount: number;
  }): Promise<InsurancePolicy> {
    return this.request<InsurancePolicy>(`/clients/${clientId}/insurance-policies/`, {
      method: 'POST',
      body: JSON.stringify({
        ...policy,
        client_id: clientId,
      }),
    });
  }

  async updateInsurancePolicy(policyId: number, policy: {
    policy_number?: string;
    insurance_type?: string;
    premium_amount?: number;
    coverage_amount?: number;
  }): Promise<InsurancePolicy> {
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

  // Notification methods
  async getNotifications(limit: number = 10): Promise<Notification[]> {
    return this.request<Notification[]>(`/notifications?limit=${limit}`);
  }

  // Model Portfolio methods
  async getModelPortfolios(): Promise<any[]> {
    return this.request<any[]>('/model-portfolios/');
  }

  async createModelPortfolio(portfolio: {
    name: string;
    description?: string;
    risk_profile: 'LOW' | 'MEDIUM' | 'HIGH';
  }): Promise<any> {
    return this.request<any>('/model-portfolios/', {
      method: 'POST',
      body: JSON.stringify(portfolio),
    });
  }

  async updateModelPortfolio(portfolioId: number, portfolio: {
    name?: string;
    description?: string;
    risk_profile?: 'LOW' | 'MEDIUM' | 'HIGH';
  }): Promise<any> {
    return this.request<any>(`/model-portfolios/${portfolioId}`, {
      method: 'PUT',
      body: JSON.stringify(portfolio),
    });
  }

  async deleteModelPortfolio(portfolioId: number): Promise<any> {
    return this.request<any>(`/model-portfolios/${portfolioId}`, {
      method: 'DELETE',
    });
  }

  // Get specific model portfolio with positions
  async getModelPortfolio(portfolioId: number): Promise<any> {
    return this.request<any>(`/model-portfolios/${portfolioId}`);
  }

  // Asset search methods
  async searchAssets(query: string, limit: number = 10): Promise<any[]> {
    return this.request<any[]>(`/assets/search?query=${encodeURIComponent(query)}&limit=${limit}`);
  }

  // Model Portfolio Position methods
  async addModelPortfolioPosition(portfolioId: number, position: {
    asset_id: number;
    weight: number;
  }): Promise<any> {
    return this.request<any>(`/model-portfolios/${portfolioId}/positions`, {
      method: 'POST',
      body: JSON.stringify(position),
    });
  }

  async updateModelPortfolioPosition(portfolioId: number, positionId: number, position: {
    weight?: number;
  }): Promise<any> {
    return this.request<any>(`/model-portfolios/${portfolioId}/positions/${positionId}`, {
      method: 'PUT',
      body: JSON.stringify(position),
    });
  }

  async deleteModelPortfolioPosition(portfolioId: number, positionId: number): Promise<any> {
    return this.request<any>(`/model-portfolios/${portfolioId}/positions/${positionId}`, {
      method: 'DELETE',
    });
  }

  // Portfolio Backtesting methods
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
    return this.request(`/portfolios/backtest`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
