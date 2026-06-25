from __future__ import annotations

from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from models import RecurrenceException, RecurrenceRule
from schemas import OccurrenceUpdate, RecurrenceCreate, RecurrenceUpdate
from services.todo_service import recurrence_payload, rule_occurs_on
from time_utils import utc_now


def owned_rule(db: DbSession, user_id: int, rule_id: int) -> RecurrenceRule:
    rule = db.scalar(
        select(RecurrenceRule).where(RecurrenceRule.id == rule_id, RecurrenceRule.user_id == user_id)
    )
    if rule is None:
        raise HTTPException(status_code=404, detail="반복 일정을 찾을 수 없습니다.")
    return rule


def recurrence_rule_payload(rule: RecurrenceRule) -> dict:
    return {
        "id": rule.id,
        "content": rule.content,
        "startDate": rule.start_date.isoformat(),
        "endDate": rule.end_date.isoformat() if rule.end_date else None,
        "weekdays": rule.weekdays,
    }


def create_recurrence(db: DbSession, user_id: int, payload: RecurrenceCreate) -> dict:
    rule = RecurrenceRule(
        user_id=user_id,
        content=payload.content,
        start_date=payload.start_date,
        end_date=payload.end_date,
        weekdays_csv="",
    )
    rule.weekdays = payload.weekdays
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return recurrence_rule_payload(rule)


def get_recurrence(db: DbSession, user_id: int, rule_id: int) -> dict:
    return recurrence_rule_payload(owned_rule(db, user_id, rule_id))


def update_recurrence(db: DbSession, user_id: int, rule_id: int, payload: RecurrenceUpdate) -> dict:
    rule = owned_rule(db, user_id, rule_id)
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
    exceptions = db.scalars(
        select(RecurrenceException).where(RecurrenceException.rule_id == rule.id)
    ).all()
    for exception in exceptions:
        if not rule_occurs_on(rule, exception.occurrence_date):
            db.delete(exception)
    db.commit()
    return recurrence_rule_payload(rule)


def delete_recurrence(db: DbSession, user_id: int, rule_id: int) -> None:
    db.delete(owned_rule(db, user_id, rule_id))
    db.commit()


def update_occurrence(
    db: DbSession,
    user_id: int,
    rule_id: int,
    occurrence_date: date,
    payload: OccurrenceUpdate,
) -> dict:
    rule = owned_rule(db, user_id, rule_id)
    if not rule_occurs_on(rule, occurrence_date):
        raise HTTPException(status_code=404, detail="해당 날짜의 반복 일정을 찾을 수 없습니다.")
    exception = db.scalar(
        select(RecurrenceException).where(
            RecurrenceException.rule_id == rule.id,
            RecurrenceException.occurrence_date == occurrence_date,
        )
    )
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


def delete_occurrence(db: DbSession, user_id: int, rule_id: int, occurrence_date: date) -> None:
    rule = owned_rule(db, user_id, rule_id)
    if not rule_occurs_on(rule, occurrence_date):
        raise HTTPException(status_code=404, detail="해당 날짜의 반복 일정을 찾을 수 없습니다.")
    exception = db.scalar(
        select(RecurrenceException).where(
            RecurrenceException.rule_id == rule.id,
            RecurrenceException.occurrence_date == occurrence_date,
        )
    )
    if exception is None:
        exception = RecurrenceException(rule_id=rule.id, occurrence_date=occurrence_date)
        db.add(exception)
    exception.is_cancelled = True
    exception.updated_at = utc_now()
    db.commit()
