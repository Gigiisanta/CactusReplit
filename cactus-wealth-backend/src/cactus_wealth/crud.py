from typing import Optional

from cactus_wealth.models import (
    Asset,
    Client,
    ClientActivity,
    InsurancePolicy,
    InvestmentAccount,
    ModelPortfolio,
    ModelPortfolioPosition,
    User,
)
from cactus_wealth.schemas import (
    ClientActivityCreate,
    ClientCreate,
    ClientUpdate,
    InsurancePolicyCreate,
    InsurancePolicyUpdate,
    InvestmentAccountCreate,
    InvestmentAccountUpdate,
    UserCreate,
    ModelPortfolioCreate,
    ModelPortfolioUpdate,
    ModelPortfolioPositionCreate,
    ModelPortfolioPositionUpdate,
    ClientNoteCreate,
    ClientNoteUpdate,
)
from cactus_wealth.models import ClientNote
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select


def get_user_by_email(session: Session, email: str) -> User | None:
    """Get a user by email."""
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def get_user_by_username(session: Session, username: str) -> User | None:
    """Get a user by username."""
    statement = select(User).where(User.username == username)
    return session.exec(statement).first()


def get_user_by_id(session: Session, user_id: int) -> User | None:
    """Get a user by ID."""
    return session.get(User, user_id)


