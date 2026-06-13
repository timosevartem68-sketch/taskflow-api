from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_access_token(token)

    if payload is None:
        raise AuthenticationError("Токен недействителен или истёк")

    user_id_raw = payload.get("sub")

    if user_id_raw is None:
        raise AuthenticationError("В токене отсутствует идентификатор пользователя")

    try:
        user_id = int(user_id_raw)
    except ValueError as exc:
        raise AuthenticationError("Некорректный идентификатор пользователя в токене") from exc

    user_repository = UserRepository(db)
    user = await user_repository.get_by_id(user_id)

    if user is None:
        raise AuthenticationError("Пользователь не найден")

    if not user.is_active:
        raise PermissionDeniedError("Пользователь неактивен")

    return user