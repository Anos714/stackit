import type { ProjectOptions } from "../types/index.ts";
import type { FileMap } from "../utils/fs.ts";
import { runScript } from "./common.ts";

/*
 * FastAPI stack: Next.js (App Router, TypeScript) client + Python API.
 *
 * This is the "one stack done deep" template:
 *   - layered API (routes → services → models), typed end to end
 *   - SQLAlchemy 2.0 async + Alembic migrations + Postgres via docker compose
 *   - real auth: argon2 hashing, JWT access/refresh with rotation and revocation
 *   - pytest suite, ruff, and mypy (strict) generated alongside the code
 *   - the client ships a working sign-in / sign-up / profile flow
 */

const REQUIREMENTS = `fastapi>=0.115,<1.0
uvicorn[standard]>=0.32,<1.0
sqlalchemy[asyncio]>=2.0.36,<2.1
asyncpg>=0.30,<1.0
alembic>=1.14,<2.0
pydantic[email]>=2.10,<3.0
pydantic-settings>=2.7,<3.0
PyJWT>=2.10,<3.0
pwdlib[argon2]>=0.2,<1.0
`;

const REQUIREMENTS_DEV = `-r requirements.txt
pytest>=8.3,<9.0
pytest-asyncio>=0.25,<2.0
httpx>=0.28,<1.0
aiosqlite>=0.20,<1.0
ruff>=0.9,<1.0
mypy>=1.14,<2.0
`;

const PYPROJECT = `# Tooling configuration only — dependencies live in requirements*.txt so the
# scaffold works with a plain venv + pip (no build backend, no editable install).
[tool.ruff]
line-length = 100
target-version = "py311"
extend-exclude = ["alembic/versions"]

[tool.ruff.lint]
select = ["E", "W", "F", "I", "UP", "B", "SIM", "ASYNC"]

[tool.ruff.lint.flake8-bugbear]
# FastAPI's dependency idiom is a function call in a default argument.
extend-immutable-calls = [
  "fastapi.Body",
  "fastapi.Depends",
  "fastapi.Header",
  "fastapi.Path",
  "fastapi.Query",
  "fastapi.Security",
]

[tool.ruff.lint.isort]
# \`alembic/\` is a local directory, but the imports inside it are the library.
known-first-party = ["app"]
known-third-party = ["alembic"]

[tool.mypy]
python_version = "3.11"
strict = true
plugins = ["pydantic.mypy"]
files = ["app", "tests"]

[[tool.mypy.overrides]]
module = ["alembic.*", "jwt.*", "pwdlib.*"]
ignore_missing_imports = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
`;

const ENV_EXAMPLE = `# Copy to server/.env (the API reads it with pydantic-settings).
PORT=5000
CLIENT_URL=http://localhost:3000
ENVIRONMENT=development

# Postgres — started by \`docker compose up -d\`. Note the +asyncpg driver.
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/stackit

# Dev creates tables on boot. In production set this to false and run migrations:
#   python -m alembic upgrade head
AUTO_CREATE_TABLES=true

# Generate one: python -c "import secrets; print(secrets.token_urlsafe(48))"
SECRET_KEY=dev-only-change-me-replace-before-production-32b
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
`;

const MAIN_PY = `from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, health, users
from app.core.config import settings
from app.db.base import create_tables
from app.db.session import engine
from app.services.auth import AuthError


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Dev convenience: create tables on boot. Production uses Alembic."""
    dev_secret = "dev-only-change-me-replace-before-production-32b"
    if settings.environment == "production" and settings.secret_key == dev_secret:
        raise RuntimeError("Set SECRET_KEY before running with ENVIRONMENT=production")
    if settings.auto_create_tables:
        await create_tables(engine)
    yield
    await engine.dispose()


app = FastAPI(
    title=f"{settings.project_name} API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.client_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AuthError)
async def handle_auth_error(_: Request, exc: AuthError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.get("/", tags=["meta"])
async def root() -> dict[str, str]:
    return {"name": settings.project_name, "docs": "/docs", "health": "/api/health"}


app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
`;

const CONFIG_PY = `from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App configuration, loaded from environment variables and \`.env\`."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    project_name: str = "__PROJECT_NAME__"
    environment: str = "development"
    port: int = 5000
    client_url: str = "http://localhost:3000"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/stackit"
    auto_create_tables: bool = True

    secret_key: str = "dev-only-change-me-replace-before-production-32b"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
`;

