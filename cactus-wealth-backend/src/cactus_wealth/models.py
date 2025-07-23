"""
SQLModel definitions for the Cactus Wealth application.
"""

import enum
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import Column, DateTime, Enum, Index
from sqlmodel import Field, Relationship, SQLModel


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

    prospect = "prospect"  # Prospecto
    contacted = "contacted"  # Contactado
    first_meeting = "first_meeting"  # Primera Reunión
    second_meeting = "second_meeting"  # Segunda Reunión
    opening = "opening"  # Apertura
    onboarding = "onboarding"  # Proceso de Onboarding
    reschedule = "reschedule"  # Reagendar
    active_investor = "active_investor"  # Cliente Activo - Invirtiendo
    active_insured = "active_insured"  # Cliente Activo - Asegurado
    dormant = "dormant"  # Inactivo


class LeadSource(str, enum.Enum):
    """Lead source classification."""

    referral = "referral"
    social_media = "social_media"  # 'Redes'
    event = "event"
    organic = "organic"
    other = "other"


class ActivityType(str, enum.Enum):
    """Activity type classification for client timeline."""

    status_change = "status_change"
    note_added = "note_added"
    meeting_scheduled = "meeting_scheduled"
    meeting_completed = "meeting_completed"
    proposal_sent = "proposal_sent"
    document_uploaded = "document_uploaded"
    call_made = "call_made"
    email_sent = "email_sent"


class User(SQLModel, table=True):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, max_length=255)
    username: str = Field(unique=True, max_length=100)
    hashed_password: str = Field(max_length=255)
    is_active: bool = Field(default=True)
    role: UserRole = Field(sa_column=Column(Enum(UserRole), nullable=False))
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow),
    )

    # Relationship with clients
    clients: List["Client"] = Relationship(back_populates="owner")

    __table_args__ = (
        Index("ix_users_username", "username"),
        Index("ix_users_email", "email"),
        Index("ix_users_role", "role"),
        Index("ix_users_is_active", "is_active"),
        Index("ix_users_created_at", "created_at"),
        Index(
            "ix_users_email_role", "email", "role"
        ),  # Composite index for auth queries
    )


class Client(SQLModel, table=True):
    """Client model for CRM functionality."""

    __tablename__ = "clients"

    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(unique=True, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    risk_profile: RiskProfile = Field(
        sa_column=Column(Enum(RiskProfile), nullable=False)
    )

    # New CRM fields
    status: ClientStatus = Field(
        sa_column=Column(Enum(ClientStatus), nullable=False),
        default=ClientStatus.prospect,
    )
    lead_source: Optional[LeadSource] = Field(
        sa_column=Column(Enum(LeadSource), nullable=True), default=None
    )
    notes: Optional[str] = Field(default=None, max_length=2000)
    live_notes: Optional[str] = Field(default=None, max_length=10000)
    portfolio_name: Optional[str] = Field(default=None, max_length=100)
    referred_by_client_id: Optional[int] = Field(default=None, foreign_key="clients.id")

    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow),
    )

    # Foreign key relationships
    owner_id: int = Field(foreign_key="users.id")
    owner: User = Relationship(back_populates="clients")

    # Relationships
    investment_accounts: List["InvestmentAccount"] = Relationship(
        back_populates="client"
    )
    insurance_policies: List["InsurancePolicy"] = Relationship(back_populates="client")
    portfolios: List["Portfolio"] = Relationship(back_populates="client")
    activities: List["ClientActivity"] = Relationship(back_populates="client")
    notes_list: List["ClientNote"] = Relationship(back_populates="client")

    # Self-referencing relationship for referrals
    referred_clients: List["Client"] = Relationship(
        back_populates="referred_by",
        sa_relationship_kwargs={
            "foreign_keys": "Client.referred_by_client_id",
        },
    )
    referred_by: Optional["Client"] = Relationship(
        back_populates="referred_clients",
        sa_relationship_kwargs={
            "foreign_keys": "Client.referred_by_client_id",
            "remote_side": "Client.id",
        },
    )

    __table_args__ = (
        Index("ix_clients_email", "email"),
        Index("ix_clients_owner_id", "owner_id"),
        Index("ix_clients_status", "status"),
        Index("ix_clients_risk_profile", "risk_profile"),
        Index("ix_clients_created_at", "created_at"),
        Index("ix_clients_updated_at", "updated_at"),
        Index(
            "ix_clients_owner_status", "owner_id", "status"
        ),  # Composite index for dashboard queries
        Index(
            "ix_clients_email_owner", "email", "owner_id"
        ),  # Composite index for auth queries
    )


