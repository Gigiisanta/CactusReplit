"""add_model_portfolio_functionality

Revision ID: abc123def456
Revises: 5be037e90934
Create Date: 2025-06-30 01:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abc123def456'
down_revision: Union[str, None] = '5be037e90934'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create model_portfolios table
    op.execute("""
        CREATE TABLE model_portfolios (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(500),
            risk_profile riskprofile NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    """)
    
    # Create indexes for model_portfolios
    op.create_index('ix_model_portfolios_name', 'model_portfolios', ['name'])
    op.create_index('ix_model_portfolios_risk_profile', 'model_portfolios', ['risk_profile'])
    
    # Create model_portfolio_positions table
    op.execute("""
        CREATE TABLE model_portfolio_positions (
            id SERIAL PRIMARY KEY,
            weight NUMERIC(5,4) NOT NULL CHECK (weight >= 0 AND weight <= 1),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            model_portfolio_id INTEGER NOT NULL REFERENCES model_portfolios(id),
            asset_id INTEGER NOT NULL REFERENCES assets(id),
            UNIQUE(model_portfolio_id, asset_id)
        );
    """)
    
    # Create indexes for model_portfolio_positions
    op.create_index('ix_model_portfolio_positions_model_portfolio_id', 'model_portfolio_positions', ['model_portfolio_id'])
    op.create_index('ix_model_portfolio_positions_asset_id', 'model_portfolio_positions', ['asset_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes first
    op.drop_index('ix_model_portfolio_positions_asset_id', table_name='model_portfolio_positions')
    op.drop_index('ix_model_portfolio_positions_model_portfolio_id', table_name='model_portfolio_positions')
    op.drop_index('ix_model_portfolios_risk_profile', table_name='model_portfolios')
    op.drop_index('ix_model_portfolios_name', table_name='model_portfolios')
    
    # Drop tables
    op.drop_table('model_portfolio_positions')
    op.drop_table('model_portfolios') 