const SECURITY_PY = `from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Literal
from uuid import uuid4

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

TokenType = Literal["access", "refresh"]

password_hash = PasswordHash.recommended()


class TokenError(Exception):
    """Raised when a JWT is malformed, expired, or of the wrong type."""


@dataclass(frozen=True)
class TokenPayload:
    sub: str
    type: str
    jti: str
    exp: int


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_token(subject: str, token_type: TokenType, expires_delta: timedelta) -> tuple[str, str]:
    """Return the encoded JWT and its id (jti)."""
    jti = uuid4().hex
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm), jti


def decode_token(token: str, expected_type: TokenType) -> TokenPayload:
    try:
        raw: dict[str, Any] = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
    except jwt.InvalidTokenError as exc:
        raise TokenError("Invalid or expired token") from exc

    if raw.get("type") != expected_type:
        raise TokenError(f"Expected a {expected_type} token")

    subject = raw.get("sub")
    jti = raw.get("jti")
    expires = raw.get("exp")
    if not isinstance(subject, str) or not isinstance(jti, str) or not isinstance(expires, int):
        raise TokenError("Token is missing required claims")

    return TokenPayload(sub=subject, type=expected_type, jti=jti, exp=expires)
`;

const DB_SESSION_PY = `from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine: AsyncEngine = create_async_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: one session per request, closed afterwards."""
    async with SessionLocal() as session:
        yield session
`;

const DB_BASE_PY = `from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for every ORM model."""


async def create_tables(engine: AsyncEngine) -> None:
    """Create all registered tables (development bootstrap; prod uses Alembic)."""
    from app.models import RefreshToken, User  # noqa: F401  # register the mappers

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
`;

const USER_MODEL_PY = `from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(80), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
`;

const REFRESH_TOKEN_MODEL_PY = `from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import User


class RefreshToken(Base):
    """One row per issued refresh token, so it can be rotated and revoked."""

    __tablename__ = "refresh_tokens"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    jti: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(lazy="joined")
`;

const MODELS_INIT_PY = `from app.models.refresh_token import RefreshToken
from app.models.user import User

__all__ = ["RefreshToken", "User"]
`;

const USER_SCHEMA_PY = `from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime
`;

const AUTH_SCHEMA_PY = `from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class Message(BaseModel):
    message: str
`;

const AUTH_SERVICE_PY = `from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    TokenError,
    create_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import TokenPair
from app.schemas.user import UserCreate


class AuthError(Exception):
    """Domain error mapped to an HTTP status by the app-level handler."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    user: User | None = await db.scalar(select(User).where(User.email == email.lower()))
    return user


async def create_user(db: AsyncSession, payload: UserCreate) -> User:
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise AuthError("Email already registered", 409) from exc
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        raise AuthError("Incorrect email or password", 401)
    if not user.is_active:
        raise AuthError("Inactive user", 403)
    return user


async def issue_tokens(db: AsyncSession, user: User) -> TokenPair:
    access_token, _ = create_token(
        str(user.id),
        "access",
        timedelta(minutes=settings.access_token_expire_minutes),
    )
    refresh_delta = timedelta(days=settings.refresh_token_expire_days)
    refresh_token, jti = create_token(str(user.id), "refresh", refresh_delta)

    db.add(
        RefreshToken(
            user_id=user.id,
            jti=jti,
            expires_at=datetime.now(UTC) + refresh_delta,
        )
    )
    await db.commit()

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


async def rotate_refresh_token(db: AsyncSession, token: str) -> TokenPair:
    """Exchange a refresh token for a new pair, revoking the old one."""
    try:
        payload = decode_token(token, "refresh")
    except TokenError as exc:
        raise AuthError(str(exc), 401) from exc

    stored: RefreshToken | None = await db.scalar(
        select(RefreshToken).where(RefreshToken.jti == payload.jti)
    )
    if stored is None or stored.revoked:
        raise AuthError("Refresh token has been revoked", 401)

    try:
        user_id = UUID(payload.sub)
    except ValueError as exc:
        raise AuthError("Invalid token subject", 401) from exc

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise AuthError("User not found or inactive", 401)

    stored.revoked = True
    return await issue_tokens(db, user)


async def revoke_refresh_token(db: AsyncSession, token: str) -> None:
    """Logout is idempotent: an unknown or expired token is a no-op."""
    try:
        payload = decode_token(token, "refresh")
    except TokenError:
        return

    stored: RefreshToken | None = await db.scalar(
        select(RefreshToken).where(RefreshToken.jti == payload.jti)
    )
    if stored is not None and not stored.revoked:
        stored.revoked = True
        await db.commit()
`;