class ClientActivity(SQLModel, table=True):
    """Client activity model for tracking client interactions."""

    __tablename__ = "client_activities"

    id: Optional[int] = Field(default=None, primary_key=True)
    activity_type: str = Field(max_length=100)
    description: str = Field(max_length=1000)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )

    # Foreign key relationships
    client_id: int = Field(foreign_key="clients.id")
    client: Client = Relationship(back_populates="activities")

    created_by: int = Field(foreign_key="users.id")

    __table_args__ = (
        Index("ix_client_activities_client_id", "client_id"),
        Index("ix_client_activities_created_by", "created_by"),
        Index("ix_client_activities_created_at", "created_at"),
        Index("ix_client_activities_type", "activity_type"),
        Index(
            "ix_client_activities_client_created", "client_id", "created_at"
        ),  # Composite index for timeline queries
    )


class ClientNote(SQLModel, table=True):
    """Client note model for detailed client notes."""

    __tablename__ = "client_notes"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    content: str = Field(max_length=10000)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow),
    )

    # Foreign key relationships
    client_id: int = Field(foreign_key="clients.id")
    client: Client = Relationship(back_populates="notes_list")

    created_by: int = Field(foreign_key="users.id")

    __table_args__ = (
        Index("ix_client_notes_client_id", "client_id"),
        Index("ix_client_notes_created_by", "created_by"),
        Index("ix_client_notes_created_at", "created_at"),
        Index("ix_client_notes_updated_at", "updated_at"),
        Index(
            "ix_client_notes_client_created", "client_id", "created_at"
        ),  # Composite index for recent notes
    )


class Asset(SQLModel, table=True):
    """Asset model for tradeable securities."""

    __tablename__ = "assets"

    id: Optional[int] = Field(default=None, primary_key=True)
    ticker_symbol: str = Field(unique=True, max_length=20)
    name: str = Field(max_length=200)
    asset_type: AssetType = Field(sa_column=Column(Enum(AssetType), nullable=False))
    sector: Optional[str] = Field(default=None, max_length=100)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )

    # Relationship with positions
    positions: List["Position"] = Relationship(back_populates="asset")

    __table_args__ = (
        Index("ix_assets_ticker_symbol", "ticker_symbol"),
        Index("ix_assets_asset_type", "asset_type"),
        Index("ix_assets_sector", "sector"),
        Index("ix_assets_name", "name"),  # Full-text search index
        Index(
            "ix_assets_ticker_name", "ticker_symbol", "name"
        ),  # Composite index for search
    )


class Portfolio(SQLModel, table=True):
    """Portfolio model for client investment portfolios."""

    __tablename__ = "portfolios"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    current_value: Decimal = Field(
        default=Decimal("0"), max_digits=15, decimal_places=2
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow),
    )

    # Foreign key relationships
    client_id: int = Field(foreign_key="clients.id")
    client: Client = Relationship(back_populates="portfolios")

    # Relationships
    positions: List["Position"] = Relationship(back_populates="portfolio")
    snapshots: List["PortfolioSnapshot"] = Relationship(back_populates="portfolio")

    __table_args__ = (
        Index("ix_portfolios_client_id", "client_id"),
        Index("ix_portfolios_current_value", "current_value"),
        Index("ix_portfolios_created_at", "created_at"),
        Index("ix_portfolios_updated_at", "updated_at"),
        Index(
            "ix_portfolios_client_value", "client_id", "current_value"
        ),  # Composite index for AUM queries
    )


class Position(SQLModel, table=True):
    """Position model for individual holdings in portfolios."""

    __tablename__ = "positions"

    id: Optional[int] = Field(default=None, primary_key=True)
    quantity: Decimal = Field(max_digits=15, decimal_places=6)
    purchase_price: Decimal = Field(max_digits=10, decimal_places=2)
    average_price: Decimal = Field(max_digits=10, decimal_places=2)
    current_price: Decimal = Field(max_digits=10, decimal_places=2)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow),
    )

    # Foreign key relationships
    portfolio_id: int = Field(foreign_key="portfolios.id")
    portfolio: Portfolio = Relationship(back_populates="positions")

    asset_id: int = Field(foreign_key="assets.id")
    asset: Asset = Relationship(back_populates="positions")

    __table_args__ = (
        Index("ix_positions_portfolio_id", "portfolio_id"),
        Index("ix_positions_asset_id", "asset_id"),
        Index(
            "ix_positions_portfolio_asset", "portfolio_id", "asset_id"
        ),  # Composite index for portfolio queries
        Index("ix_positions_current_price", "current_price"),
    )


class PortfolioSnapshot(SQLModel, table=True):
    """Portfolio snapshot for historical tracking."""

    __tablename__ = "portfolio_snapshots"

    id: Optional[int] = Field(default=None, primary_key=True)
    value: Decimal = Field(max_digits=15, decimal_places=2)
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )

    # Foreign key relationships
    portfolio_id: int = Field(foreign_key="portfolios.id")
    portfolio: Portfolio = Relationship(back_populates="snapshots")

    __table_args__ = (
        Index("ix_portfolio_snapshots_portfolio_id", "portfolio_id"),
        Index("ix_portfolio_snapshots_timestamp", "timestamp"),
        Index(
            "ix_portfolio_snapshots_portfolio_timestamp", "portfolio_id", "timestamp"
        ),  # Composite index for history queries
    )


