# 아키텍처 문서

**Todo 웹 서비스 | Next.js + FastAPI 모노레포**

## 기술 스택

- Frontend: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, Axios
- Backend: FastAPI, SQLAlchemy 2, Pydantic 2, SQLite
- 인증: 이메일/비밀번호, 서버 세션, HttpOnly 쿠키
- 테스트: Vitest, React Testing Library, Pytest

## 구조

```text
kakao-assignment-1/
├── frontend/              # 신규 Next.js 애플리케이션
│   ├── app/               # 페이지, Server Actions, Route Handlers
│   ├── components/        # 상호작용 가능한 Client Components
│   ├── lib/               # 서버 API와 날짜 유틸리티
│   └── types/             # 공개 TypeScript 타입
├── backend/               # FastAPI와 SQLite
│   ├── main.py            # 모델, 스키마, 인증, CRUD
│   └── tests/
└── docs/
```

## 데이터 흐름

- Server Component 조회: `page.tsx → actions.ts → FastAPI → SQLite`
- 브라우저 변경: `Client Component → /api Route Handler → FastAPI → SQLite`
- 세션 토큰은 Next.js Route Handler만 받고 HttpOnly 쿠키에 저장한다.
- FastAPI의 모든 Todo/반복 쿼리는 인증된 `user_id`를 조건으로 사용한다.

## 반복 일정

반복 일정을 날짜별 행으로 무한 생성하지 않는다. `recurrence_rules`에 선택 요일과 기간을 저장하고, 특정 날짜 조회 시 occurrence를 계산한다. 완료·내용 수정·이번 일정 삭제는 `recurrence_exceptions`에 저장한다.

## 설계 규칙

- Server Component를 기본으로 하고 이벤트가 필요한 최소 영역만 Client Component로 둔다.
- 브라우저가 FastAPI 주소나 세션 토큰에 직접 접근하지 않는다.
- 다른 사용자의 리소스는 존재 여부를 노출하지 않고 404로 처리한다.
- DB 변경은 commit 실패 시 rollback 가능하도록 요청 단위 세션을 사용한다.