const DEPS_PY = `from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenError, decode_token
from app.db.session import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    """Resolve the bearer token to a live user, or fail with a 401."""
    if credentials is None:
        raise _unauthorized("Not authenticated")

    try:
        payload = decode_token(credentials.credentials, "access")
    except TokenError as exc:
        raise _unauthorized(str(exc)) from exc

    try:
        user_id = UUID(payload.sub)
    except ValueError as exc:
        raise _unauthorized("Invalid token subject") from exc

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise _unauthorized("User not found or inactive")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
`;

const HEALTH_ROUTE_PY = `import time
from dataclasses import dataclass

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.api.deps import DbSession

router = APIRouter()

_STARTED_AT = time.monotonic()


@dataclass(frozen=True)
class HealthResponse:
    status: str
    uptime: float


@router.get("", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", uptime=round(time.monotonic() - _STARTED_AT, 3))


@router.get("/ready")
async def ready(db: DbSession) -> dict[str, str]:
    """Readiness probe: 503 until Postgres answers."""
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 — surface any driver error as 503
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="database unavailable",
        ) from exc
    return {"status": "ready", "database": "ok"}
`;

const AUTH_ROUTE_PY = `from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.models.user import User
from app.schemas.auth import LoginRequest, Message, RefreshRequest, TokenPair
from app.schemas.user import UserCreate, UserRead
from app.services.auth import (
    authenticate,
    create_user,
    issue_tokens,
    revoke_refresh_token,
    rotate_refresh_token,
)

router = APIRouter()


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate, db: DbSession) -> User:
    return await create_user(db, payload)


@router.post("/login", response_model=TokenPair)
async def login(payload: LoginRequest, db: DbSession) -> TokenPair:
    user = await authenticate(db, payload.email, payload.password)
    return await issue_tokens(db, user)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, db: DbSession) -> TokenPair:
    return await rotate_refresh_token(db, payload.refresh_token)


@router.post("/logout", response_model=Message)
async def logout(payload: RefreshRequest, db: DbSession) -> Message:
    await revoke_refresh_token(db, payload.refresh_token)
    return Message(message="Logged out")


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser) -> User:
    return current_user
`;

const USERS_ROUTE_PY = `from collections.abc import Sequence

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.user import User
from app.schemas.user import UserRead

router = APIRouter()


@router.get("", response_model=list[UserRead])
async def list_users(db: DbSession, _: CurrentUser) -> Sequence[User]:
    """Protected example endpoint — delete it and keep auth + /me."""
    result = await db.scalars(select(User).order_by(User.created_at.desc()))
    return result.all()
`;

const CONFTEST_PY = `from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """Fresh in-memory SQLite database per test, overriding the real session."""
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client

    app.dependency_overrides.clear()
    await engine.dispose()
`;

const TEST_HEALTH_PY = `from httpx import AsyncClient


async def test_health(client: AsyncClient) -> None:
    response = await client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["uptime"] >= 0


async def test_root_metadata(client: AsyncClient) -> None:
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json()["docs"] == "/docs"
`;

const TEST_AUTH_PY = `from httpx import AsyncClient

SIGNUP = {
    "email": "ada@example.com",
    "full_name": "Ada Lovelace",
    "password": "correct-horse-battery",
}


async def test_signup_login_me_refresh_logout(client: AsyncClient) -> None:
    signup = await client.post("/api/auth/signup", json=SIGNUP)
    assert signup.status_code == 201
    assert signup.json()["email"] == SIGNUP["email"]
    assert "hashed_password" not in signup.json()

    duplicate = await client.post("/api/auth/signup", json=SIGNUP)
    assert duplicate.status_code == 409

    login = await client.post(
        "/api/auth/login",
        json={"email": SIGNUP["email"], "password": SIGNUP["password"]},
    )
    assert login.status_code == 200
    tokens = login.json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    me = await client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["full_name"] == SIGNUP["full_name"]

    refreshed = await client.post(
        "/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refreshed.status_code == 200
    rotated = refreshed.json()

    # Rotation: the old refresh token must be dead.
    reused = await client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert reused.status_code == 401

    logout = await client.post("/api/auth/logout", json={"refresh_token": rotated["refresh_token"]})
    assert logout.status_code == 200

    after_logout = await client.post(
        "/api/auth/refresh", json={"refresh_token": rotated["refresh_token"]}
    )
    assert after_logout.status_code == 401


async def test_login_rejects_bad_password(client: AsyncClient) -> None:
    await client.post("/api/auth/signup", json=SIGNUP)
    response = await client.post(
        "/api/auth/login",
        json={"email": SIGNUP["email"], "password": "wrong-password"},
    )
    assert response.status_code == 401


async def test_me_requires_a_token(client: AsyncClient) -> None:
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


async def test_signup_validates_input(client: AsyncClient) -> None:
    response = await client.post(
        "/api/auth/signup",
        json={"email": "not-an-email", "full_name": "", "password": "short"},
    )
    assert response.status_code == 422


async def test_users_endpoint_is_protected(client: AsyncClient) -> None:
    assert (await client.get("/api/users")).status_code == 401

    await client.post("/api/auth/signup", json=SIGNUP)
    login = await client.post(
        "/api/auth/login",
        json={"email": SIGNUP["email"], "password": SIGNUP["password"]},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    response = await client.get("/api/users", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
`;

