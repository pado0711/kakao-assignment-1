from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session as DbSession

from database import get_db
from dependencies import get_current_session, get_current_user
from models import User, UserSession
from schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from services.auth_service import login_user, logout_session, register_user, user_payload

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: DbSession = Depends(get_db)):
    return register_user(db, payload)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: DbSession = Depends(get_db)):
    return login_user(db, payload)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user_payload(user)


@router.post("/logout", status_code=204)
def logout(
    current_session: UserSession = Depends(get_current_session),
    db: DbSession = Depends(get_db),
):
    logout_session(db, current_session)
    return Response(status_code=204)
