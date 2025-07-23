import logging
from pathlib import Path
from typing import Annotated

from cactus_wealth import schemas
from cactus_wealth.core.dataprovider import MarketDataProvider, get_market_data_provider
from cactus_wealth.database import get_session
from cactus_wealth.models import Report, User
from cactus_wealth.security import get_current_user
from cactus_wealth.services import ReportService
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from sqlalchemy import desc

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post(
    "/clients/{client_id}/generate-report", response_model=schemas.ReportResponse
)
async def generate_client_report(
    client_id: int,
    report_data: schemas.ReportCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_session)],
    market_data_provider: Annotated[
        MarketDataProvider, Depends(get_market_data_provider)
    ],
) -> schemas.ReportResponse:
    """
    Generate a PDF report for a specific client.

    Args:
        client_id: ID of the client to generate report for
        report_data: Report generation request data
        current_user: Authenticated user (advisor)
        db: Database session
        market_data_provider: Market data provider instance

    Returns:
        ReportResponse with generation result

    Raises:
        HTTPException: If client not found or access denied
    """
    logger.info(
        f"Report generation requested for client {client_id} by user {current_user.id}"
    )

    try:
        # Verify client_id matches request body
        if report_data.client_id != client_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Client ID in URL does not match request body",
            )

        # Initialize report service
        report_service = ReportService(db, market_data_provider)

        # Generate report
        result = await report_service.generate_portfolio_report(
            client_id=client_id,
            advisor=current_user,
            report_type=report_data.report_type,
        )

        if not result.success:
            # Business logic error (client not found, no portfolios, etc.)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=result.message
            )

        logger.info(f"Report generated successfully: {result.report_id}")
        return result

    except HTTPException:
        # Re-raise HTTP exceptions (validation errors)
        raise
    except Exception as e:
        logger.error(f"Unexpected error during report generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during report generation",
        )


@router.get("/{report_id}/download")
async def download_report(
    report_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_session)],
) -> FileResponse:
    """
    Download a generated PDF report.

    Args:
        report_id: ID of the report to download
        current_user: Authenticated user
        db: Database session

    Returns:
        FileResponse with PDF content

    Raises:
        HTTPException: If report not found or access denied
    """
    logger.info(f"Report download requested: {report_id} by user {current_user.id}")

    try:
        # Get report with access control
        statement = select(Report).where(Report.id == report_id)

        # Apply access control - only ADMIN can download all reports
        # Other users can only download reports they generated
        if current_user.role.value != "ADMIN":
            statement = statement.where(Report.advisor_id == current_user.id)

        report = db.exec(statement).first()

        if not report:
            logger.warning(
                f"Report {report_id} not found or access denied for user {current_user.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found or access denied",
            )

        # Check if file exists
        file_path = Path(report.file_path)
        if not file_path.exists():
            logger.error(f"Report file not found: {file_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report file not found on server",
            )

        # Generate download filename
        download_filename = f"portfolio_report_{report.client_id}_{report.generated_at.strftime('%Y%m%d')}.pdf"

        logger.info(f"Serving report file: {file_path}")

        return FileResponse(
            path=str(file_path),
            filename=download_filename,
            media_type="application/pdf",
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error during report download: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during report download",
        )


@router.get("/", response_model=list[schemas.ReportRead])
async def list_reports(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_session)],
) -> list[schemas.ReportRead]:
    """
    List reports accessible to the current user.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        List of reports accessible to the user
    """
    logger.info(f"Report list requested by user {current_user.id}")

    try:
        # Get reports with access control
        statement = select(Report).order_by(desc(Report.generated_at))

        # Apply access control
        if current_user.role.value != "ADMIN":
            statement = statement.where(Report.advisor_id == current_user.id)

        reports = db.exec(statement).all()

        logger.info(f"Found {len(reports)} reports for user {current_user.id}")
        return [schemas.ReportRead.model_validate(report) for report in reports]

    except Exception as e:
        logger.error(f"Error listing reports: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while listing reports",
        )
