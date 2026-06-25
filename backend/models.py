from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from constants import CONTENT_MAX_LENGTH
from database import Base
from time_utils import utc_now


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(80))
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


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
