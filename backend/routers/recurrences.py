from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session as DbSession

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import OccurrenceUpdate, RecurrenceCreate, RecurrenceUpdate
from services import recurrence_service

router = APIRouter(prefix="/recurrences", tags=["recurrences"])


@router.post("", status_code=201)
def create_recurrence(
    payload: RecurrenceCreate,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    return recurrence_service.create_recurrence(db, user.id, payload)


@router.get("/{rule_id}")
def get_recurrence(rule_id: int, user: User = Depends(get_current_user), db: DbSession = Depends(get_db)):
    return recurrence_service.get_recurrence(db, user.id, rule_id)


@router.put("/{rule_id}")
def update_recurrence(
    rule_id: int,
    payload: RecurrenceUpdate,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    return recurrence_service.update_recurrence(db, user.id, rule_id, payload)


@router.delete("/{rule_id}", status_code=204)
def delete_recurrence(
    rule_id: int,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    recurrence_service.delete_recurrence(db, user.id, rule_id)
    return Response(status_code=204)


@router.put("/{rule_id}/occurrences/{occurrence_date}")
def update_occurrence(
    rule_id: int,
    occurrence_date: date,
    payload: OccurrenceUpdate,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    return recurrence_service.update_occurrence(db, user.id, rule_id, occurrence_date, payload)


@router.delete("/{rule_id}/occurrences/{occurrence_date}", status_code=204)
def delete_occurrence(
    rule_id: int,
    occurrence_date: date,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    recurrence_service.delete_occurrence(db, user.id, rule_id, occurrence_date)
    return Response(status_code=204)
