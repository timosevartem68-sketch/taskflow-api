from collections.abc import Iterable

from app.core.exceptions import PermissionDeniedError
from app.models.workspace_member import WorkspaceRole


def ensure_role_allowed(
    *,
    role: WorkspaceRole,
    allowed_roles: Iterable[WorkspaceRole],
    error_message: str,
) -> None:
    if role not in set(allowed_roles):
        raise PermissionDeniedError(error_message)