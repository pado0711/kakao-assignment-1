from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from constants import CONTENT_MAX_LENGTH, PASSWORD_MIN_LENGTH, VALID_STATUSES


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
