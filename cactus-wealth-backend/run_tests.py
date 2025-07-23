import os
import sys

from sqlmodel import SQLModel

# Set test database URL before any import
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from cactus_wealth.database import engine

# Clean and create tables before any app/model import
if os.path.exists("./test.db"):
    os.remove("./test.db")
SQLModel.metadata.create_all(engine)

# Now run pytest
import pytest

sys.exit(pytest.main(["tests"]))
