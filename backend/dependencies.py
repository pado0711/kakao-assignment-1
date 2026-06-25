from __future__ import annotations

from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from database import get_db
from models import User, UserSession
from security import hash_token
from time_utils import utc_now


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
