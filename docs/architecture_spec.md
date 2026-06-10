# 아키텍처 파일 구조 문서

**Todo 웹 서비스 | React + Vite**

React + Vite 단일 Todo 앱이며, 상태 로직은 Custom Hook으로 분리하고 화면 표현은 컴포넌트로 구성한다. Todo 도메인 로직은 DOM에 의존하지 않는 순수 함수로 유지한다.

## 1. 기술 스택

- React
- Vite
- JavaScript + JSX
- CSS
- Vitest
- React Testing Library
- localStorage

## 2. 파일 구조

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

## 3. 계층별 책임

### `src/main.jsx`

Vite의 React 진입점이다. `ReactDOM.createRoot`로 `App`을 렌더링한다.

### `src/App.jsx`

앱 조합 계층이다. 직접 상태 로직을 늘리지 않고 `useTodos`, `useView`, `useModal`을 조합하고 JSX 구조를 반환한다.

### `src/hooks`

상태와 사용자 액션 흐름을 관리한다.

- `useTodos.js`: Todo 목록, 수정 상태, localStorage 저장 흐름
- `useView.js`: 선택 날짜, 필터, 보기 모드, 현재 페이지
- `useModal.js`: 모달 메시지 상태

### `src/components`

화면 표현 계층이다. DOM 직접 접근 없이 props와 이벤트 콜백으로 동작한다.

### `src/features/todo`

Todo 도메인 순수 로직이다. React와 DOM에 의존하지 않는다.

### `src/shared`

날짜 계산, 페이지 계산처럼 재사용 가능한 순수 유틸리티를 둔다.

## 4. 상태 모델

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

## 5. 설계 규칙

- 컴포넌트에서 `document.querySelector`, `innerHTML` 등으로 React 관리 DOM을 직접 수정하지 않는다.
- 상태는 불변 업데이트로 변경한다.
- 새 상태 로직은 `App.jsx`에 직접 추가하지 않고 관련 Hook에 둔다.
- Todo 도메인 규칙은 `todoService.js`에 모은다.
- 저장소 입출력과 데이터 정규화는 `todoStorage.js`와 `todoService.js`를 통해 처리한다.
