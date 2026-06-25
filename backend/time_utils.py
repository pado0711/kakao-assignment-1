from datetime import date, datetime

from constants import KST


def utc_now() -> datetime:
    return datetime.utcnow()


def kst_today() -> date:
    return datetime.now(KST).date()


def initial_status(todo_date: date) -> str:
    return "inProgress" if todo_date == kst_today() else "default"
