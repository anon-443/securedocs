"""Send a non-sensitive email to the configured Mailtrap sandbox for delivery validation."""

from app.services.email import send_verification_email


if __name__ == "__main__":
    send_verification_email(recipient="qa@securedocs.test", token="mailtrap-smoke-token")
    print("Mailtrap verification-email smoke test sent")