def create_user(session: Session, user_create: UserCreate) -> User:
    """Create a new user."""
    from cactus_wealth.security import get_password_hash

    # Check if user already exists by email
    existing_user_email = get_user_by_email(session=session, email=user_create.email)
    if existing_user_email:
        raise ValueError(f"User with email {user_create.email} already exists")

    # Check if user already exists by username
    existing_user_username = get_user_by_username(
        session=session, username=user_create.username
    )
    if existing_user_username:
        raise ValueError(f"User with username {user_create.username} already exists")

    # Create new user with hashed password
    hashed_password = get_password_hash(user_create.password)
    db_user = User(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed_password,
        role=user_create.role,
        is_active=True,
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


# ============ CLIENT CRUD OPERATIONS ============


def get_client(session: Session, client_id: int, owner_id: int) -> Client | None:
    """Get a specific client by ID, ensuring it belongs to the owner."""
    statement = select(Client).where(
        Client.id == client_id, Client.owner_id == owner_id
    )
    return session.exec(statement).first()


def get_clients_by_user(
    session: Session, owner_id: int, skip: int = 0, limit: int = 100
) -> list[Client]:
    """Get all clients belonging to a specific user (advisor) with related data."""
    statement = (
        select(Client)
        .where(Client.owner_id == owner_id)
        .options(
            selectinload(Client.investment_accounts),
            selectinload(Client.insurance_policies),
            selectinload(Client.referred_clients),
        )
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def create_client(session: Session, client: ClientCreate, owner_id: int) -> Client:
    """Create a new client for the specified owner."""
    # Check if client email already exists
    existing_client = session.exec(
        select(Client).where(Client.email == client.email)
    ).first()
    if existing_client:
        raise ValueError(f"Client with email {client.email} already exists")

    # Create new client
    db_client = Client(
        first_name=client.first_name,
        last_name=client.last_name,
        email=client.email,
        risk_profile=client.risk_profile,
        status=client.status,
        lead_source=client.lead_source,
        notes=client.notes,
        referred_by_client_id=client.referred_by_client_id,
        owner_id=owner_id,
    )

    session.add(db_client)
    session.commit()
    session.refresh(db_client)

    # Emit sync event asincrónicamente
    import asyncio
    from cactus_wealth.services import sync_service
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(sync_service.client_created(db_client))
    except RuntimeError:
        asyncio.run(sync_service.client_created(db_client))

    return db_client


def update_client(
    session: Session, client_id: int, client_update: ClientUpdate, owner_id: int
) -> Client | None:
    """Update a client, ensuring it belongs to the owner."""
    # Get the client ensuring ownership
    db_client = get_client(session=session, client_id=client_id, owner_id=owner_id)
    if not db_client:
        return None

    # Store old status for activity logging
    old_status = db_client.status.value if db_client.status else None

    # Check if email update would conflict with existing client
    if client_update.email and client_update.email != db_client.email:
        existing_client = session.exec(
            select(Client).where(Client.email == client_update.email)
        ).first()
        if existing_client:
            raise ValueError(f"Client with email {client_update.email} already exists")

    # Update fields that are provided
    update_data = client_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client, field, value)

    session.add(db_client)
    session.commit()
    session.refresh(db_client)

    # Log status change if status was updated
    if client_update.status and old_status and client_update.status.value != old_status:
        log_client_status_change(
            session=session,
            client_id=client_id,
            old_status=old_status,
            new_status=client_update.status.value,
            created_by=owner_id,
        )

    # Emit sync event asincrónicamente
    import asyncio
    from cactus_wealth.services import sync_service
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(sync_service.client_updated(db_client))
    except RuntimeError:
        asyncio.run(sync_service.client_updated(db_client))

    return db_client


def remove_client(session: Session, client_id: int, owner_id: int) -> Client | None:
    """Remove a client, ensuring it belongs to the owner."""
    # Get the client ensuring ownership
    db_client = get_client(session=session, client_id=client_id, owner_id=owner_id)
    if not db_client:
        return None

    session.delete(db_client)
    session.commit()
    return db_client


# ============ INVESTMENT ACCOUNT CRUD OPERATIONS ============


def create_client_investment_account(
    session: Session, account_data: InvestmentAccountCreate, client_id: int
) -> InvestmentAccount:
    """Create a new investment account for a specific client."""
    db_account = InvestmentAccount(
        platform=account_data.platform,
        account_number=account_data.account_number,
        aum=account_data.aum,
        client_id=client_id,
    )

    session.add(db_account)
    session.commit()
    session.refresh(db_account)
    return db_account


def get_investment_account(
    session: Session, account_id: int
) -> InvestmentAccount | None:
    """Get an investment account by ID."""
    return session.get(InvestmentAccount, account_id)


def get_investment_accounts_by_client(
    session: Session, client_id: int, skip: int = 0, limit: int = 100
) -> list[InvestmentAccount]:
    """Get all investment accounts for a specific client."""
    statement = (
        select(InvestmentAccount)
        .where(InvestmentAccount.client_id == client_id)
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_investment_account(
    session: Session,
    account_db_obj: InvestmentAccount,
    update_data: InvestmentAccountUpdate,
) -> InvestmentAccount:
    """Update an investment account."""
    update_fields = update_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(account_db_obj, field, value)

    session.add(account_db_obj)
    session.commit()
    session.refresh(account_db_obj)
    return account_db_obj


def delete_investment_account(
    session: Session, account_id: int
) -> InvestmentAccount | None:
    """Delete an investment account by ID."""
    db_account = session.get(InvestmentAccount, account_id)
    if not db_account:
        return None

    session.delete(db_account)
    session.commit()
    return db_account


# ============ INSURANCE POLICY CRUD OPERATIONS ============


def create_client_insurance_policy(
    session: Session, policy_data: InsurancePolicyCreate, client_id: int
) -> InsurancePolicy:
    """Create a new insurance policy for a specific client."""
    # Check if policy number already exists
    existing_policy = session.exec(
        select(InsurancePolicy).where(
            InsurancePolicy.policy_number == policy_data.policy_number
        )
    ).first()
    if existing_policy:
        raise ValueError(
            f"Insurance policy with number {policy_data.policy_number} already exists"
        )

    db_policy = InsurancePolicy(
        policy_number=policy_data.policy_number,
        insurance_type=policy_data.insurance_type,
        premium_amount=policy_data.premium_amount,
        coverage_amount=policy_data.coverage_amount,
        client_id=client_id,
    )

    session.add(db_policy)
    session.commit()
    session.refresh(db_policy)
    return db_policy


def get_insurance_policy(session: Session, policy_id: int) -> InsurancePolicy | None:
    """Get an insurance policy by ID."""
    return session.get(InsurancePolicy, policy_id)


def get_insurance_policies_by_client(
    session: Session, client_id: int, skip: int = 0, limit: int = 100
) -> list[InsurancePolicy]:
    """Get all insurance policies for a specific client."""
    statement = (
        select(InsurancePolicy)
        .where(InsurancePolicy.client_id == client_id)
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_insurance_policy(
    session: Session, policy_db_obj: InsurancePolicy, update_data: InsurancePolicyUpdate
) -> InsurancePolicy:
    """Update an insurance policy."""
    # Check if policy number update would conflict with existing policy
    if (
        update_data.policy_number
        and update_data.policy_number != policy_db_obj.policy_number
    ):
        existing_policy = session.exec(
            select(InsurancePolicy).where(
                InsurancePolicy.policy_number == update_data.policy_number
            )
        ).first()
        if existing_policy:
            raise ValueError(
                f"Insurance policy with number {update_data.policy_number} already exists"
            )

    update_fields = update_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(policy_db_obj, field, value)

    session.add(policy_db_obj)
    session.commit()
    session.refresh(policy_db_obj)
    return policy_db_obj


def delete_insurance_policy(session: Session, policy_id: int) -> InsurancePolicy | None:
    """Delete an insurance policy by ID."""
    policy = session.get(InsurancePolicy, policy_id)
    if not policy:
        return None

    session.delete(policy)
    session.commit()
    return policy


# ============ MODEL PORTFOLIO CRUD OPERATIONS ============


def get_model_portfolios(
    session: Session, skip: int = 0, limit: int = 100
) -> list["ModelPortfolio"]:
    """Get all model portfolios with their positions."""
    from cactus_wealth.models import ModelPortfolio, ModelPortfolioPosition

    statement = (
        select(ModelPortfolio)
        .options(
            selectinload(ModelPortfolio.positions).selectinload(
                ModelPortfolioPosition.asset
            )
        )
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_model_portfolio(
    session: Session, portfolio_id: int
) -> Optional["ModelPortfolio"]:
    """Get a specific model portfolio by ID with positions."""
    from cactus_wealth.models import ModelPortfolio, ModelPortfolioPosition

    statement = (
        select(ModelPortfolio)
        .where(ModelPortfolio.id == portfolio_id)
        .options(
            selectinload(ModelPortfolio.positions).selectinload(
                ModelPortfolioPosition.asset
            )
        )
    )
    return session.exec(statement).first()


def create_model_portfolio(
    session: Session, portfolio_data: "ModelPortfolioCreate"
) -> "ModelPortfolio":
    """Create a new model portfolio."""
    from cactus_wealth.models import ModelPortfolio

    # Check if portfolio name already exists
    existing_portfolio = session.exec(
        select(ModelPortfolio).where(ModelPortfolio.name == portfolio_data.name)
    ).first()
    if existing_portfolio:
        raise ValueError(
            f"Model portfolio with name '{portfolio_data.name}' already exists"
        )

    db_portfolio = ModelPortfolio(
        name=portfolio_data.name,
        description=portfolio_data.description,
        risk_profile=portfolio_data.risk_profile,
    )

    session.add(db_portfolio)
    session.commit()
    session.refresh(db_portfolio)
    return db_portfolio


def update_model_portfolio(
    session: Session, portfolio_id: int, portfolio_update: "ModelPortfolioUpdate"
) -> Optional["ModelPortfolio"]:
    """Update a model portfolio."""
    from cactus_wealth.models import ModelPortfolio

    db_portfolio = session.get(ModelPortfolio, portfolio_id)
    if not db_portfolio:
        return None

    # Check if name update would conflict
    if portfolio_update.name and portfolio_update.name != db_portfolio.name:
        existing_portfolio = session.exec(
            select(ModelPortfolio).where(ModelPortfolio.name == portfolio_update.name)
        ).first()
        if existing_portfolio:
            raise ValueError(
                f"Model portfolio with name '{portfolio_update.name}' already exists"
            )

    # Update fields that are provided
    update_data = portfolio_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_portfolio, field, value)

    session.add(db_portfolio)
    session.commit()
    session.refresh(db_portfolio)
    return db_portfolio


def delete_model_portfolio(
    session: Session, portfolio_id: int
) -> Optional["ModelPortfolio"]:
    """
    Deletes a model portfolio after eagerly loading its positions and their assets.
    """
    # Eagerly load positions and their related assets to avoid DetachedInstanceError
    # when the object is returned after being deleted from the session.
    statement = (
        select(ModelPortfolio)
        .where(ModelPortfolio.id == portfolio_id)
        .options(
            selectinload(ModelPortfolio.positions).selectinload(
                ModelPortfolioPosition.asset
            )
        )
    )

    portfolio_to_delete = session.exec(statement).first()

    if not portfolio_to_delete:
        return None

    # Now that the object and its relationships are fully loaded, delete it.
    session.delete(portfolio_to_delete)
    session.commit()

    return portfolio_to_delete


def create_model_portfolio_position(
    session: Session, position_data: "ModelPortfolioPositionCreate", portfolio_id: int
) -> "ModelPortfolioPosition":
    """Create a new position in a model portfolio."""
    # Verify portfolio exists
    from cactus_wealth.models import Asset, ModelPortfolio, ModelPortfolioPosition

    portfolio = session.get(ModelPortfolio, portfolio_id)
    if not portfolio:
        raise ValueError(f"Model portfolio with ID {portfolio_id} not found")

    # Verify asset exists
    asset = session.get(Asset, position_data.asset_id)
    if not asset:
        raise ValueError(f"Asset with ID {position_data.asset_id} not found")

    # Check if position already exists for this asset in this portfolio
    existing_position = session.exec(
        select(ModelPortfolioPosition).where(
            ModelPortfolioPosition.model_portfolio_id == portfolio_id,
            ModelPortfolioPosition.asset_id == position_data.asset_id,
        )
    ).first()
    if existing_position:
        raise ValueError(
            f"Position for asset '{asset.ticker_symbol}' already exists in this portfolio"
        )

    # Create new position
    db_position = ModelPortfolioPosition(
        weight=position_data.weight,
        model_portfolio_id=portfolio_id,
        asset_id=position_data.asset_id,
    )

    session.add(db_position)
    session.commit()
    session.refresh(db_position)
    return db_position


def update_model_portfolio_position(
    session: Session, position_id: int, position_update: "ModelPortfolioPositionUpdate"
) -> Optional["ModelPortfolioPosition"]:
    """Update a model portfolio position."""
    from cactus_wealth.models import ModelPortfolioPosition

    db_position = session.get(ModelPortfolioPosition, position_id)
    if not db_position:
        return None

    # Update fields that are provided
    update_data = position_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_position, field, value)

    session.add(db_position)
    session.commit()
    session.refresh(db_position)
    return db_position


def delete_model_portfolio_position(
    session: Session, position_id: int
) -> Optional["ModelPortfolioPosition"]:
    """Delete a model portfolio position."""
    from cactus_wealth.models import ModelPortfolioPosition

    db_position = session.get(ModelPortfolioPosition, position_id)
    if not db_position:
        return None

    session.delete(db_position)
    session.commit()
    return db_position


def get_model_portfolio_total_weight(session: Session, portfolio_id: int) -> float:
    """Calculate the total weight of all positions in a model portfolio."""
    from cactus_wealth.models import ModelPortfolioPosition
    from sqlalchemy import func

    result = session.exec(
        select(func.sum(ModelPortfolioPosition.weight)).where(
            ModelPortfolioPosition.model_portfolio_id == portfolio_id
        )
    ).first()

    return float(result) if result else 0.0


# ============ ASSET SEARCH CRUD OPERATIONS ============


def search_assets_in_db(session: Session, query: str, limit: int = 10) -> list["Asset"]:
    """Search for assets in local database by ticker or name."""
    from cactus_wealth.models import Asset

    search_pattern = f"%{query.upper()}%"
    statement = (
        select(Asset)
        .where(
            (Asset.ticker_symbol.ilike(search_pattern))
            | (Asset.name.ilike(search_pattern))
        )
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_or_create_asset_from_yfinance(
    session: Session, ticker: str
) -> Optional["Asset"]:
    """Get asset data from yfinance and store in local database if not exists."""
    import yfinance as yf
    from cactus_wealth.models import Asset, AssetType

    try:
        # First check if asset already exists in our database
        existing_asset = session.exec(
            select(Asset).where(Asset.ticker_symbol == ticker.upper())
        ).first()

        if existing_asset:
            return existing_asset

        # Fetch from yfinance
        ticker_obj = yf.Ticker(ticker)
        info = ticker_obj.info

        # Extract asset information
        name = info.get("longName") or info.get("shortName", ticker.upper())
        sector = info.get("sector")

        # Determine asset type based on yfinance info
        asset_type = AssetType.STOCK  # Default
        if "ETF" in name.upper() or info.get("quoteType") == "ETF":
            asset_type = AssetType.ETF
        elif info.get("quoteType") == "BOND":
            asset_type = AssetType.BOND

        # Smart sector handling for ETFs and other assets
        if not sector:
            if asset_type == AssetType.ETF or info.get("quoteType") == "ETF":
                sector = "ETF Diversificado"
            else:
                sector = "Otro"

        # Create new asset
        new_asset = Asset(
            ticker_symbol=ticker.upper(),
            name=name,
            asset_type=asset_type,
            sector=sector,
        )

        session.add(new_asset)
        session.commit()
        session.refresh(new_asset)
        return new_asset

    except Exception:
        # If yfinance fails, return None
        return None


def search_assets(session: Session, query: str, limit: int = 10) -> list["Asset"]:
    """
    Unified asset search function.
    First searches local database, then tries yfinance for new assets.
    """
    # Step 1: Search in local database
    local_results = search_assets_in_db(session, query, limit)

    # Step 2: If query looks like a ticker and we have < limit results, try yfinance
    if (
        len(local_results) < limit
        and len(query) <= 10
        and query.replace(".", "").replace("-", "").isalnum()
    ):
        # Try to fetch from yfinance
        yf_asset = get_or_create_asset_from_yfinance(session, query)
        if yf_asset and yf_asset not in local_results:
            local_results.append(yf_asset)

    return local_results[:limit]


# ============ CLIENT ACTIVITY CRUD OPERATIONS ============


def create_client_activity(
    session: Session, activity_data: ClientActivityCreate, created_by: int
) -> ClientActivity:
    """Create a new client activity entry."""
    from cactus_wealth.models import ClientActivity

    db_activity = ClientActivity(
        client_id=activity_data.client_id,
        activity_type=activity_data.activity_type,
        description=activity_data.description,
        extra_data=activity_data.extra_data,
        created_by=created_by,
    )

    session.add(db_activity)
    session.commit()
    session.refresh(db_activity)
    return db_activity


def get_client_activities(
    session: Session, client_id: int, limit: int = 50, offset: int = 0
) -> list[ClientActivity]:
    """Get activities for a specific client, ordered by most recent first."""
    from cactus_wealth.models import ClientActivity

    statement = (
        select(ClientActivity)
        .where(ClientActivity.client_id == client_id)
        .order_by(ClientActivity.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(session.exec(statement).all())


def log_client_status_change(
    session: Session, client_id: int, old_status: str, new_status: str, created_by: int
) -> ClientActivity:
    """Log a client status change as an activity."""
    from cactus_wealth.models import ActivityType

    activity_data = ClientActivityCreate(
        client_id=client_id,
        activity_type=ActivityType.status_change,
        description=f"Estado cambiado de '{old_status}' a '{new_status}'",
        extra_data=f'{{"old_status": "{old_status}", "new_status": "{new_status}"}}',
    )

    return create_client_activity(session, activity_data, created_by)


def create_client_note(
    session: Session, note_create: "ClientNoteCreate", user_id: int
) -> "ClientNote":
    from .models import ClientNote

    note = ClientNote(
        client_id=note_create.client_id,
        title=note_create.title,
        content=note_create.content,
        created_by=user_id,
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


def get_client_notes(session: Session, client_id: int) -> list["ClientNote"]:
    from .models import ClientNote

    return list(
        session.exec(select(ClientNote).where(ClientNote.client_id == client_id)).all()
    )


def get_client_note(session: Session, note_id: int) -> "ClientNote | None":
    from .models import ClientNote

    return session.get(ClientNote, note_id)


def update_client_note(
    session: Session, note_id: int, note_update: "ClientNoteUpdate"
) -> "ClientNote | None":
    from .models import ClientNote

    note = session.get(ClientNote, note_id)
    if not note:
        return None
    for field, value in note_update.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


def delete_client_note(session: Session, note_id: int) -> bool:
    from .models import ClientNote

    note = session.get(ClientNote, note_id)
    if not note:
        return False
    session.delete(note)
    session.commit()
    return True
