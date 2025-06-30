"""
Client repository for client-related database operations.
"""

from typing import List, Optional
from sqlmodel import Session, select
from ..models import Client, User, InvestmentAccount, InsurancePolicy
from .base_repository import BaseRepository


class ClientRepository(BaseRepository[Client]):
    """Repository for Client-related database operations."""
    
    def __init__(self, session: Session):
        super().__init__(session, Client)
    
    def get_by_email(self, email: str) -> Optional[Client]:
        """
        Get a client by email address.
        
        Args:
            email: The client's email address
            
        Returns:
            Client if found, None otherwise
        """
        statement = select(Client).where(Client.email == email)
        return self.session.exec(statement).first()
    
    def get_by_advisor(self, advisor_id: int, skip: int = 0, limit: int = 100) -> List[Client]:
        """
        Get all clients for a specific advisor with pagination.
        
        Args:
            advisor_id: The advisor's user ID
            skip: Number of clients to skip
            limit: Maximum number of clients to return
            
        Returns:
            List of clients managed by the advisor
        """
        statement = (
            select(Client)
            .where(Client.owner_id == advisor_id)
            .offset(skip)
            .limit(limit)
            .order_by(Client.created_at.desc())
        )
        return list(self.session.exec(statement).all())
    
    def get_with_products(self, client_id: int) -> Optional[Client]:
        """
        Get a client with all financial products (accounts and policies) loaded.
        
        Args:
            client_id: The client's ID
            
        Returns:
            Client with financial products loaded, or None if not found
        """
        client = self.get_by_id(client_id)
        if client:
            # Load investment accounts
            accounts_statement = (
                select(InvestmentAccount)
                .where(InvestmentAccount.client_id == client_id)
            )
            client.investment_accounts = list(self.session.exec(accounts_statement).all())
            
            # Load insurance policies
            policies_statement = (
                select(InsurancePolicy)
                .where(InsurancePolicy.client_id == client_id)
            )
            client.insurance_policies = list(self.session.exec(policies_statement).all())
        
        return client
    
    def verify_advisor_access(self, client_id: int, advisor_id: int) -> Optional[Client]:
        """
        Verify that an advisor has access to a specific client.
        
        Args:
            client_id: The client's ID
            advisor_id: The advisor's user ID
            
        Returns:
            Client if advisor has access, None otherwise
        """
        statement = (
            select(Client)
            .where(Client.id == client_id)
            .where(Client.owner_id == advisor_id)
        )
        return self.session.exec(statement).first()
    
    def get_investment_accounts(self, client_id: int) -> List[InvestmentAccount]:
        """
        Get all investment accounts for a client.
        
        Args:
            client_id: The client's ID
            
        Returns:
            List of investment accounts
        """
        statement = (
            select(InvestmentAccount)
            .where(InvestmentAccount.client_id == client_id)
        )
        return list(self.session.exec(statement).all())
    
    def get_insurance_policies(self, client_id: int) -> List[InsurancePolicy]:
        """
        Get all insurance policies for a client.
        
        Args:
            client_id: The client's ID
            
        Returns:
            List of insurance policies
        """
        statement = (
            select(InsurancePolicy)
            .where(InsurancePolicy.client_id == client_id)
        )
        return list(self.session.exec(statement).all())
    
    def create_investment_account(self, account: InvestmentAccount) -> InvestmentAccount:
        """
        Create a new investment account for a client.
        
        Args:
            account: The investment account to create
            
        Returns:
            The created investment account
        """
        self.session.add(account)
        self.session.commit()
        self.session.refresh(account)
        return account
    
    def create_insurance_policy(self, policy: InsurancePolicy) -> InsurancePolicy:
        """
        Create a new insurance policy for a client.
        
        Args:
            policy: The insurance policy to create
            
        Returns:
            The created insurance policy
        """
        self.session.add(policy)
        self.session.commit()
        self.session.refresh(policy)
        return policy
    
    def get_account_by_id(self, account_id: int) -> Optional[InvestmentAccount]:
        """
        Get an investment account by ID.
        
        Args:
            account_id: The account's ID
            
        Returns:
            Investment account if found, None otherwise
        """
        return self.session.get(InvestmentAccount, account_id)
    
    def get_policy_by_id(self, policy_id: int) -> Optional[InsurancePolicy]:
        """
        Get an insurance policy by ID.
        
        Args:
            policy_id: The policy's ID
            
        Returns:
            Insurance policy if found, None otherwise
        """
        return self.session.get(InsurancePolicy, policy_id) 