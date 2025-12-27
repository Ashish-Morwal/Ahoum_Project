from rest_framework.response import Response
from rest_framework import status


def error_response(message, code=None, status_code=status.HTTP_400_BAD_REQUEST, extra_data=None):
    response_data = {
        "detail": message,
        "code": code or "error"
    }
    
    if extra_data:
        response_data.update(extra_data)
    
    return Response(response_data, status=status_code)


def success_response(message, data=None, status_code=status.HTTP_200_OK):
    response_data = {
        "message": message
    }
    
    if data is not None:
        response_data["data"] = data
    
    return Response(response_data, status=status_code)


def validation_error_response(errors, code="validation_error", status_code=status.HTTP_400_BAD_REQUEST):
    return Response({
        "detail": "Validation failed",
        "code": code,
        "errors": errors
    }, status=status_code)


class ErrorCodes:
    # Auth errors
    AUTHENTICATION_FAILED = "authentication_failed"
    INVALID_TOKEN = "invalid_token"
    TOKEN_EXPIRED = "token_expired"
    INVALID_CREDENTIALS = "invalid_credentials"
    EMAIL_NOT_VERIFIED = "email_not_verified"
    
    # Authorization errors
    PERMISSION_DENIED = "permission_denied"
    NOT_OWNER = "not_owner"
    WRONG_ROLE = "wrong_role"
    
    # Validation errors
    VALIDATION_ERROR = "validation_error"
    INVALID_INPUT = "invalid_input"
    REQUIRED_FIELD = "required_field"
    INVALID_EMAIL = "invalid_email"
    INVALID_PASSWORD = "invalid_password"
    
    # Resource errors
    NOT_FOUND = "not_found"
    ALREADY_EXISTS = "already_exists"
    DUPLICATE_ENTRY = "duplicate_entry"
    
    # Event-specific errors
    EVENT_NOT_FOUND = "event_not_found"
    EVENT_FULL = "event_full"
    EVENT_PAST = "event_past"
    ALREADY_ENROLLED = "already_enrolled"
    NOT_ENROLLED = "not_enrolled"
    
    # OTP errors
    OTP_INVALID = "otp_invalid"
    OTP_EXPIRED = "otp_expired"
    OTP_MAX_ATTEMPTS = "otp_max_attempts"
    
    # Generic errors
    SERVER_ERROR = "server_error"
    BAD_REQUEST = "bad_request"


# Convenience functions for common errors
def not_found_error(resource="Resource", code=ErrorCodes.NOT_FOUND):
    """Return 404 not found error"""
    return error_response(
        f"{resource} not found",
        code=code,
        status_code=status.HTTP_404_NOT_FOUND
    )


def permission_denied_error(message="You do not have permission to perform this action", code=ErrorCodes.PERMISSION_DENIED):
    """Return 403 permission denied error"""
    return error_response(
        message,
        code=code,
        status_code=status.HTTP_403_FORBIDDEN
    )


def unauthorized_error(message="Authentication credentials were not provided", code=ErrorCodes.AUTHENTICATION_FAILED):
    """Return 401 unauthorized error"""
    return error_response(
        message,
        code=code,
        status_code=status.HTTP_401_UNAUTHORIZED
    )


def server_error(message="An internal server error occurred", code=ErrorCodes.SERVER_ERROR):
    """Return 500 server error"""
    return error_response(
        message,
        code=code,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def already_exists_error(resource="Resource", code=ErrorCodes.ALREADY_EXISTS):
    """Return 400 already exists error"""
    return error_response(
        f"{resource} already exists",
        code=code,
        status_code=status.HTTP_400_BAD_REQUEST
    )