const ALEMBIC_INI = `[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url =

[post_write_hooks]
`;

const ALEMBIC_ENV_PY = `import asyncio

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.db.base import Base
from app.models import RefreshToken, User  # noqa: F401  # register the mappers

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
`;

const ALEMBIC_SCRIPT_MAKO = `"""\${message}

Revision ID: \${up_revision}
Revises: \${down_revision | comma,n}
Create Date: \${create_date}

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
\${imports if imports else ""}

revision: str = \${repr(up_revision)}
down_revision: str | None = \${repr(down_revision)}
branch_labels: str | Sequence[str] | None = \${repr(branch_labels)}
depends_on: str | Sequence[str] | None = \${repr(depends_on)}


def upgrade() -> None:
    \${upgrades if upgrades else "pass"}


def downgrade() -> None:
    \${downgrades if downgrades else "pass"}
`;

const ALEMBIC_INITIAL_PY = `"""initial schema: users + refresh_tokens

Revision ID: 0001_initial
Revises:
Create Date: __CREATE_DATE__

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=80), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("jti", sa.String(length=64), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_refresh_tokens_jti"), "refresh_tokens", ["jti"], unique=True)
    op.create_index(op.f("ix_refresh_tokens_user_id"), "refresh_tokens", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_refresh_tokens_user_id"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_jti"), table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
`;

/* --------------------------------- client -------------------------------- */

const CLIENT_PACKAGE_JSON = `{
  "name": "client",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "16.4.5",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "typescript": "^5.8.3"
  },
  "trustedDependencies": ["sharp", "unrs-resolver"]
}
`;

const CLIENT_TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
`;

const CLIENT_NEXT_CONFIG = `import type { NextConfig } from "next";

