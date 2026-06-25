from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import configure_database
from routers import auth, recurrences, todos
from time_utils import kst_today

load_dotenv()


def create_app(database_url: Optional[str] = None) -> FastAPI:
    resolved_database_url = database_url or os.getenv("DATABASE_URL", "sqlite:///./todos.db")
    configure_database(resolved_database_url)

    application = FastAPI(title="Todo API")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get("/")
    def root():
        return {"message": "Todo API"}

    application.include_router(auth.router)
    application.include_router(todos.router)
    application.include_router(recurrences.router)
    return application


app = create_app()

__all__ = ["app", "create_app", "kst_today"]
