class AppError(Exception):
    """Базовая ошибка приложения."""


class NotFoundError(AppError):
    """Сущность не найдена."""


class PermissionDeniedError(AppError):
    """Недостаточно прав."""


class ConflictError(AppError):
    """Конфликт данных."""


class AuthenticationError(AppError):
    """Ошибка авторизации."""