"""
Base repository class providing common database operations.
"""

from typing import Generic, TypeVar, Optional, List, Type
from sqlmodel import Session, SQLModel, select, func


T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    """
    Base repository class providing common CRUD operations.
    
    This class should be inherited by specific repository classes
    to provide type-safe database operations.
    """
    
    def __init__(self, session: Session, model_class: Type[T]):
        """
        Initialize the base repository.
        
        Args:
            session: Database session
            model_class: SQLModel class for this repository
        """
        self.session = session
        self.model_class = model_class
    
    def get_by_id(self, entity_id: int) -> Optional[T]:
        """
        Get an entity by its ID.
        
        Args:
            entity_id: The ID of the entity to retrieve
            
        Returns:
            The entity if found, None otherwise
        """
        return self.session.get(self.model_class, entity_id)
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """
        Get all entities with pagination.
        
        Args:
            skip: Number of entities to skip
            limit: Maximum number of entities to return
            
        Returns:
            List of entities
        """
        statement = select(self.model_class).offset(skip).limit(limit)
        return list(self.session.exec(statement).all())
    
    def create(self, entity: T) -> T:
        """
        Create a new entity in the database.
        
        Args:
            entity: The entity to create
            
        Returns:
            The created entity with database-generated fields populated
        """
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity
    
    def update(self, entity: T) -> T:
        """
        Update an existing entity in the database.
        
        Args:
            entity: The entity to update
            
        Returns:
            The updated entity
        """
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity
    
    def delete(self, entity: T) -> T:
        """
        Delete an entity from the database.
        
        Args:
            entity: The entity to delete
            
        Returns:
            The deleted entity
        """
        self.session.delete(entity)
        self.session.commit()
        return entity
    
    def count(self) -> int:
        """
        Count the total number of entities.
        
        Returns:
            Total count of entities
        """
        statement = select(func.count()).select_from(self.model_class)
        return self.session.exec(statement).one()
    
    def exists(self, entity_id: int) -> bool:
        """
        Check if an entity exists by ID.
        
        Args:
            entity_id: The ID to check
            
        Returns:
            True if entity exists, False otherwise
        """
        return self.get_by_id(entity_id) is not None 