class Report(SQLModel, table=True):
    """Report model for generated client reports."""

    __tablename__ = "reports"

    id: Optional[int] = Field(default=None, primary_key=True)
    file_path: str = Field(max_length=500)
    report_type: str = Field(max_length=50, default="PORTFOLIO_SUMMARY")
    generated_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )

    # Foreign key relationships
    client_id: int = Field(foreign_key="clients.id")
    advisor_id: int = Field(foreign_key="users.id")

    __table_args__ = (
        Index("ix_reports_client_id", "client_id"),
        Index("ix_reports_advisor_id", "advisor_id"),
        Index("ix_reports_generated_at", "generated_at"),
        Index(
            "ix_reports_client_advisor", "client_id", "advisor_id"
        ),  # Composite index for report queries
    )


class InvestmentAccount(SQLModel, table=True):
    """Investment account model for client financial products."""

    __tablename__ = "investment_accounts"

    id: Optional[int] = Field(default=None, primary_key=True)
    platform: str = Field(max_length=100)
    account_number: str = Field(max_length=100)
    aum: Decimal = Field(max_digits=15, decimal_places=2)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow),
    )

    # Foreign key relationships
    client_id: int = Field(foreign_key="clients.id")
    client: Client = Relationship(back_populates="investment_accounts")

    __table_args__ = (
        Index("ix_investment_accounts_client_id", "client_id"),
        Index("ix_investment_accounts_platform", "platform"),
        Index("ix_investment_accounts_aum", "aum"),
        Index(
            "ix_investment_accounts_client_platform", "client_id", "platform"
        ),  # Composite index for account queries
    )


class InsurancePolicy(SQLModel, table=True):
    """Insurance policy model for client insurance products."""

    __tablename__ = "insurance_policies"

    id: Optional[int] = Field(default=None, primary_key=True)
    policy_number: str = Field(unique=True, max_length=100)
    insurance_type: str = Field(max_length=100)
    coverage_amount: Decimal = Field(max_digits=15, decimal_places=2)
    premium_amount: Decimal = Field(max_digits=10, decimal_places=2)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow),
    )

    # Foreign key relationships
    client_id: int = Field(foreign_key="clients.id")
    client: Client = Relationship(back_populates="insurance_policies")

    __table_args__ = (
        Index("ix_insurance_policies_client_id", "client_id"),
        Index("ix_insurance_policies_policy_number", "policy_number"),
        Index("ix_insurance_policies_insurance_type", "insurance_type"),
        Index("ix_insurance_policies_coverage_amount", "coverage_amount"),
        Index(
            "ix_insurance_policies_client_type", "client_id", "insurance_type"
        ),  # Composite index for policy queries
    )


class Notification(SQLModel, table=True):
    """Notification model for user notifications."""

    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    message: str = Field(max_length=500)
    is_read: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )

    # Foreign key relationships
    user_id: int = Field(foreign_key="users.id")

    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_is_read", "is_read"),
        Index("ix_notifications_created_at", "created_at"),
        Index(
            "ix_notifications_user_read", "user_id", "is_read"
        ),  # Composite index for notification queries
    )


class ModelPortfolio(SQLModel, table=True):
    """Model portfolio for portfolio templates."""

    __tablename__ = "model_portfolios"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    risk_profile: RiskProfile = Field(
        sa_column=Column(Enum(RiskProfile), nullable=False)
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, onupdate=datetime.utcnow),
    )

    # Relationships
    positions: List["ModelPortfolioPosition"] = Relationship(back_populates="portfolio")

    __table_args__ = (
        Index("ix_model_portfolios_name", "name"),
        Index("ix_model_portfolios_risk_profile", "risk_profile"),
        Index("ix_model_portfolios_created_at", "created_at"),
        Index(
            "ix_model_portfolios_risk_name", "risk_profile", "name"
        ),  # Composite index for model portfolio queries
    )


class ModelPortfolioPosition(SQLModel, table=True):
    """Model portfolio position for portfolio templates."""

    __tablename__ = "model_portfolio_positions"

    id: Optional[int] = Field(default=None, primary_key=True)
    weight: Decimal = Field(max_digits=5, decimal_places=4)  # Percentage as decimal
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )

    # Foreign key relationships
    model_portfolio_id: int = Field(foreign_key="model_portfolios.id")
    portfolio: ModelPortfolio = Relationship(back_populates="positions")

    asset_id: int = Field(foreign_key="assets.id")
    asset: Asset = Relationship()

    __table_args__ = (
        Index("ix_model_portfolio_positions_model_portfolio_id", "model_portfolio_id"),
        Index("ix_model_portfolio_positions_asset_id", "asset_id"),
        Index(
            "ix_model_portfolio_positions_portfolio_asset", "model_portfolio_id", "asset_id"
        ),  # Composite index for queries
    )
