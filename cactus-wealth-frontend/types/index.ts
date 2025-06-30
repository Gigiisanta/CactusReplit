// User types
export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
  clients: Client[];
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SENIOR_ADVISOR = 'SENIOR_ADVISOR',
  JUNIOR_ADVISOR = 'JUNIOR_ADVISOR',
}

export enum RiskProfile {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum ClientStatus {
  PROSPECT = 'prospect',
  CONTACTED = 'contacted',
  ONBOARDING = 'onboarding',
  ACTIVE_INVESTOR = 'active_investor',
  ACTIVE_INSURED = 'active_insured',
  DORMANT = 'dormant',
}

export enum LeadSource {
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  EVENT = 'event',
  ORGANIC = 'organic',
  OTHER = 'other',
}

export enum AssetType {
  STOCK = 'STOCK',
  BOND = 'BOND',
  ETF = 'ETF',
  MUTUAL_FUND = 'MUTUAL_FUND',
  CASH = 'CASH',
  OTHER = 'OTHER',
}

// Investment Account types
export interface InvestmentAccount {
  id: number;
  platform: string;
  account_number?: string;
  aum: number;
  client_id: number;
  created_at: string;
  updated_at: string;
}

// Insurance Policy types
export interface InsurancePolicy {
  id: number;
  policy_number: string;
  insurance_type: string;
  premium_amount: number;
  coverage_amount: number;
  client_id: number;
  created_at: string;
  updated_at: string;
}

// Client types
export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  risk_profile: RiskProfile;
  status: ClientStatus;
  lead_source?: LeadSource;
  notes?: string;
  portfolio_name?: string;
  referred_by_client_id?: number;
  owner_id: number;
  created_at: string;
  updated_at: string;
  portfolios?: Portfolio[];
  investment_accounts?: InvestmentAccount[];
  insurance_policies?: InsurancePolicy[];
  referred_clients?: Client[];
}

export interface ClientCreate {
  first_name: string;
  last_name: string;
  email: string;
  risk_profile: RiskProfile;
  status?: ClientStatus;
  lead_source?: LeadSource;
  notes?: string;
  portfolio_name?: string;
  referred_by_client_id?: number;
}

export interface ClientUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  risk_profile?: RiskProfile;
  status?: ClientStatus;
  lead_source?: LeadSource;
  notes?: string;
  portfolio_name?: string;
  referred_by_client_id?: number;
}

// Portfolio types
export interface Portfolio {
  id: number;
  name: string;
  client_id: number;
  created_at: string;
  updated_at: string;
  positions: Position[];
}

export interface Position {
  id: number;
  quantity: number;
  purchase_price: number;
  created_at: string;
  updated_at: string;
  portfolio_id: number;
  asset_id: number;
  asset: Asset;
}

export interface Asset {
  id: number;
  ticker_symbol: string;
  name: string;
  asset_type: AssetType;
  sector?: string;
  created_at: string;
}

export interface PortfolioValuation {
  portfolio_id: number;
  portfolio_name: string;
  total_value: number;
  total_cost_basis: number;
  total_pnl: number;
  total_pnl_percentage: number;
  positions_count: number;
  last_updated: string;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// API Response types
export interface ApiError {
  detail: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

// Dashboard types
export interface DashboardSummaryResponse {
  total_clients: number;
  assets_under_management: number;
  monthly_growth_percentage: number | null;
  reports_generated_this_quarter: number;
}

export interface LoginData {
  username: string;
  password: string;
}

// Report types
export interface ReportGenerationResponse {
  success: boolean;
  message: string;
  report_id?: number;
}

// Notification types
export interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: number;
}

// Model Portfolio types
export interface ModelPortfolioPosition {
  id: number;
  weight: number;
  created_at: string;
  updated_at: string;
  model_portfolio_id: number;
  asset_id: number;
  asset: Asset;
}

export interface ModelPortfolio {
  id: number;
  name: string;
  description?: string;
  risk_profile: RiskProfile;
  created_at: string;
  updated_at: string;
  positions: ModelPortfolioPosition[];
}

export interface ModelPortfolioCreate {
  name: string;
  description?: string;
  risk_profile: RiskProfile;
}

export interface ModelPortfolioPositionCreate {
  asset_id: number;
  weight: number;
}

export interface ModelPortfolioPositionUpdate {
  weight?: number;
}

// Chart data types for portfolio visualization
export interface AssetAllocationData {
  name: string;
  value: number;
  ticker: string;
  color?: string;
}

export interface SectorAllocationData {
  name: string;
  value: number;
  assets: string[];
  color?: string;
}
