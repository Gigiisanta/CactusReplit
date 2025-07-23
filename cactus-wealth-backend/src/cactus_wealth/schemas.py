from datetime import datetime
from decimal import Decimal
from typing import Generator, Callable, Any

from cactus_wealth.models import (
    ActivityType,
    AssetType,
    ClientStatus,
    LeadSource,
    RiskProfile,
    UserRole,
)
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Schema for creating a new user."""

    username: str
    email: EmailStr
    password: str
    role: UserRole


class ClientCreate(BaseModel):
    """Schema for creating a new client."""

    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None
    risk_profile: RiskProfile
    status: ClientStatus = ClientStatus.prospect
    lead_source: LeadSource | None = None
    notes: str | None = None
    live_notes: str | None = None
    portfolio_name: str | None = None
    referred_by_client_id: int | None = None


class ClientUpdate(BaseModel):
    """Schema for updating client data."""

    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    risk_profile: RiskProfile | None = None
    status: ClientStatus | None = None
    lead_source: LeadSource | None = None
    notes: str | None = None
    live_notes: str | None = None
    portfolio_name: str | None = None
    referred_by_client_id: int | None = None


class ClientRead(BaseModel):
    """Schema for reading client data."""

    id: int
    first_name: str
    last_name: str
    email: str
    phone: str | None
    risk_profile: RiskProfile
    status: ClientStatus
    lead_source: LeadSource | None
    notes: str | None
    live_notes: str | None
    portfolio_name: str | None
    referred_by_client_id: int | None
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserRead(BaseModel):
    """Schema for reading user data (without sensitive information)."""

    id: int
    username: str
    email: str
    is_active: bool
    role: UserRole
    created_at: datetime
    updated_at: datetime
    clients: list[ClientRead] = []

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for token response."""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for token payload data."""

    email: str | None = None


# ClientActivity Schemas
class ClientActivityCreate(BaseModel):
    """Schema for creating a new client activity."""

    client_id: int
    activity_type: ActivityType
    description: str
    extra_data: str | None = None


class ClientActivityRead(BaseModel):
    """Schema for reading client activity data."""

    id: int
    client_id: int
    activity_type: ActivityType
    description: str
    extra_data: str | None
    created_at: datetime
    created_by: int

    class Config:
        from_attributes = True


# Asset Schemas
class AssetRead(BaseModel):
    """Schema for reading asset data."""

    id: int
    ticker_symbol: str
    name: str
    asset_type: AssetType
    sector: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# Position Schemas
class PositionRead(BaseModel):
    """Schema for reading position data with nested asset information."""

    id: int
    quantity: float
    purchase_price: float
    created_at: datetime
    updated_at: datetime
    portfolio_id: int
    asset_id: int
    asset: AssetRead

    class Config:
        from_attributes = True


# Portfolio Schemas
class PortfolioRead(BaseModel):
    """Schema for reading portfolio data with positions."""

    id: int
    name: str
    client_id: int
    created_at: datetime
    updated_at: datetime
    positions: list[PositionRead] = []

    class Config:
        from_attributes = True


# Portfolio Valuation Schema
class PortfolioValuation(BaseModel):
    """Schema for portfolio valuation results."""

    portfolio_id: int
    portfolio_name: str
    total_value: float  # Current market value
    total_cost_basis: float  # Total purchase cost
    total_pnl: float  # Profit/Loss (total_value - total_cost_basis)
    total_pnl_percentage: float  # P&L percentage
    positions_count: int
    last_updated: datetime

    class Config:
        from_attributes = True


# Dashboard Schemas
class DashboardSummaryResponse(BaseModel):
    """Schema for dashboard summary response with key performance indicators."""

    total_clients: int
    assets_under_management: float
    monthly_growth_percentage: float | None  # None if insufficient data
    reports_generated_this_quarter: int

    class Config:
        from_attributes = True


class AUMHistoryPoint(BaseModel):
    """Schema for AUM history data points for time series visualization."""

    date: str  # ISO format date (YYYY-MM-DD)
    value: float  # AUM value for that date

    class Config:
        from_attributes = True


# Report Schemas
class ReportCreate(BaseModel):
    """Schema for creating a new report."""

    client_id: int
    report_type: str = "PORTFOLIO_SUMMARY"


class ReportRead(BaseModel):
    """Schema for reading report data."""

    id: int
    client_id: int
    advisor_id: int
    generated_at: datetime
    file_path: str
    report_type: str

    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    """Schema for report generation response."""

    success: bool
    message: str
    report_id: int | None = None
    file_path: str | None = None


# Investment Account Schemas
class InvestmentAccountCreate(BaseModel):
    """Schema for creating a new investment account."""

    platform: str
    account_number: str | None = None
    aum: Decimal = Decimal("0.00")
    client_id: int


class InvestmentAccountUpdate(BaseModel):
    """Schema for updating investment account data."""

    platform: str | None = None
    account_number: str | None = None
    aum: Decimal | None = None


class InvestmentAccountRead(BaseModel):
    """Schema for reading investment account data."""

    id: int
    platform: str
    account_number: str | None
    aum: Decimal
    client_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Insurance Policy Schemas
class InsurancePolicyCreate(BaseModel):
    """Schema for creating a new insurance policy."""

    policy_number: str
    insurance_type: str
    premium_amount: Decimal
    coverage_amount: Decimal
    client_id: int


class InsurancePolicyUpdate(BaseModel):
    """Schema for updating insurance policy data."""

    policy_number: str | None = None
    insurance_type: str | None = None
    premium_amount: Decimal | None = None
    coverage_amount: Decimal | None = None


class InsurancePolicyRead(BaseModel):
    """Schema for reading insurance policy data."""

    id: int
    policy_number: str
    insurance_type: str
    premium_amount: Decimal
    coverage_amount: Decimal
    client_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Extended Client Schema with Details
class ClientReadWithDetails(BaseModel):
    """Schema for reading client data with related investment accounts and insurance policies."""

    id: int
    first_name: str
    last_name: str
    email: str
    risk_profile: RiskProfile
    status: ClientStatus
    lead_source: LeadSource | None
    notes: str | None
    portfolio_name: str | None
    referred_by_client_id: int | None
    owner_id: int
    created_at: datetime
    updated_at: datetime

    # Related data
    investment_accounts: list[InvestmentAccountRead] = []
    insurance_policies: list[InsurancePolicyRead] = []
    referred_clients: list[ClientRead] = []

    class Config:
        from_attributes = True


# Notification Schemas
class NotificationCreate(BaseModel):
    """Schema for creating a new notification."""

    message: str
    user_id: int


class NotificationRead(BaseModel):
    """Schema for reading notification data."""

    id: int
    message: str
    is_read: bool
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    """Schema for updating notification data."""

    is_read: bool | None = None


# Model Portfolio Schemas
class ModelPortfolioCreate(BaseModel):
    """Schema for creating a new model portfolio."""

    name: str
    description: str | None = None
    risk_profile: RiskProfile


class ModelPortfolioUpdate(BaseModel):
    """Schema for updating model portfolio data."""

    name: str | None = None
    description: str | None = None
    risk_profile: RiskProfile | None = None


class ModelPortfolioPositionRead(BaseModel):
    """Schema for reading model portfolio position data with nested asset."""

    id: int
    weight: Decimal
    created_at: datetime
    updated_at: datetime
    model_portfolio_id: int
    asset_id: int
    asset: AssetRead

    class Config:
        from_attributes = True


class ModelPortfolioRead(BaseModel):
    """Schema for reading model portfolio data with positions."""

    id: int
    name: str
    description: str | None
    risk_profile: RiskProfile
    created_at: datetime
    updated_at: datetime
    positions: list[ModelPortfolioPositionRead] = []

    class Config:
        from_attributes = True


class ModelPortfolioPositionCreate(BaseModel):
    """Schema for creating a new model portfolio position."""

    asset_id: int
    weight: Decimal

    class Config:
        @classmethod
        def __get_validators__(cls) -> 'Generator[Callable[..., Any], None, None]':
            yield cls.validate_weight
        @classmethod
        def validate_weight(cls, v: Any) -> Any:
            if hasattr(v, "weight") and (v.weight < 0 or v.weight > 1):
                raise ValueError("Weight must be between 0 and 1")
            return v


class ModelPortfolioPositionUpdate(BaseModel):
    """Schema for updating model portfolio position data."""

    weight: Decimal | None = None

    class Config:
        @classmethod
        def __get_validators__(cls) -> 'Generator[Callable[..., Any], None, None]':
            yield cls.validate_weight
        @classmethod
        def validate_weight(cls, v: Any) -> Any:
            if (
                hasattr(v, "weight")
                and v.weight is not None
                and (v.weight < 0 or v.weight > 1)
            ):
                raise ValueError("Weight must be between 0 and 1")
            return v


class ModelPortfolioWeightValidation(BaseModel):
    """Schema for validating total portfolio weights."""

    total_weight: Decimal
    is_valid: bool
    message: str

    class Config:
        from_attributes = True


# ============ BACKTESTING SCHEMAS ============


class PortfolioComposition(BaseModel):
    """Schema for portfolio composition in backtesting request."""

    ticker: str
    weight: float  # As decimal (0.0 to 1.0)


class BacktestRequest(BaseModel):
    """Schema for portfolio backtesting request."""

    composition: list[PortfolioComposition]
    benchmarks: list[str] = ["SPY"]  # Default benchmark
    period: str = "1y"  # 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max


class BacktestDataPoint(BaseModel):
    """Schema for a single data point in backtesting response."""

    date: str  # ISO format date
    portfolio_value: float
    benchmark_values: dict[str, float]  # {"SPY": 105.2, "QQQ": 108.1}
    dividend_events: list[dict[str, float | str]] = []  # [{"ticker": "AAPL", "amount": 0.25}]


class BacktestResponse(BaseModel):
    """Schema for portfolio backtesting response."""

    start_date: str
    end_date: str
    portfolio_composition: list[PortfolioComposition]
    benchmarks: list[str]
    data_points: list[BacktestDataPoint]
    performance_metrics: dict[str, float]  # {"total_return": 0.15, ...}

    class Config:
        from_attributes = True


class ClientNoteCreate(BaseModel):
    client_id: int
    title: str
    content: str


class ClientNoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class ClientNoteRead(BaseModel):
    id: int
    client_id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    created_by: int

    class Config:
        from_attributes = True
