# Cactus Wealth Backend

Backend API for the Cactus Wealth Dashboard - A financial advisor platform designed to streamline administrative tasks and enhance client recommendations.

## Tech Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **SQLModel** - SQL databases in Python, designed by the creator of FastAPI
- **Pydantic Settings** - Settings management using environment variables
- **Python 3.11+** - Latest Python features and performance improvements

## Quick Start

1. Install dependencies using Poetry:
   ```bash
   poetry install
   ```

2. Activate the virtual environment:
   ```bash
   poetry shell
   ```

3. Run the development server:
   ```bash
   python main.py
   ```

4. Visit http://localhost:8000/docs for the interactive API documentation.

## API Endpoints

- `GET /api/v1/health` - Health check endpoint

## Project Structure

```
cactus-wealth-backend/
├── src/
│   └── cactus_wealth/
│       ├── api/
│       │   └── v1/
│       │       ├── endpoints/
│       │       └── api.py
│       └── core/
│           └── config.py
├── main.py
└── pyproject.toml
``` 