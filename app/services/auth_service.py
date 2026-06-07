from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repository = UserRepository(db)

    async def register(self, user_data: UserCreate) -> User:
        existing_user = await self.user_repository.get_by_email(user_data.email)

        if existing_user is not None:
            raise ConflictError("Пользователь с таким email уже существует")

        hashed_password = hash_password(user_data.password)

        user = await self.user_repository.create(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
        )

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def authenticate(self, email: str, password: str) -> User:
        user = await self.user_repository.get_by_email(email)

        if user is None:
            raise AuthenticationError("Неверный email или пароль")

        if not verify_password(password, user.hashed_password):
            raise AuthenticationError("Неверный email или пароль")

        if not user.is_active:
            raise AuthenticationError("Пользователь неактивен")

        return user

    def create_token_for_user(self, user: User) -> str:
        return create_access_token(subject=user.id)