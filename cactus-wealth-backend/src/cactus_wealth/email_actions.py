import os
from datetime import datetime
from typing import Any

import httpx
import structlog
from pydantic import BaseModel

logger = structlog.get_logger(__name__)

# Configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@cactuswealth.com")
SENDGRID_FROM_NAME = os.getenv("SENDGRID_FROM_NAME", "Cactus Wealth Team")


class EmailTemplate(BaseModel):
    """Email template data structure"""

    template_id: str
    subject: str
    variables: dict[str, Any]


class EmailService:
    """Service for sending emails via SendGrid"""

    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {SENDGRID_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )
        self.base_url = "https://api.sendgrid.com/v3"

    async def send_template_email(
        self, to_email: str, template: EmailTemplate, to_name: str | None = None
    ) -> bool:
        """Send templated email via SendGrid"""
        if not SENDGRID_API_KEY:
            logger.warning("SENDGRID_API_KEY not configured, skipping email")
            return True

        try:
            payload = {
                "from": {"email": SENDGRID_FROM_EMAIL, "name": SENDGRID_FROM_NAME},
                "personalizations": [
                    {
                        "to": [
                            {
                                "email": to_email,
                                "name": to_name or to_email.split("@")[0],
                            }
                        ],
                        "dynamic_template_data": template.variables,
                    }
                ],
                "template_id": template.template_id,
            }

            response = await self.client.post(
                f"{self.base_url}/mail/send", json=payload
            )

            if response.status_code == 202:
                logger.info(
                    "Email sent successfully",
                    to=to_email,
                    template=template.template_id,
                )
                return True
            else:
                logger.error(
                    "SendGrid API error",
                    status=response.status_code,
                    response=response.text,
                )
                return False

        except Exception as e:
            logger.error("Failed to send email", error=str(e), to=to_email)
            return False

    async def send_onboarding_welcome_email(
        self, client_data: dict[str, Any], advisor_name: str | None = None
    ) -> bool:
        """Send welcome email for onboarding trigger"""

        # Default onboarding template (create this in SendGrid)
        template = EmailTemplate(
            template_id=os.getenv(
                "SENDGRID_ONBOARDING_TEMPLATE_ID", "d-onboarding-welcome"
            ),
            subject="🌵 Welcome to Cactus Wealth - Your Investment Journey Begins!",
            variables={
                "first_name": client_data.get("first_name", ""),
                "last_name": client_data.get("last_name", ""),
                "advisor_name": advisor_name or "Your Cactus Wealth Advisor",
                "onboarding_link": os.getenv(
                    "ONBOARDING_PORTAL_URL", "https://app.cactuswealth.com/onboarding"
                ),
                "support_email": os.getenv("SUPPORT_EMAIL", "support@cactuswealth.com"),
                "current_date": datetime.now().strftime("%B %d, %Y"),
                "client_portal_url": os.getenv(
                    "CLIENT_PORTAL_URL", "https://app.cactuswealth.com"
                ),
                "risk_profile": client_data.get("risk_profile", "moderate"),
                "portfolio_name": client_data.get(
                    "portfolio_name", "Personalized Portfolio"
                ),
            },
        )

        client_email = client_data.get("email")
        client_name = f"{client_data.get('first_name', '')} {client_data.get('last_name', '')}".strip()

        return await self.send_template_email(
            to_email=client_email, template=template, to_name=client_name
        )

    async def close(self) -> None:
        """Close HTTP client"""
        await self.client.aclose()


# Global email service instance
email_service = EmailService()


async def handle_onboarding_trigger(client_data: dict[str, Any]) -> bool:
    """Handle onboarding trigger - send welcome email"""
    try:
        logger.info("Triggering onboarding email", client_id=client_data.get("id"))

        # You could fetch advisor details here if needed
        # advisor = await get_advisor_by_id(client_data.get("owner_id"))
        # advisor_name = f"{advisor.first_name} {advisor.last_name}"

        success = await email_service.send_onboarding_welcome_email(
            client_data=client_data,
            advisor_name="Your Cactus Wealth Advisor",  # Default for now
        )

        if success:
            logger.info(
                "Onboarding email sent successfully", client_id=client_data.get("id")
            )
        else:
            logger.error(
                "Failed to send onboarding email", client_id=client_data.get("id")
            )

        return success

    except Exception as e:
        logger.error("Onboarding trigger failed", error=str(e))
        return False


# Email action registry
EMAIL_ACTIONS = {"trigger_onboarding": handle_onboarding_trigger}


async def execute_email_action(action: str, client_data: dict[str, Any]) -> bool:
    """Execute email action by name"""
    handler = EMAIL_ACTIONS.get(action)
    if not handler:
        logger.warning("Unknown email action", action=action)
        return False

    return await handler(client_data)
