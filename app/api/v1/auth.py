from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import TokenRead, UserCreate, UserLogin, UserRead
from app.services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)

    return await auth_service.register(user_data)


@router.post(
    "/login",
    response_model=TokenRead,
)
async def login(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)

    user = await auth_service.authenticate(
        email=user_data.email,
        password=user_data.password,
    )

    access_token = auth_service.create_token_for_user(user)

    return TokenRead(access_token=access_token)


@router.get(
    "/me",
    response_model=UserRead,
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user