from __future__ import annotations

from datetime import date
from math import ceil

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from constants import STATUS_PRIORITY
from models import RecurrenceException, RecurrenceRule, Todo
from schemas import TodoCreate, TodoUpdate
from time_utils import initial_status, utc_now


def owned_todo(db: DbSession, user_id: int, todo_id: int) -> Todo:
    todo = db.scalar(select(Todo).where(Todo.id == todo_id, Todo.user_id == user_id))
    if todo is None:
        raise HTTPException(status_code=404, detail="할 일을 찾을 수 없습니다.")
    return todo


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
    exception: RecurrenceException | None,
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


def list_todos(
    db: DbSession,
    user_id: int,
    date_value: date,
    filter_value: str,
    page: int,
    page_size: int,
) -> dict:
    items = [
        todo_payload(todo)
        for todo in db.scalars(select(Todo).where(Todo.user_id == user_id, Todo.date == date_value)).all()
    ]
    rules = db.scalars(
        select(RecurrenceRule).where(
            RecurrenceRule.user_id == user_id,
            RecurrenceRule.start_date <= date_value,
        )
    ).all()
    for rule in rules:
        if not rule_occurs_on(rule, date_value):
            continue
        exception = db.scalar(
            select(RecurrenceException).where(
                RecurrenceException.rule_id == rule.id,
                RecurrenceException.occurrence_date == date_value,
            )
        )
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
        "items": items[offset : offset + page_size],
        "page": safe_page,
        "pageSize": page_size,
        "total": total,
        "totalPages": total_pages,
    }


def create_todo(db: DbSession, user_id: int, payload: TodoCreate) -> dict:
    todo = Todo(
        user_id=user_id,
        content=payload.content,
        date=payload.date,
        status=initial_status(payload.date),
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo_payload(todo)


def update_todo(db: DbSession, user_id: int, todo_id: int, payload: TodoUpdate) -> dict:
    todo = owned_todo(db, user_id, todo_id)
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


def delete_todo(db: DbSession, user_id: int, todo_id: int) -> None:
    db.delete(owned_todo(db, user_id, todo_id))
    db.commit()
