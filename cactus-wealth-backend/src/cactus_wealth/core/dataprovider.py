import logging
from abc import ABC, abstractmethod

import yfinance as yf

logger = logging.getLogger(__name__)


class MarketDataProvider(ABC):
    """Abstract base class for market data providers."""

    @abstractmethod
    def get_current_price(self, ticker: str) -> float:
        """
        Get the current price for a given ticker symbol.

        Args:
            ticker: The ticker symbol (e.g., 'AAPL', 'MSFT')

        Returns:
            Current price as float

        Raises:
            ValueError: If ticker is not found or invalid
            Exception: For other market data retrieval errors
        """
        pass


class YahooFinanceProvider(MarketDataProvider):
    """Yahoo Finance implementation of MarketDataProvider."""

    def get_current_price(self, ticker: str) -> float:
        """
        Get the current price from Yahoo Finance.

        Args:
            ticker: The ticker symbol

        Returns:
            Most recent closing price

        Raises:
            ValueError: If ticker is not found or invalid
            Exception: For network or other retrieval errors
        """
        try:
            # Create ticker object
            stock = yf.Ticker(ticker)

            # Get recent data (last 5 days to ensure we have data)
            hist = stock.history(period="5d")

            if hist.empty:
                raise ValueError(f"No data available for ticker: {ticker}")

            # Get the most recent close price
            current_price = float(hist["Close"].iloc[-1])

            if current_price <= 0:
                raise ValueError(f"Invalid price data for ticker: {ticker}")

            logger.info(f"Retrieved price for {ticker}: ${current_price:.2f}")
            return current_price

        except Exception as e:
            if "No data available" in str(e) or "Invalid" in str(e):
                raise ValueError(f"Ticker '{ticker}' not found or has no valid data")
            else:
                logger.error(f"Error retrieving price for {ticker}: {str(e)}")
                raise Exception(
                    f"Failed to retrieve market data for {ticker}: {str(e)}"
                )


def get_market_data_provider() -> MarketDataProvider:
    """
    Dependency injection function that returns a MarketDataProvider instance.

    Returns:
        MarketDataProvider: Default market data provider (YahooFinanceProvider)
    """
    return YahooFinanceProvider()
