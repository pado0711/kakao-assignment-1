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
│   ├── main.py            # FastAPI 앱 팩토리, 미들웨어, 라우터 조립
│   ├── constants.py       # 공통 상수와 상태 우선순위
│   ├── database.py        # SQLAlchemy Base, 엔진, 요청 단위 DB 세션
│   ├── dependencies.py    # 인증된 세션/사용자 의존성
│   ├── models.py          # SQLAlchemy Entity
│   ├── schemas.py         # Pydantic 요청/응답 DTO
│   ├── security.py        # 비밀번호 해시와 세션 토큰 해시
│   ├── time_utils.py      # UTC/KST 날짜 유틸리티
│   ├── routers/           # HTTP 라우팅과 의존성 연결
│   ├── services/          # 인증, Todo, 반복 일정 비즈니스 로직
│   └── tests/
└── docs/
```

## 데이터 흐름

- Server Component 조회: `page.tsx → actions.ts → FastAPI → SQLite`
- 브라우저 변경: `Client Component → /api Route Handler → FastAPI → SQLite`
- 세션 토큰은 Next.js Route Handler만 받고 HttpOnly 쿠키에 저장한다.
- FastAPI의 모든 Todo/반복 쿼리는 인증된 `user_id`를 조건으로 사용한다.
- FastAPI 내부 흐름은 `router → dependency → service → model/database` 순서를 따른다.

## 백엔드 계층 책임

- `main.py`는 환경 설정, DB 초기화, CORS, 라우터 등록만 담당한다.
- `routers/`는 HTTP 경로, 요청 DTO, 응답 코드, FastAPI 의존성 연결만 담당한다.
- `services/`는 소유권 조건이 포함된 조회, 상태 변경, 반복 occurrence 계산 등 비즈니스 규칙을 담당한다.
- `models.py`는 DB 테이블과 관계만 정의하고, `schemas.py`는 API 입출력 검증만 담당한다.
- `dependencies.py`는 Bearer 세션 검증과 현재 사용자 조회를 담당한다.
- `database.py`는 요청 단위 세션을 제공하고 SQLite 외래키 제약을 활성화한다.

## 반복 일정

반복 일정을 날짜별 행으로 무한 생성하지 않는다. `recurrence_rules`에 선택 요일과 기간을 저장하고, 특정 날짜 조회 시 occurrence를 계산한다. 완료·내용 수정·이번 일정 삭제는 `recurrence_exceptions`에 저장한다.

## 설계 규칙

- Server Component를 기본으로 하고 이벤트가 필요한 최소 영역만 Client Component로 둔다.
- 브라우저가 FastAPI 주소나 세션 토큰에 직접 접근하지 않는다.
- 다른 사용자의 리소스는 존재 여부를 노출하지 않고 404로 처리한다.
- DB 변경은 commit 실패 시 rollback 가능하도록 요청 단위 세션을 사용한다.
