from __future__ import annotations

import hashlib
import os
import secrets
from datetime import date, datetime, timedelta
from math import ceil
from typing import Generator, List, Optional
from zoneinfo import ZoneInfo

import httpx
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    create_engine,
    delete,
    event,
    select,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, Session as DbSession, mapped_column, relationship, sessionmaker

load_dotenv()

KST = ZoneInfo("Asia/Seoul")
SESSION_DAYS = 7
PASSWORD_MIN_LENGTH = 8
CONTENT_MAX_LENGTH = 50
VALID_STATUSES = {"default", "inProgress", "completed"}
STATUS_PRIORITY = {"inProgress": 0, "default": 1, "completed": 2}
password_hasher = PasswordHasher()


def utc_now() -> datetime:
    return datetime.utcnow()


def kst_today() -> date:
    return datetime.now(KST).date()


def initial_status(todo_date: date) -> str:
    return "inProgress" if todo_date == kst_today() else "default"


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(80))
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class AuthIdentity(Base):
    __tablename__ = "auth_identities"
    __table_args__ = (UniqueConstraint("provider", "provider_subject"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(20))
    provider_subject: Mapped[str] = mapped_column(String(320))


class UserSession(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    content: Mapped[str] = mapped_column(String(CONTENT_MAX_LENGTH))
    date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)


class RecurrenceRule(Base):
    __tablename__ = "recurrence_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    content: Mapped[str] = mapped_column(String(CONTENT_MAX_LENGTH))
    start_date: Mapped[date] = mapped_column(Date, index=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    weekdays_csv: Mapped[str] = mapped_column(String(13))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
    exceptions: Mapped[List["RecurrenceException"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def weekdays(self) -> List[int]:
        return [int(value) for value in self.weekdays_csv.split(",") if value]

    @weekdays.setter
    def weekdays(self, values: List[int]) -> None:
        self.weekdays_csv = ",".join(str(value) for value in sorted(set(values)))


class RecurrenceException(Base):
    __tablename__ = "recurrence_exceptions"
    __table_args__ = (UniqueConstraint("rule_id", "occurrence_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    rule_id: Mapped[int] = mapped_column(
        ForeignKey("recurrence_rules.id", ondelete="CASCADE"), index=True
    )
    occurrence_date: Mapped[date] = mapped_column(Date, index=True)
    content_override: Mapped[Optional[str]] = mapped_column(String(CONTENT_MAX_LENGTH), nullable=True)
    status_override: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)


class ContentModel(BaseModel):
    content: str = Field(min_length=1, max_length=CONTENT_MAX_LENGTH)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("할 일을 입력해 주세요.")
        if len(trimmed) > CONTENT_MAX_LENGTH:
            raise ValueError("할 일은 50자 이내로 입력해 주세요.")
        return trimmed


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=128)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("이름을 입력해 주세요.")
        return value.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleRequest(BaseModel):
    code: str
    redirect_uri: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str


class AuthResponse(BaseModel):
    session_token: str
    user: UserResponse


class TodoCreate(ContentModel):
    date: date


class TodoUpdate(BaseModel):
    content: Optional[str] = Field(default=None, max_length=CONTENT_MAX_LENGTH)
    status: Optional[str] = None

    @field_validator("content")
    @classmethod
    def validate_optional_content(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return ContentModel(content=value).content

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in VALID_STATUSES:
            raise ValueError("올바르지 않은 상태입니다.")
        return value

    @model_validator(mode="after")
    def require_change(self):
        if self.content is None and self.status is None:
            raise ValueError("변경할 값을 입력해 주세요.")
        return self


class RecurrenceCreate(ContentModel):
    start_date: date = Field(alias="startDate")
    end_date: Optional[date] = Field(default=None, alias="endDate")
    weekdays: List[int]
    model_config = ConfigDict(populate_by_name=True)

    @field_validator("weekdays")
    @classmethod
    def validate_weekdays(cls, values: List[int]) -> List[int]:
        normalized = sorted(set(values))
        if not normalized or any(value < 1 or value > 7 for value in normalized):
            raise ValueError("반복할 요일을 하나 이상 선택해 주세요.")
        return normalized

    @model_validator(mode="after")
    def validate_range(self):
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("종료일은 시작일보다 빠를 수 없습니다.")
        return self


class RecurrenceUpdate(BaseModel):
    content: Optional[str] = Field(default=None, max_length=CONTENT_MAX_LENGTH)
    start_date: Optional[date] = Field(default=None, alias="startDate")
    end_date: Optional[date] = Field(default=None, alias="endDate")
    end_date_set: bool = Field(default=False, alias="endDateSet")
    weekdays: Optional[List[int]] = None
    model_config = ConfigDict(populate_by_name=True)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: Optional[str]) -> Optional[str]:
        return ContentModel(content=value).content if value is not None else None

    @field_validator("weekdays")
    @classmethod
    def validate_weekdays(cls, values: Optional[List[int]]) -> Optional[List[int]]:
        if values is None:
            return None
        return RecurrenceCreate.validate_weekdays(values)


class OccurrenceUpdate(BaseModel):
    content: Optional[str] = Field(default=None, max_length=CONTENT_MAX_LENGTH)
    status: Optional[str] = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: Optional[str]) -> Optional[str]:
        return ContentModel(content=value).content if value is not None else None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        return TodoUpdate.validate_status(value)


def issue_session(db: DbSession, user: User) -> AuthResponse:
    token = secrets.token_urlsafe(48)
    db.add(UserSession(
        user_id=user.id,
        token_hash=hash_token(token),
        expires_at=utc_now() + timedelta(days=SESSION_DAYS),
    ))
    db.commit()
    return AuthResponse(
        session_token=token,
        user=UserResponse(id=user.id, email=user.email, name=user.name),
    )


def rule_occurs_on(rule: RecurrenceRule, occurrence_date: date) -> bool:
    return (
        occurrence_date >= rule.start_date
        and (rule.end_date is None or occurrence_date <= rule.end_date)
        and occurrence_date.isoweekday() in rule.weekdays
    )


def todo_payload(todo: Todo) -> dict:
    return {
        "key": f"single:{todo.id}",
        "kind": "single",
        "sourceId": todo.id,
        "content": todo.content,
        "date": todo.date.isoformat(),
        "status": todo.status,
        "createdAt": todo.created_at.isoformat(),
        "updatedAt": todo.updated_at.isoformat(),
    }


def recurrence_payload(
    rule: RecurrenceRule,
    occurrence_date: date,
    exception: Optional[RecurrenceException],
) -> dict:
    return {
        "key": f"recurring:{rule.id}:{occurrence_date.isoformat()}",
        "kind": "recurring",
        "sourceId": rule.id,
        "content": exception.content_override if exception and exception.content_override else rule.content,
        "date": occurrence_date.isoformat(),
        "status": exception.status_override if exception and exception.status_override else initial_status(occurrence_date),
        "createdAt": rule.created_at.isoformat(),
        "updatedAt": (exception.updated_at if exception else rule.updated_at).isoformat(),
        "recurrence": {
            "weekdays": rule.weekdays,
            "startDate": rule.start_date.isoformat(),
            "endDate": rule.end_date.isoformat() if rule.end_date else None,
        },
    }


def create_app(database_url: Optional[str] = None) -> FastAPI:
    resolved_database_url = database_url or os.getenv("DATABASE_URL", "sqlite:///./todos.db")
    connect_args = {"check_same_thread": False} if resolved_database_url.startswith("sqlite") else {}
    engine = create_engine(resolved_database_url, connect_args=connect_args)
    if resolved_database_url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)

    application = FastAPI(title="Todo API")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def get_db() -> Generator[DbSession, None, None]:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def get_current_session(
        authorization: Optional[str] = Header(default=None),
        db: DbSession = Depends(get_db),
    ) -> UserSession:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
        token = authorization.removeprefix("Bearer ").strip()
        user_session = db.scalar(select(UserSession).where(UserSession.token_hash == hash_token(token)))
        if user_session is None or user_session.expires_at <= utc_now():
            if user_session is not None:
                db.delete(user_session)
                db.commit()
            raise HTTPException(status_code=401, detail="로그인이 만료되었습니다.")
        return user_session

    def get_current_user(
        current_session: UserSession = Depends(get_current_session),
        db: DbSession = Depends(get_db),
    ) -> User:
        user = db.get(User, current_session.user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
        return user

    def owned_todo(db: DbSession, user_id: int, todo_id: int) -> Todo:
        todo = db.scalar(select(Todo).where(Todo.id == todo_id, Todo.user_id == user_id))
        if todo is None:
            raise HTTPException(status_code=404, detail="할 일을 찾을 수 없습니다.")
        return todo

    def owned_rule(db: DbSession, user_id: int, rule_id: int) -> RecurrenceRule:
        rule = db.scalar(select(RecurrenceRule).where(
            RecurrenceRule.id == rule_id, RecurrenceRule.user_id == user_id
        ))
        if rule is None:
            raise HTTPException(status_code=404, detail="반복 일정을 찾을 수 없습니다.")
        return rule

    @application.get("/")
    def root():
        return {"message": "Todo API"}

    @application.post("/auth/register", response_model=AuthResponse, status_code=201)
    def register(payload: RegisterRequest, db: DbSession = Depends(get_db)):
        email = payload.email.lower()
        if db.scalar(select(User).where(User.email == email)):
            raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다.")
        user = User(
            email=email,
            name=payload.name,
            password_hash=password_hasher.hash(payload.password),
        )
        db.add(user)
        db.flush()
        db.add(AuthIdentity(user_id=user.id, provider="password", provider_subject=email))
        db.commit()
        db.refresh(user)
        return issue_session(db, user)

    @application.post("/auth/login", response_model=AuthResponse)
    def login(payload: LoginRequest, db: DbSession = Depends(get_db)):
        user = db.scalar(select(User).where(User.email == payload.email.lower()))
        if user is None or user.password_hash is None:
            raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
        try:
            password_hasher.verify(user.password_hash, payload.password)
        except VerifyMismatchError:
            raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
        return issue_session(db, user)

    @application.post("/auth/google", response_model=AuthResponse)
    def google_login(payload: GoogleRequest, db: DbSession = Depends(get_db)):
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        if not client_id or not client_secret:
            raise HTTPException(status_code=503, detail="Google 로그인이 설정되지 않았습니다.")
        token_response = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": payload.code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": payload.redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
        if token_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Google 인증에 실패했습니다.")
        access_token = token_response.json().get("access_token")
        profile_response = httpx.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if profile_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Google 사용자 정보를 확인할 수 없습니다.")
        profile = profile_response.json()
        subject = profile.get("sub")
        email = str(profile.get("email", "")).lower()
        if not subject or not email or not profile.get("email_verified"):
            raise HTTPException(status_code=401, detail="검증된 Google 이메일이 필요합니다.")
        identity = db.scalar(select(AuthIdentity).where(
            AuthIdentity.provider == "google", AuthIdentity.provider_subject == subject
        ))
        if identity:
            user = db.get(User, identity.user_id)
            return issue_session(db, user)
        if db.scalar(select(User).where(User.email == email)):
            raise HTTPException(
                status_code=409,
                detail="같은 이메일 계정이 있습니다. 기존 방식으로 로그인해 주세요.",
            )
        user = User(email=email, name=profile.get("name") or email.split("@")[0])
        db.add(user)
        db.flush()
        db.add(AuthIdentity(user_id=user.id, provider="google", provider_subject=subject))
        db.commit()
        db.refresh(user)
        return issue_session(db, user)

    @application.get("/auth/me", response_model=UserResponse)
    def me(user: User = Depends(get_current_user)):
        return UserResponse(id=user.id, email=user.email, name=user.name)

    @application.post("/auth/logout", status_code=204)
    def logout(
        current_session: UserSession = Depends(get_current_session),
        db: DbSession = Depends(get_db),
    ):
        db.delete(current_session)
        db.commit()
        return Response(status_code=204)

    @application.get("/todos")
    def list_todos(
        date_value: date = Query(alias="date"),
        filter_value: str = Query(default="all", alias="filter", pattern="^(all|active|completed)$"),
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=6, alias="pageSize", ge=1, le=100),
        user: User = Depends(get_current_user),
        db: DbSession = Depends(get_db),
    ):
        items = [todo_payload(todo) for todo in db.scalars(select(Todo).where(
            Todo.user_id == user.id, Todo.date == date_value
        )).all()]
        rules = db.scalars(select(RecurrenceRule).where(
            RecurrenceRule.user_id == user.id,
            RecurrenceRule.start_date <= date_value,
        )).all()
        for rule in rules:
            if not rule_occurs_on(rule, date_value):
                continue
            exception = db.scalar(select(RecurrenceException).where(
                RecurrenceException.rule_id == rule.id,
                RecurrenceException.occurrence_date == date_value,
            ))
            if exception and exception.is_cancelled:
                continue
            items.append(recurrence_payload(rule, date_value, exception))
        if filter_value == "active":
            items = [item for item in items if item["status"] == "inProgress"]
        elif filter_value == "completed":
            items = [item for item in items if item["status"] == "completed"]
        items.sort(key=lambda item: item["createdAt"], reverse=True)
        items.sort(key=lambda item: STATUS_PRIORITY[item["status"]])
        total = len(items)
        total_pages = max(1, ceil(total / page_size))
        safe_page = min(page, total_pages)
        offset = (safe_page - 1) * page_size
        return {
            "items": items[offset:offset + page_size],
            "page": safe_page,
            "pageSize": page_size,
            "total": total,
            "totalPages": total_pages,
        }

    @application.get("/todos/{todo_id}")
    def get_todo(todo_id: int, user: User = Depends(get_current_user), db: DbSession = Depends(get_db)):
        return todo_payload(owned_todo(db, user.id, todo_id))

    @application.post("/todos", status_code=201)
    def create_todo(payload: TodoCreate, user: User = Depends(get_current_user), db: DbSession = Depends(get_db)):
        todo = Todo(
            user_id=user.id,
            content=payload.content,
            date=payload.date,
            status=initial_status(payload.date),
        )
        db.add(todo)
        db.commit()
        db.refresh(todo)
        return todo_payload(todo)

    @application.put("/todos/{todo_id}")
    def update_todo(
        todo_id: int,
        payload: TodoUpdate,
        user: User = Depends(get_current_user),
        db: DbSession = Depends(get_db),
    ):
        todo = owned_todo(db, user.id, todo_id)
        if payload.content is not None:
            todo.content = payload.content
            if payload.status is None:
                todo.status = initial_status(todo.date)
        if payload.status is not None:
            todo.status = payload.status
        todo.updated_at = utc_now()
        db.commit()
        db.refresh(todo)
        return todo_payload(todo)

    @application.delete("/todos/{todo_id}", status_code=204)
    def delete_todo(todo_id: int, user: User = Depends(get_current_user), db: DbSession = Depends(get_db)):
        db.delete(owned_todo(db, user.id, todo_id))
        db.commit()
        return Response(status_code=204)

    @application.post("/recurrences", status_code=201)
    def create_recurrence(
        payload: RecurrenceCreate,
        user: User = Depends(get_current_user),
        db: DbSession = Depends(get_db),
    ):
        rule = RecurrenceRule(
            user_id=user.id,
            content=payload.content,
            start_date=payload.start_date,
            end_date=payload.end_date,
            weekdays_csv="",
        )
        rule.weekdays = payload.weekdays
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return {
            "id": rule.id,
            "content": rule.content,
            "startDate": rule.start_date.isoformat(),
            "endDate": rule.end_date.isoformat() if rule.end_date else None,
            "weekdays": rule.weekdays,
        }

    @application.get("/recurrences/{rule_id}")
    def get_recurrence(rule_id: int, user: User = Depends(get_current_user), db: DbSession = Depends(get_db)):
        rule = owned_rule(db, user.id, rule_id)
        return {
            "id": rule.id,
            "content": rule.content,
            "startDate": rule.start_date.isoformat(),
            "endDate": rule.end_date.isoformat() if rule.end_date else None,
            "weekdays": rule.weekdays,
        }

    @application.put("/recurrences/{rule_id}")
    def update_recurrence(
        rule_id: int,
        payload: RecurrenceUpdate,
        user: User = Depends(get_current_user),
        db: DbSession = Depends(get_db),
    ):
        rule = owned_rule(db, user.id, rule_id)
        if payload.content is not None:
            rule.content = payload.content
        if payload.start_date is not None:
            rule.start_date = payload.start_date
        if payload.end_date_set:
            rule.end_date = payload.end_date
        if payload.weekdays is not None:
            rule.weekdays = payload.weekdays
        if rule.end_date is not None and rule.end_date < rule.start_date:
            raise HTTPException(status_code=422, detail="종료일은 시작일보다 빠를 수 없습니다.")
        rule.updated_at = utc_now()
        exceptions = db.scalars(select(RecurrenceException).where(
            RecurrenceException.rule_id == rule.id
        )).all()
        for exception in exceptions:
            if not rule_occurs_on(rule, exception.occurrence_date):
                db.delete(exception)
        db.commit()
        return get_recurrence(rule_id, user, db)

    @application.delete("/recurrences/{rule_id}", status_code=204)
    def delete_recurrence(
        rule_id: int,
        user: User = Depends(get_current_user),
        db: DbSession = Depends(get_db),
    ):
        db.delete(owned_rule(db, user.id, rule_id))
        db.commit()
        return Response(status_code=204)

    @application.put("/recurrences/{rule_id}/occurrences/{occurrence_date}")
    def update_occurrence(
        rule_id: int,
        occurrence_date: date,
        payload: OccurrenceUpdate,
        user: User = Depends(get_current_user),
        db: DbSession = Depends(get_db),
    ):
        rule = owned_rule(db, user.id, rule_id)
        if not rule_occurs_on(rule, occurrence_date):
            raise HTTPException(status_code=404, detail="해당 날짜의 반복 일정을 찾을 수 없습니다.")
        exception = db.scalar(select(RecurrenceException).where(
            RecurrenceException.rule_id == rule.id,
            RecurrenceException.occurrence_date == occurrence_date,
        ))
        if exception is None:
            exception = RecurrenceException(rule_id=rule.id, occurrence_date=occurrence_date)
            db.add(exception)
        if payload.content is not None:
            exception.content_override = payload.content
        if payload.status is not None:
            exception.status_override = payload.status
        exception.is_cancelled = False
        exception.updated_at = utc_now()
        db.commit()
        db.refresh(exception)
        return recurrence_payload(rule, occurrence_date, exception)

    @application.delete("/recurrences/{rule_id}/occurrences/{occurrence_date}", status_code=204)
    def delete_occurrence(
        rule_id: int,
        occurrence_date: date,
        user: User = Depends(get_current_user),
        db: DbSession = Depends(get_db),
    ):
        rule = owned_rule(db, user.id, rule_id)
        if not rule_occurs_on(rule, occurrence_date):
            raise HTTPException(status_code=404, detail="해당 날짜의 반복 일정을 찾을 수 없습니다.")
        exception = db.scalar(select(RecurrenceException).where(
            RecurrenceException.rule_id == rule.id,
            RecurrenceException.occurrence_date == occurrence_date,
        ))
        if exception is None:
            exception = RecurrenceException(rule_id=rule.id, occurrence_date=occurrence_date)
            db.add(exception)
        exception.is_cancelled = True
        exception.updated_at = utc_now()
        db.commit()
        return Response(status_code=204)

    return application


app = create_app()