// The browser calls the same origin; Next.js proxies /api/* to FastAPI.
// Override API_URL when the API is not on localhost:5000.
const API_URL = process.env.API_URL ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  // Pin the workspace root to client/ — the scaffold also has a root package.json.
  turbopack: { root: process.cwd() },
  async rewrites() {
    return [{ source: "/api/:path*", destination: \`\${API_URL}/api/:path*\` }];
  },
};

export default nextConfig;
`;

const CLIENT_NEXT_ENV_DTS = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`;

const CLIENT_LAYOUT_TSX = `import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "__PROJECT_NAME__",
  description: "Next.js client for a FastAPI + Postgres API with real auth.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

const CLIENT_API_TS = `// Minimal typed API client for the FastAPI backend.
// The browser talks to the same origin and Next.js rewrites /api/* to FastAPI
// (see next.config.ts). Set NEXT_PUBLIC_API_URL to call the API directly.
// Access/refresh tokens live in localStorage; a 401 retries once after refreshing.
const BASE: string = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Health {
  status: string;
  uptime: number;
}

export interface SignupInput {
  email: string;
  full_name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const ACCESS_KEY = "stackit.access_token";
const REFRESH_KEY = "stackit.refresh_token";

// Server-rendered modules have no localStorage, so tokens are loaded lazily and
// guarded. Every entry point below touches this only from the browser.
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokensLoaded = false;

function loadTokens(): void {
  if (tokensLoaded || typeof window === "undefined") return;
  tokensLoaded = true;
  accessToken = window.localStorage.getItem(ACCESS_KEY);
  refreshToken = window.localStorage.getItem(REFRESH_KEY);
}

function storeTokens(pair: TokenPair): void {
  accessToken = pair.access_token;
  refreshToken = pair.refresh_token;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_KEY, pair.access_token);
  window.localStorage.setItem(REFRESH_KEY, pair.refresh_token);
}

export function clearSession(): void {
  accessToken = null;
  refreshToken = null;
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function hasSession(): boolean {
  loadTokens();
  return Boolean(accessToken);
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string };
    return body.detail ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

async function refreshTokens(): Promise<boolean> {
  loadTokens();
  if (!refreshToken) return false;
  const res = await fetch(BASE + "/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    clearSession();
    return false;
  }
  storeTokens((await res.json()) as TokenPair);
  return true;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  retry?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  loadTokens();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = "Bearer " + accessToken;

  const res = await fetch(BASE + path, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (res.status === 401 && (options.retry ?? true) && refreshToken) {
    const refreshed = await refreshTokens();
    if (refreshed) return request<T>(path, { ...options, retry: false });
  }

  if (!res.ok) throw new ApiError(res.status, await readError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  health(): Promise<Health> {
    return request<Health>("/api/health");
  },

  signup(input: SignupInput): Promise<User> {
    return request<User>("/api/auth/signup", { method: "POST", body: input });
  },

  async login(input: LoginInput): Promise<User> {
    const pair = await request<TokenPair>("/api/auth/login", { method: "POST", body: input });
    storeTokens(pair);
    return request<User>("/api/auth/me");
  },

  me(): Promise<User> {
    return request<User>("/api/auth/me");
  },

  async logout(): Promise<void> {
    loadTokens();
    const token = refreshToken;
    clearSession();
    if (!token) return;
    await fetch(BASE + "/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token }),
    }).catch(() => undefined);
  },
};
`;

const CLIENT_PAGE_TSX = `"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, api, clearSession, hasSession, type User } from "@/lib/api";

type Mode = "login" | "signup";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking API…");

  useEffect(() => {
    api
      .health()
      .then((h) => setApiStatus("API " + h.status + " · uptime " + Math.round(h.uptime) + "s"))
      .catch(() => setApiStatus("API offline"));

    if (hasSession()) {
      api
        .me()
        .then(setUser)
        .catch(() => clearSession());
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await api.signup({ email, full_name: fullName, password });
      }
      setUser(await api.login({ email, password }));
      setPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <span className="brand">
          <span className="glyph">▲</span> __PROJECT_NAME__
        </span>
        <span className="status">{apiStatus}</span>
      </header>

      {user ? (
        <section className="card">
          <div className="avatar">{user.full_name.slice(0, 1).toUpperCase()}</div>
          <h1>Signed in</h1>
          <p className="lead">
            This card is rendered from <code>GET /api/auth/me</code> with a JWT access token.
          </p>
          <dl className="facts">
            <div>
              <dt>Name</dt>
              <dd>{user.full_name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>User id</dt>
              <dd className="mono">{user.id}</dd>
            </div>
          </dl>
          <button className="ghost" onClick={handleLogout}>
            Sign out
          </button>
        </section>
      ) : (
        <section className="card">
          <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="lead">
            Real auth: argon2 hashing, JWT access + refresh tokens, protected routes.
          </p>

          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "tab on" : "tab"}
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={mode === "signup" ? "tab on" : "tab"}
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label>
                Full name
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  minLength={1}
                  maxLength={80}
                  required
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === "signup" ? 8 : 1}
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </label>

            {error && <p className="error">{error}</p>}

            <button className="primary" type="submit" disabled={busy}>
              {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="hint">
            Passwords are hashed with argon2. The API is FastAPI, the DB is Postgres via
            SQLAlchemy 2.
          </p>
        </section>
      )}
    </main>
  );
}
`;

const CLIENT_APP_CSS = `:root {
  color-scheme: dark;
  --bg: #09090b;
  --panel: #121216;
  --line: #26262c;
  --text: #f4f4f5;
  --muted: #a1a1aa;
  --volt: #bef264;
  --danger: #fca5a5;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: radial-gradient(900px 500px at 15% -10%, #1a2408 0%, var(--bg) 60%);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.shell {
  min-height: 100vh;
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 40px;
  padding: 32px 20px 64px;
}

.topbar {
  width: 100%;
  max-width: 520px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--muted);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text);
}

.glyph {
  color: var(--volt);
}

.status {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.card {
  width: 100%;
  max-width: 520px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 32px;
  box-shadow: 0 30px 80px rgb(0 0 0 / 45%);
}

h1 {
  margin: 0 0 8px;
  font-size: 26px;
  letter-spacing: -0.02em;
}

.lead {
  margin: 0 0 22px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  padding: 4px;
  background: #0c0c0f;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.tab {
  flex: 1;
  padding: 8px 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.tab.on {
  background: #1c1c22;
  color: var(--text);
}

form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}

input {
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: #0c0c0f;
  color: var(--text);
  font-size: 14px;
  outline: none;
}

input:focus {
  border-color: var(--volt);
  box-shadow: 0 0 0 3px rgb(190 242 100 / 14%);
}

button {
  font-family: inherit;
}

.primary {
  margin-top: 4px;
  padding: 11px 16px;
  border: 0;
  border-radius: 9px;
  background: var(--volt);
  color: #101408;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.6;
  cursor: progress;
}

.ghost {
  margin-top: 22px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.error {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgb(248 113 113 / 35%);
  border-radius: 8px;
  background: rgb(127 29 29 / 25%);
  color: var(--danger);
  font-size: 13px;
}

.hint {
  margin: 18px 0 0;
  color: #71717a;
  font-size: 12px;
  line-height: 1.6;
}

.avatar {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  border-radius: 12px;
  background: rgb(190 242 100 / 14%);
  color: var(--volt);
  font-size: 20px;
  font-weight: 700;
}

.facts {
  display: grid;
  gap: 12px;
  margin: 20px 0 0;
}

.facts div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #1c1c22;
}

.facts dt {
  color: var(--muted);
  font-size: 12px;
}

.facts dd {
  margin: 0;
  font-size: 13px;
  text-align: right;
  overflow-wrap: anywhere;
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 11px;
}

code {
  font-family: ui-monospace, monospace;
  font-size: 0.92em;
  color: var(--volt);
}
`;

/** App styles plus a small base layer — app/layout.tsx imports this once. */
const CLIENT_GLOBALS_CSS =
  CLIENT_APP_CSS +
  `
html,
body {
  min-height: 100%;
}
`;

const CLIENT_ENV_EXAMPLE = `# The Next.js server proxies /api/* to the API (default http://localhost:5000).
# Change this if your FastAPI server runs elsewhere.
API_URL=http://localhost:5000

# Optional: call the API directly from the browser instead of through the proxy.
# NEXT_PUBLIC_API_URL=http://localhost:5000
`;

const PY_RUNNER = `// Cross-platform launcher for the server's Python venv.
// Usage: node scripts/py.mjs <module> [...args]   e.g. node scripts/py.mjs uvicorn app.main:app
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const serverDir = resolve(process.cwd(), "server");
const venvPython = resolve(
  serverDir,
  ".venv",
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
);

if (!existsSync(venvPython)) {
  console.error(
    "Python venv not found. Run from the project root:\\n" +
      "  uv venv server/.venv && uv pip install --python server/.venv -r server/requirements-dev.txt\\n" +
      "  # or, without uv:\\n" +
      "  python -m venv server/.venv && server/.venv/bin/pip install -r server/requirements-dev.txt",
  );
  process.exit(1);
}

const [moduleName, ...args] = process.argv.slice(2);
if (!moduleName) {
  console.error("usage: node scripts/py.mjs <module> [...args]");
  process.exit(1);
}

const child = spawn(venvPython, ["-m", moduleName, ...args], {
  cwd: serverDir,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
`;

const COMPOSE = `services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: stackit
    volumes: ["pg-data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d stackit"]
      interval: 5s
      timeout: 3s
      retries: 10
volumes:
  pg-data:
`;

export const FASTAPI_GITIGNORE_EXTRA = `# next.js
.next/
next-env.d.ts

# python
.venv/
__pycache__/
*.py[cod]
.pytest_cache/
.mypy_cache/
.ruff_cache/
`;

/** Root package.json wiring the Next.js client and the Python API together. */
export function fastapiRootPackageJson(o: ProjectOptions): string {
  const pm = o.packageManager;
  return (
    JSON.stringify(
      {
        name: o.projectName,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: `concurrently "node scripts/py.mjs uvicorn app.main:app --reload --port 5000" "cd client && ${runScript(pm, "dev")}"`,
          "dev:api": "node scripts/py.mjs uvicorn app.main:app --reload --port 5000",
          "dev:client": `cd client && ${runScript(pm, "dev")}`,
          "db:up": "docker compose up -d",
          "db:down": "docker compose down",
          "db:migrate": "node scripts/py.mjs alembic upgrade head",
          test: "node scripts/py.mjs pytest",
          lint: "node scripts/py.mjs ruff check . && node scripts/py.mjs mypy app tests",
          format: "node scripts/py.mjs ruff format .",
          build: `cd client && ${runScript(pm, "build")}`,
        },
        devDependencies: { concurrently: "^9.1.2" },
      },
      null,
      2,
    ) + "\n"
  );
}

/** FastAPI reads routes → services → models; the client ships a real auth flow. */
export function fastapiFiles(o: ProjectOptions): FileMap {
  const name = o.projectName;
  const sub = (s: string) => s.replaceAll("__PROJECT_NAME__", name);

  return {
    "server/requirements.txt": REQUIREMENTS,
    "server/requirements-dev.txt": REQUIREMENTS_DEV,
    "server/pyproject.toml": PYPROJECT,
    "server/app/__init__.py": sub(`"""__PROJECT_NAME__ API package (FastAPI)."""\n`),
    "server/app/main.py": MAIN_PY,
    "server/app/core/__init__.py": `"""Settings and security — code shared by every layer."""\n`,
    "server/app/core/config.py": sub(CONFIG_PY),
    "server/app/core/security.py": SECURITY_PY,
    "server/app/db/__init__.py": `"""Engine, session dependency and the declarative base."""\n`,
    "server/app/db/base.py": DB_BASE_PY,
    "server/app/db/session.py": DB_SESSION_PY,
    "server/app/models/__init__.py": MODELS_INIT_PY,
    "server/app/models/user.py": USER_MODEL_PY,
    "server/app/models/refresh_token.py": REFRESH_TOKEN_MODEL_PY,
    "server/app/schemas/__init__.py": `"""Pydantic request and response models."""\n`,
    "server/app/schemas/auth.py": AUTH_SCHEMA_PY,
    "server/app/schemas/user.py": USER_SCHEMA_PY,
    "server/app/services/__init__.py": `"""Business logic the routers delegate to."""\n`,
    "server/app/services/auth.py": AUTH_SERVICE_PY,
    "server/app/api/__init__.py": `"""HTTP layer: dependencies and routers."""\n`,
    "server/app/api/deps.py": DEPS_PY,
    "server/app/api/routes/__init__.py": `"""Feature routers mounted in app.main."""\n`,
    "server/app/api/routes/auth.py": AUTH_ROUTE_PY,
    "server/app/api/routes/health.py": HEALTH_ROUTE_PY,
    "server/app/api/routes/users.py": USERS_ROUTE_PY,
    "server/tests/__init__.py": `"""Test suite for the generated API."""\n`,
    "server/tests/conftest.py": CONFTEST_PY,
    "server/tests/test_auth.py": TEST_AUTH_PY,
    "server/tests/test_health.py": TEST_HEALTH_PY,
    "server/alembic.ini": ALEMBIC_INI,
    "server/alembic/env.py": ALEMBIC_ENV_PY,
    "server/alembic/script.py.mako": ALEMBIC_SCRIPT_MAKO,
    "server/alembic/versions/0001_initial.py": ALEMBIC_INITIAL_PY.replace(
      "__CREATE_DATE__",
      new Date().toISOString().replace("T", " ").slice(0, 19),
    ),
    "server/.env.example": ENV_EXAMPLE,
    "docker-compose.yml": COMPOSE,
    "scripts/py.mjs": PY_RUNNER,
  };
}

/** Next.js (App Router) client with a working sign-in / sign-up / profile flow. */
export function fastapiClientFiles(o: ProjectOptions): FileMap {
  const sub = (s: string) => s.replaceAll("__PROJECT_NAME__", o.projectName);

  return {
    "client/package.json": CLIENT_PACKAGE_JSON,
    "client/tsconfig.json": CLIENT_TSCONFIG,
    "client/next.config.ts": CLIENT_NEXT_CONFIG,
    "client/next-env.d.ts": CLIENT_NEXT_ENV_DTS,
    "client/app/layout.tsx": sub(CLIENT_LAYOUT_TSX),
    "client/app/page.tsx": sub(CLIENT_PAGE_TSX),
    "client/app/globals.css": CLIENT_GLOBALS_CSS,
    "client/lib/api.ts": CLIENT_API_TS,
    "client/.env.example": CLIENT_ENV_EXAMPLE,
  };
}

export function fastapiReadme(o: ProjectOptions): string {
  const pm = o.packageManager;
  return `# ${o.projectName}

Scaffolded with **stackit** — \`fastapi\` (Python 3.11+, Next.js App Router client).

A working full-stack app, not a folder of TODOs: real auth (argon2 + JWT with
refresh-token rotation), a protected endpoint, Postgres via SQLAlchemy 2.0,
Alembic migrations, and a Next.js client that signs up, signs in and loads
\`/api/auth/me\`.

## Structure

\`\`\`
${o.projectName}/
├── client/                       # Next.js App Router (rewrites /api → :5000)
│   ├── app/
│   │   ├── layout.tsx            # root layout + metadata
│   │   ├── page.tsx              # sign in / sign up / profile
│   │   └── globals.css
│   ├── lib/api.ts                # typed client, token refresh on 401
│   └── next.config.ts            # /api/:path* → FastAPI
├── server/                       # FastAPI + SQLAlchemy 2.0 + Postgres
│   ├── app/
│   │   ├── main.py               # app factory, CORS, error handlers
│   │   ├── core/                 # settings, password hashing, JWT
│   │   ├── db/                   # async engine, session dependency, Base
│   │   ├── models/               # User, RefreshToken
│   │   ├── schemas/              # pydantic v2 request/response models
│   │   ├── services/             # auth business logic
│   │   └── api/                  # deps (get_current_user) + routes
│   ├── alembic/                  # migration environment + initial schema
│   ├── tests/                    # pytest: auth flow on in-memory SQLite
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── pyproject.toml            # ruff + mypy strict + pytest config
├── scripts/py.mjs                # cross-platform venv launcher for npm scripts
├── docker-compose.yml
└── .env.example
\`\`\`

## Quickstart

\`\`\`bash
cd ${o.projectName}
cp .env.example server/.env
docker compose up -d                       # Postgres on :5432
${pm} run dev                              # API :5000 + Next.js :3000
\`\`\`

Open **http://localhost:3000**, click *Sign up*, and you are signed in.

- Client: http://localhost:3000
- API: http://localhost:5000
- Swagger UI: http://localhost:5000/docs
- Health: http://localhost:5000/api/health

> Dev mode creates the tables on boot (\`AUTO_CREATE_TABLES=true\`). For production
> set it to \`false\`, set a real \`SECRET_KEY\`, then run \`${pm} run db:migrate\`.

## Auth endpoints

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | \`/api/auth/signup\` | 201 + user (argon2 hashed password) |
| POST | \`/api/auth/login\` | 200 + access + refresh token |
| POST | \`/api/auth/refresh\` | rotates the refresh token, revokes the old one |
| POST | \`/api/auth/logout\` | revokes the refresh token |
| GET | \`/api/auth/me\` | protected — needs \`Authorization: Bearer <access>\` |

Access tokens last 15 minutes, refresh tokens 7 days and are stored in the
database so they can be revoked. A 401 on any request makes the client refresh
once and replay the call.

## Scripts

| Command | What it does |
| ------- | ------------ |
| \`${pm} run dev\` | FastAPI (reload) + Next.js together |
| \`${pm} run test\` | pytest (auth flow, validation, protected routes) |
| \`${pm} run lint\` | ruff + mypy (strict) |
| \`${pm} run format\` | ruff format |
| \`${pm} run db:migrate\` | alembic upgrade head |
| \`${pm} run build\` | production Next.js build |

## Python environment

The scaffolder uses [uv](https://docs.astral.sh/uv/) when it is installed and
falls back to a plain \`venv\` + \`pip\` otherwise:

\`\`\`bash
# with uv (fast)
uv venv server/.venv
uv pip install --python server/.venv -r server/requirements-dev.txt

# without uv
python -m venv server/.venv
server/.venv/bin/pip install -r server/requirements-dev.txt   # Windows: server\\.venv\\Scripts\\pip
\`\`\`

Then install the client dependencies:

\`\`\`bash
cd client && ${pm} install && cd ..
\`\`\`

Both create the same \`server/.venv\`, and \`scripts/py.mjs\` runs every Python
command through it — no activation needed.

## Layout rules

- Routes validate with pydantic schemas and contain no business logic.
- Services own the database work and raise \`AuthError\`; one handler maps it to JSON.
- \`get_current_user\` is the only way to read the caller — no ad-hoc token parsing.
- Migrations are the source of truth in production; \`create_all\` is a dev shortcut.
`;
}
