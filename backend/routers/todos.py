from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session as DbSession

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import TodoCreate, TodoUpdate
from services import todo_service

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("")
def list_todos(
    date_value: date = Query(alias="date"),
    filter_value: str = Query(default="all", alias="filter", pattern="^(all|active|completed)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, alias="pageSize", ge=1, le=100),
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    return todo_service.list_todos(db, user.id, date_value, filter_value, page, page_size)


@router.get("/{todo_id}")
def get_todo(todo_id: int, user: User = Depends(get_current_user), db: DbSession = Depends(get_db)):
    return todo_service.todo_payload(todo_service.owned_todo(db, user.id, todo_id))


@router.post("", status_code=201)
def create_todo(
    payload: TodoCreate,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    return todo_service.create_todo(db, user.id, payload)


@router.put("/{todo_id}")
def update_todo(
    todo_id: int,
    payload: TodoUpdate,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    return todo_service.update_todo(db, user.id, todo_id, payload)


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, user: User = Depends(get_current_user), db: DbSession = Depends(get_db)):
    todo_service.delete_todo(db, user.id, todo_id)
    return Response(status_code=204)
