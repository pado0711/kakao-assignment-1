from __future__ import annotations

import secrets
from datetime import timedelta

from argon2.exceptions import VerifyMismatchError
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from constants import SESSION_DAYS
from models import User, UserSession
from schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from security import hash_token, password_hasher
from time_utils import utc_now


def user_payload(user: User) -> UserResponse:
    return UserResponse(id=user.id, email=user.email, name=user.name)


def issue_session(db: DbSession, user: User) -> AuthResponse:
    token = secrets.token_urlsafe(48)
    db.add(
        UserSession(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=utc_now() + timedelta(days=SESSION_DAYS),
        )
    )
    db.commit()
    return AuthResponse(session_token=token, user=user_payload(user))


def register_user(db: DbSession, payload: RegisterRequest) -> AuthResponse:
    email = payload.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다.")
    user = User(email=email, name=payload.name, password_hash=password_hasher.hash(payload.password))
    db.add(user)
    db.flush()
    db.commit()
    db.refresh(user)
    return issue_session(db, user)


def login_user(db: DbSession, payload: LoginRequest) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or user.password_hash is None:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    try:
        password_hasher.verify(user.password_hash, payload.password)
    except VerifyMismatchError:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    return issue_session(db, user)


def logout_session(db: DbSession, current_session: UserSession) -> None:
    db.delete(current_session)
    db.commit()
