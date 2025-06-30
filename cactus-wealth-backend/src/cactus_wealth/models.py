import enum
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from sqlmodel import Column, DateTime, Enum, Field, Index, SQLModel, Relationship, Numeric


class UserRole(str, enum.Enum):
    """User roles in the system."""
    ADMIN = "ADMIN"
    SENIOR_ADVISOR = "SENIOR_ADVISOR"
    JUNIOR_ADVISOR = "JUNIOR_ADVISOR"


class RiskProfile(str, enum.Enum):
    """Client risk profile levels."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AssetType(str, enum.Enum):
    """Asset type classification."""
    STOCK = "STOCK"
    ETF = "ETF"
    BOND = "BOND"


class ClientStatus(str, enum.Enum):
    """Client status in the sales pipeline."""
    prospect = "prospect"
    contacted = "contacted"  # 'escrito'
    onboarding = "onboarding"  # 'apertura'
    active_investor = "active_investor"  # 'invirtiendo'
    active_insured = "active_insured"
    dormant = "dormant"


class LeadSource(str, enum.Enum):
    """Lead source classification."""
    referral = "referral"
    social_media = "social_media"  # 'Redes'
    event = "event"
    organic = "organic"
    other = "other"


class User(SQLModel, table=True):
    """User model for authentication and authorization."""
    
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=50)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    is_active: bool = Field(default=True)
    role: UserRole = Field(
        sa_column=Column(Enum(UserRole), nullable=False)
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    )
    
    # Relationship with clients
    clients: List["Client"] = Relationship(back_populates="owner")
    
    __table_args__ = (
        Index("ix_users_username", "username"),
        Index("ix_users_email", "email"),
        Index("ix_users_role", "role"),
        Index("ix_users_is_active", "is_active"),
    )


class Client(SQLModel, table=True):
    """Client model for CRM functionality."""
    
    __tablename__ = "clients"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(unique=True, index=True, max_length=255)
    risk_profile: RiskProfile = Field(
        sa_column=Column(Enum(RiskProfile), nullable=False)
    )
    
    # New CRM fields
    status: ClientStatus = Field(
        sa_column=Column(Enum(ClientStatus), nullable=False),
        default=ClientStatus.prospect
    )
    lead_source: Optional[LeadSource] = Field(
        sa_column=Column(Enum(LeadSource), nullable=True),
        default=None
    )
    notes: Optional[str] = Field(default=None, max_length=2000)
    portfolio_name: Optional[str] = Field(default=None, max_length=100)
    referred_by_client_id: Optional[int] = Field(
        default=None, 
        foreign_key="clients.id"
    )
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    )
    
    # Foreign key to User (advisor)
    owner_id: int = Field(foreign_key="users.id")
    
    # Relationship with owner (advisor)
    owner: User = Relationship(back_populates="clients")
    
    # Relationship with portfolios
    portfolios: List["Portfolio"] = Relationship(back_populates="client")
    
    # Self-referential relationship for referrals
    referred_by: Optional["Client"] = Relationship(
        back_populates="referred_clients",
        sa_relationship_kwargs={"remote_side": "Client.id"}
    )
    referred_clients: List["Client"] = Relationship(
        back_populates="referred_by",
        sa_relationship_kwargs={"remote_side": "Client.referred_by_client_id"}
    )
    
    # Relationship with investment accounts and insurance policies
    investment_accounts: List["InvestmentAccount"] = Relationship(back_populates="client")
    insurance_policies: List["InsurancePolicy"] = Relationship(back_populates="client")
    
    __table_args__ = (
        Index("ix_clients_email", "email"),
        Index("ix_clients_owner_id", "owner_id"),
        Index("ix_clients_risk_profile", "risk_profile"),
        Index("ix_clients_status", "status"),
        Index("ix_clients_lead_source", "lead_source"),
        Index("ix_clients_referred_by_client_id", "referred_by_client_id"),
    )


class Asset(SQLModel, table=True):
    """Asset model for tradeable securities."""
    
    __tablename__ = "assets"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    ticker_symbol: str = Field(unique=True, index=True, max_length=20)
    name: str = Field(max_length=200)
    asset_type: AssetType = Field(
        sa_column=Column(Enum(AssetType), nullable=False)
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    
    # Relationship with positions
    positions: List["Position"] = Relationship(back_populates="asset")
    
    __table_args__ = (
        Index("ix_assets_ticker_symbol", "ticker_symbol"),
        Index("ix_assets_asset_type", "asset_type"),
    )


class Portfolio(SQLModel, table=True):
    """Portfolio model for client investment portfolios."""
    
    __tablename__ = "portfolios"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    )
    
    # Foreign key to Client
    client_id: int = Field(foreign_key="clients.id")
    
    # Relationships
    client: Client = Relationship(back_populates="portfolios")
    positions: List["Position"] = Relationship(back_populates="portfolio")
    snapshots: List["PortfolioSnapshot"] = Relationship(back_populates="portfolio")
    
    __table_args__ = (
        Index("ix_portfolios_client_id", "client_id"),
        Index("ix_portfolios_name", "name"),
    )


class PortfolioSnapshot(SQLModel, table=True):
    """Portfolio snapshot model for historical portfolio valuations."""
    
    __tablename__ = "portfolio_snapshots"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    value: Decimal = Field(
        sa_column=Column(Numeric(15, 2), nullable=False),
        description="Total portfolio value at snapshot time"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True)
    )
    
    # Foreign key to Portfolio
    portfolio_id: int = Field(foreign_key="portfolios.id", index=True)
    
    # Relationships
    portfolio: Portfolio = Relationship(back_populates="snapshots")
    
    __table_args__ = (
        Index("ix_portfolio_snapshots_portfolio_id", "portfolio_id"),
        Index("ix_portfolio_snapshots_timestamp", "timestamp"),
        Index("ix_portfolio_snapshots_portfolio_timestamp", "portfolio_id", "timestamp"),
    )


class Position(SQLModel, table=True):
    """Position model representing asset holdings in a portfolio."""
    
    __tablename__ = "positions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    quantity: float = Field(ge=0)  # Greater than or equal to 0
    purchase_price: float = Field(ge=0)  # Price per unit when purchased
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    )
    
    # Foreign keys
    portfolio_id: int = Field(foreign_key="portfolios.id")
    asset_id: int = Field(foreign_key="assets.id")
    
    # Relationships
    portfolio: Portfolio = Relationship(back_populates="positions")
    asset: Asset = Relationship(back_populates="positions")
    
    __table_args__ = (
        Index("ix_positions_portfolio_id", "portfolio_id"),
        Index("ix_positions_asset_id", "asset_id"),
        # Unique constraint to prevent duplicate assets in same portfolio
        Index("ix_positions_portfolio_asset", "portfolio_id", "asset_id", unique=True),
    )


class Report(SQLModel, table=True):
    """Report model for tracking generated PDF reports."""
    
    __tablename__ = "reports"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    generated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    file_path: str = Field(max_length=500)
    report_type: str = Field(max_length=50, default="PORTFOLIO_SUMMARY")
    
    # Foreign keys
    client_id: int = Field(foreign_key="clients.id")
    advisor_id: int = Field(foreign_key="users.id")
    
    # Relationships
    client: Client = Relationship()
    advisor: User = Relationship()
    
    __table_args__ = (
        Index("ix_reports_client_id", "client_id"),
        Index("ix_reports_advisor_id", "advisor_id"),
        Index("ix_reports_generated_at", "generated_at"),
        Index("ix_reports_report_type", "report_type"),
    )


class InvestmentAccount(SQLModel, table=True):
    """Investment account model for client investment accounts."""
    
    __tablename__ = "investment_accounts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    platform: str = Field(max_length=100)  # e.g., "Balanz", "Decrypto"
    account_number: Optional[str] = Field(default=None, max_length=50)
    aum: Decimal = Field(
        sa_column=Column(Numeric(15, 2), nullable=False),
        description="Assets Under Management for this specific account",
        default=Decimal('0.00')
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    )
    
    # Foreign key to Client
    client_id: int = Field(foreign_key="clients.id")
    
    # Relationships
    client: Client = Relationship(back_populates="investment_accounts")
    
    __table_args__ = (
        Index("ix_investment_accounts_client_id", "client_id"),
        Index("ix_investment_accounts_platform", "platform"),
        Index("ix_investment_accounts_account_number", "account_number"),
    )


class InsurancePolicy(SQLModel, table=True):
    """Insurance policy model for client insurance policies."""
    
    __tablename__ = "insurance_policies"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    policy_number: str = Field(max_length=100, unique=True, index=True)
    insurance_type: str = Field(max_length=100)  # e.g., "Seguro de Vida", "Seguro de Retiro"
    premium_amount: Decimal = Field(
        sa_column=Column(Numeric(15, 2), nullable=False),
        description="Monthly/Annual premium amount"
    )
    coverage_amount: Decimal = Field(
        sa_column=Column(Numeric(15, 2), nullable=False),
        description="Total coverage amount"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    )
    
    # Foreign key to Client
    client_id: int = Field(foreign_key="clients.id")
    
    # Relationships
    client: Client = Relationship(back_populates="insurance_policies")
    
    __table_args__ = (
        Index("ix_insurance_policies_policy_number", "policy_number"),
        Index("ix_insurance_policies_client_id", "client_id"),
        Index("ix_insurance_policies_insurance_type", "insurance_type"),
    )


class Notification(SQLModel, table=True):
    """Notification model for user notifications system."""
    
    __tablename__ = "notifications"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    message: str = Field(max_length=500, description="Notification message content")
    is_read: bool = Field(default=False, description="Whether the notification has been read")
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, index=True)
    )
    
    # Foreign key to User
    user_id: int = Field(foreign_key="users.id", index=True)
    
    # Relationships
    user: User = Relationship()
    
    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_is_read", "is_read"),
        Index("ix_notifications_created_at", "created_at"),
    )


class ModelPortfolio(SQLModel, table=True):
    """Model portfolio templates for standardizing investment strategies."""
    
    __tablename__ = "model_portfolios"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, description="Portfolio template name (e.g., 'Cartera Conservadora')")
    description: Optional[str] = Field(default=None, max_length=500, description="Optional description of the portfolio strategy")
    risk_profile: RiskProfile = Field(
        sa_column=Column(Enum(RiskProfile), nullable=False),
        description="Risk profile this portfolio is designed for"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    )
    
    # Relationships
    positions: List["ModelPortfolioPosition"] = Relationship(back_populates="model_portfolio")
    
    __table_args__ = (
        Index("ix_model_portfolios_name", "name"),
        Index("ix_model_portfolios_risk_profile", "risk_profile"),
    )


class ModelPortfolioPosition(SQLModel, table=True):
    """Position within a model portfolio defining asset allocation weights."""
    
    __tablename__ = "model_portfolio_positions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    weight: Decimal = Field(
        sa_column=Column(Numeric(5, 4), nullable=False),
        description="Allocation weight as decimal (e.g., 0.6000 for 60%)",
        ge=0.0,
        le=1.0
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow)
    )
    
    # Foreign keys
    model_portfolio_id: int = Field(foreign_key="model_portfolios.id")
    asset_id: int = Field(foreign_key="assets.id")
    
    # Relationships
    model_portfolio: ModelPortfolio = Relationship(back_populates="positions")
    asset: Asset = Relationship()
    
    __table_args__ = (
        Index("ix_model_portfolio_positions_model_portfolio_id", "model_portfolio_id"),
        Index("ix_model_portfolio_positions_asset_id", "asset_id"),
        # Ensure no duplicate asset per model portfolio
        Index("uq_model_portfolio_asset", "model_portfolio_id", "asset_id", unique=True),
    ) 