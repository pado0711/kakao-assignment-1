# Kakao Assignment 1 - Todo App

[카카오테크캠퍼스] 1주차 과제로 구현한 React + Vite 기반 Todo 웹 애플리케이션입니다.

## 테스트 가능한 URL

https://kakao-assignment-1.vercel.app/

## Overview

이 프로젝트는 React, Vite, JavaScript, CSS를 사용해 Todo 생성, 수정, 완료, 삭제, 날짜별 보기, 상태별 필터, 페이지네이션, 로컬스토리지 저장을 구현합니다.

상태 흐름은 Custom Hook으로 분리하고, 화면 표현은 React 컴포넌트로 구성했습니다. Todo 도메인 로직과 localStorage 변환 로직은 DOM에 의존하지 않는 순수 모듈로 유지합니다.

## Tech Stack

- React
- Vite
- JavaScript + JSX
- CSS
- Vitest
- React Testing Library
- localStorage

## Features

- Todo 생성
- Todo 내용 수정
- Todo 완료 및 완료 해제
- Todo 삭제 전 확인
- KST 기준 날짜별 Todo 보기
- 전체, 진행중, 완료 상태별 필터
- 페이지당 6개 Todo 페이지네이션
- localStorage 저장 및 새로고침 후 데이터 유지
- 저장 실패, 파싱 실패, 빈 입력 등 에러 처리
- Modal 기반 사용자 알림

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Dev Server

```bash
npm run dev
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:5173
```

## Scripts

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run test     # Vitest 테스트
npm run coverage # 커버리지 리포트
npm run lint     # ESLint
```

## Project Structure

```text
kakao-assignment-1/
├── docs/
├── src/
│   ├── App.css
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   │   ├── ListControls.jsx
│   │   ├── Modal.jsx
│   │   ├── Pagination.jsx
│   │   ├── TodoForm.jsx
│   │   ├── TodoItem.jsx
│   │   └── TodoList.jsx
│   ├── features/
│   │   └── todo/
│   │       ├── todoConstants.js
│   │       ├── todoService.js
│   │       └── todoStorage.js
│   ├── hooks/
│   │   ├── useModal.js
│   │   ├── useTodos.js
│   │   └── useView.js
│   └── shared/
│       ├── date.js
│       └── pagination.js
├── tests/
│   ├── App.test.jsx
│   ├── setup.js
│   └── todoService.test.js
├── index.html
├── package-lock.json
├── package.json
└── vite.config.js
```

## Architecture

### `src/main.jsx`

React root를 생성하고 `App`을 렌더링하는 Vite 진입점입니다.

### `src/App.jsx`

Custom Hook과 컴포넌트를 조합합니다. 상태 변경 로직을 직접 보유하지 않고 `useTodos`, `useView`, `useModal`의 반환값을 연결합니다.

### `src/hooks/useTodos.js`

Todo 목록과 수정 중인 Todo ID를 관리합니다.

- Todo 생성, 수정, 완료 토글, 삭제
- `useEffect` 기반 localStorage 저장
- 기존 저장 데이터 로드 및 정규화 데이터 재저장
- 저장 실패 메시지 전달

### `src/hooks/useView.js`

목록 보기 상태를 관리합니다.

- 선택 날짜
- 활성 필터
- 날짜별/필터별 보기 모드
- 현재 페이지
- KST 기준 오늘 날짜 갱신

### `src/hooks/useModal.js`

모달 메시지 표시와 닫기 상태를 관리합니다.

### `src/components`

화면 표현을 담당합니다.

- `TodoForm.jsx`: Todo 입력 폼
- `ListControls.jsx`: 날짜 이동과 상태 필터 탭
- `TodoList.jsx`, `TodoItem.jsx`: Todo 목록과 항목
- `Pagination.jsx`: 페이지 이동
- `Modal.jsx`: 사용자 알림 모달

### `src/features/todo`

Todo 도메인 순수 로직입니다.

- 입력값 검증
- Todo 생성, 수정, 완료 토글
- 날짜별/상태별 정렬
- 저장 데이터 직렬화
- 기존 데이터 정규화

### `src/shared`

날짜 계산과 페이지네이션 계산처럼 여러 영역에서 쓰는 공통 순수 로직입니다.

## Data Model

내부 Todo 상태는 영문 `status`를 사용합니다.

```ts
type TodoStatus = 'default' | 'inProgress' | 'completed';
type TodoFilter = 'all' | TodoStatus;

interface Todo {
  id: string;
  content: string;
  date: string;
  createdAt: number;
  updatedAt: number;
  status: TodoStatus;
}
```

localStorage에는 기존 명세와 데이터 호환을 위해 `state` 라벨도 함께 저장합니다.

```json
{
  "id": "uuid",
  "content": "할 일",
  "date": "2026-06-03",
  "createdAt": 1780412400000,
  "updatedAt": 1780412400000,
  "status": "inProgress",
  "state": "진행중"
}
```

저장된 데이터가 손상되었거나 JSON 파싱에 실패하면 빈 배열로 시작하고 사용자에게 Modal로 안내합니다.

## Documents

- [기능 명세](./docs/functional_spec.md)
- [비기능 요구사항](./docs/nonfunctional_spec.md)
- [에러 케이스](./docs/error_case.md)
- [아키텍처](./docs/architecture_spec.md)
- [테스트 케이스](./docs/todo_test_cases.md)
- [마이그레이션](./docs/migrations.md)
