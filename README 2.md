# Kakao Assignment 1 - Todo App

[카카오테크캠퍼스] 1주차 과제로 구현한 Vanilla JS 기반 Todo 웹 애플리케이션입니다.


## 테스트 가능한 URL
https://kakao-assignment-1.vercel.app/


## Overview

이 프로젝트는 HTML, CSS, Vanilla JavaScript만 사용해 Todo 생성, 수정, 완료, 삭제, 날짜별 보기, 상태별 필터, 페이지네이션, 로컬스토리지 저장을 구현합니다.

추후 React와 TypeScript로 리팩토링하기 쉽도록 Todo 도메인 코드는 `features/todo`에 모으고, 날짜 계산, 모달, 페이지네이션처럼 재사용 가능한 코드는 `shared`로 분리했습니다.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Node.js test runner
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

### 2. Start App

```bash
npm run start
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:3000
```

## Test

```bash
npm test
```

테스트는 DOM에 직접 의존하지 않는 Todo 비즈니스 로직과 저장소 변환 로직을 중심으로 검증합니다.

## Project Structure

```text
kakao-assignment-1/
├── css/
│   └── styles.css
├── docs/
│   ├── architecture_spec.md
│   ├── error_case.md
│   ├── functional_spec.md
│   ├── nonfunctional_spec.md
│   └── todo_test_cases.md
├── js/
│   ├── app.js
│   ├── features/
│   │   └── todo/
│   │       ├── todoConstants.js
│   │       ├── todoService.js
│   │       ├── todoState.js
│   │       ├── todoStorage.js
│   │       └── todoView.js
│   └── shared/
│       ├── date.js
│       ├── modal.js
│       └── pagination.js
├── tests/
│   └── todoService.test.js
├── index.html
├── package-lock.json
└── package.json
```

## Architecture

### `js/app.js`

앱의 진입점입니다. 초기 상태를 만들고, 이벤트를 연결하고, 상태 변경 후 렌더링을 호출합니다.

### `js/features/todo/todoService.js`

Todo의 핵심 비즈니스 로직을 담당합니다.

- 입력값 검증
- Todo 생성
- Todo 수정
- 완료 상태 토글
- 날짜별 목록 정렬
- 상태별 목록 정렬
- 저장 데이터 직렬화 및 기존 데이터 정규화

### `js/features/todo/todoStorage.js`

localStorage 입출력을 담당합니다.

- 저장 가능 여부 확인
- 저장된 Todo 로드
- Todo 저장
- JSON 파싱 실패 처리
- 저장 실패 처리

### `js/features/todo/todoState.js`

앱 상태를 생성하고 변경합니다.

- 전체 Todo 목록
- 오늘 날짜
- 선택한 날짜
- 활성 필터
- 현재 뷰 모드
- 현재 페이지
- 수정 중인 Todo ID

### `js/features/todo/todoView.js`

DOM 렌더링과 화면 입력 상태를 담당합니다.

- Todo 목록 렌더링
- 수정 input 렌더링
- 필터 탭 활성화
- 날짜 라벨 표시
- 입력창 에러 표시

### `js/shared`

여러 기능에서 재사용할 수 있는 공통 로직입니다.

- `date.js`: KST 기준 날짜 계산
- `modal.js`: 사용자 알림 Modal
- `pagination.js`: 페이지 계산 및 버튼 렌더링

## Data Model

내부 Todo 상태는 React/TypeScript 전환을 고려해 영문 `status`를 사용합니다.

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

localStorage에는 기존 명세와 테스트 케이스 호환을 위해 `state` 라벨도 함께 저장합니다.

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

상세 명세는 `docs/` 디렉터리에서 확인할 수 있습니다.

- [기능 명세](./docs/functional_spec.md)
- [비기능 요구사항](./docs/nonfunctional_spec.md)
- [에러 케이스](./docs/error_case.md)
- [아키텍처](./docs/architecture_spec.md)
- [테스트 케이스](./docs/todo_test_cases.md)
