import logging
import smtplib
from email.message import EmailMessage
from urllib.parse import urlencode

from app.core.config import get_settings

logger = logging.getLogger("securedocs.email")


def _action_url(base_url: str, token: str) -> str:
    return f"{base_url}?{urlencode({'token': token})}"


def _deliver(*, recipient: str, subject: str, plain_text: str) -> None:
    """Deliver through configured SMTP, or log only the safe development URL locally.

    Production fails closed if SMTP is missing, preventing a deployment from claiming
    verification delivery when it cannot send it.
    """

    settings = get_settings()
    if not settings.smtp_host:
        if settings.app_env == "production":
            raise RuntimeError("SMTP must be configured before production email can be delivered.")
        logger.info("Development email for %s: %s", recipient, plain_text)
        return
    message = EmailMessage()
    message["From"] = settings.mail_from
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(plain_text)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as client:
        if settings.smtp_starttls:
            client.starttls()
        if settings.smtp_username and settings.smtp_password:
            client.login(settings.smtp_username, settings.smtp_password.get_secret_value())
        client.send_message(message)


def send_verification_email(*, recipient: str, token: str) -> None:
    settings = get_settings()
    url = _action_url(settings.email_verification_frontend_url, token)
    _deliver(
        recipient=recipient,
        subject="Verify your SecureDocs account",
        plain_text=(
            "Welcome to SecureDocs. Verify your email address by opening this link:\n\n"
            f"{url}\n\nThis link expires automatically. If you did not create this account, you can ignore this email."
        ),
    )


def send_password_reset_email(*, recipient: str, token: str) -> None:
    settings = get_settings()
    url = _action_url(settings.password_reset_frontend_url, token)
    _deliver(
        recipient=recipient,
        subject="Reset your SecureDocs password",
        plain_text=(
            "A password reset was requested for your SecureDocs account. Open this link to continue:\n\n"
            f"{url}\n\nThis link expires automatically. If you did not request a reset, you can ignore this email."
        ),
    )
