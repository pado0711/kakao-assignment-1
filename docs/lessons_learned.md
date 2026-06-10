
1. 객체 생성 방식
## 현재 코드 분석

- `js/features/todo/todoService.js`의 `createTodo`, `normalizeTodo`는 Todo 도메인 객체를 생성하는 진입점을 함수로 분리하고 있다.
- `js/features/todo/todoState.js`의 `createTodoState`도 앱 상태 객체를 만드는 진입점을 함수로 분리하고 있다.
- 다만 `validateContent`, `loadTodos`, `saveTodos`처럼 성공/실패 결과 객체를 반환하는 곳은 object literal을 직접 반환한다.
- 테스트의 `tests/todoService.test.js`는 `createTodo(overrides)` 헬퍼 안에서 object literal과 spread override를 사용한다.

## 케이스 정리

### 케이스 1. Todo 도메인 객체 생성

- 위치: `js/features/todo/todoService.js`의 `createTodo`, `normalizeTodo`
- 현재 상태: 함수에서 필요한 인자인 `content`, `date`, `today`를 받아 `id`, `createdAt`, `updatedAt`, `status`를 보완해 Todo 객체를 생성한다.
- 판단: 좋은 방향이다. Todo 객체는 필수 필드와 기본값 규칙이 많으므로 호출부에서 object literal을 직접 만들면 누락이나 상태값 불일치가 생기기 쉽다.
- 유지 기준: 새 Todo를 만들 때는 호출부에서 `{ id, content, date, ... }`를 직접 조립하지 않고 `createTodo` 또는 정규화 함수만 사용한다.

### 케이스 2. Todo 수정/토글 객체 생성

- 위치: `js/features/todo/todoService.js`의 `updateTodo`, `toggleTodo`
- 현재 상태: 기존 Todo를 spread 한 뒤 변경 필드만 덮어쓴 새 object literal을 반환한다.
- 판단: 불변 업데이트 의도가 분명하므로 허용 가능하지만, Todo 필드 규칙이 더 복잡해지면 생성 규칙이 여러 함수에 흩어질 수 있다.
- 개선 방향: 공통 생성 규칙이 늘어나면 `createTodoModel` 같은 내부 생성 함수나 `Todo` class로 모아 `updatedAt`, `status` 계산을 한 곳에서 관리한다.

### 케이스 3. 앱 상태 객체 생성

- 위치: `js/features/todo/todoState.js`의 `createTodoState`
- 현재 상태: `todos`, `today`만 인자로 받고 `selectedDate`, `activeFilter`, `viewMode`, `currentPage`, `editingTodoId`, `storageAvailable` 기본값을 함수 내부에서 채운다.
- 판단: 좋은 방향이다. 앱 초기 상태의 기본값이 한 곳에 모여 있어 호출부가 알아야 하는 값이 줄어든다.
- 유지 기준: 상태 필드를 추가할 때는 호출부 object literal이 아니라 `createTodoState` 내부 기본값을 먼저 갱신한다.

### 케이스 4. 저장소/검증 결과 객체

- 위치: `js/features/todo/todoService.js`의 `validateContent`, `js/features/todo/todoStorage.js`의 `loadTodos`, `saveTodos`
- 현재 상태: `{ valid, message, content }`, `{ todos, error }`, `{ saved, error }` 형태의 작은 결과 객체를 직접 반환한다.
- 판단: 단순 DTO라 현재는 object literal을 사용해도 무리가 작다. 다만 같은 결과 형태가 여러 곳에서 반복되면 성공/실패 생성 함수가 필요하다.
- 개선 방향: 반환 형태가 늘어나거나 호출부 분기가 복잡해지면 `createValidationSuccess`, `createValidationError`, `createStorageResult`처럼 결과 생성 함수를 둔다.

### 케이스 5. 테스트 데이터 생성

- 위치: `tests/todoService.test.js`의 `createTodo(overrides)`
- 현재 상태: 테스트 전용 Todo 기본값을 object literal로 만들고 override를 덮어쓴다.
- 판단: 테스트에서는 케이스별 차이를 드러내기 쉬워 유용하다. 단, 실제 도메인 생성 규칙과 멀어지면 테스트가 잘못된 구조를 정상으로 가정할 위험이 있다.
- 개선 방향: 프로덕션 `createTodo`와 이름이 겹치지 않도록 `createTodoFixture`처럼 명확히 하고, 기본 필드는 실제 Todo 구조 변경에 맞춰 같이 갱신한다.

## 적용 원칙

- 도메인 객체나 앱 상태처럼 필수 필드, 기본값, 파생값이 있는 객체는 함수나 class를 통해 생성한다.
- 호출부에서는 필요한 입력값만 넘기고, `id`, 날짜, 상태, timestamp 같은 파생값은 생성 함수 내부에서 만든다.
- 단순 결과 객체는 object literal을 허용하되, 같은 구조가 반복되거나 의미가 커지면 생성 함수로 분리한다.
- 테스트 fixture는 object literal을 사용할 수 있지만, 프로덕션 생성 함수와 역할이 헷갈리지 않도록 이름을 구분한다.