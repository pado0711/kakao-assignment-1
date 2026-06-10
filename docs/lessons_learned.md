
1. 객체 생성 방식
## 현재 코드 분석

- `js/features/todo/todoService.js`의 `createTodo`, `normalizeTodo`는 Todo 도메인 객체를 생성하는 진입점을 함수로 분리하고 있다.
- `js/features/todo/todoState.js`의 `createTodoState`도 앱 상태 객체를 만드는 진입점을 함수로 분리하고 있다.
- `validateContent`, `loadTodos`, `saveTodos`처럼 성공/실패 결과 객체를 반환하는 곳도 전용 생성 함수로 반환 구조를 분리했다.
- 테스트의 `tests/todoService.test.js`는 `createTodoFixture(overrides)` 헬퍼로 테스트 데이터 생성 역할을 명확히 구분했다.

## 케이스 정리

### 케이스 1. Todo 도메인 객체 생성

- 위치: `js/features/todo/todoService.js`의 `createTodo`, `normalizeTodo`
- 현재 상태: 함수에서 필요한 인자인 `content`, `date`, `today`를 받아 `id`, `createdAt`, `updatedAt`, `status`를 보완하고, 내부 `createTodoModel`로 Todo 객체를 생성한다.
- 판단: 좋은 방향이다. Todo 객체는 필수 필드와 기본값 규칙이 많으므로 호출부에서 object literal을 직접 만들면 누락이나 상태값 불일치가 생기기 쉽다.
- 유지 기준: 새 Todo를 만들 때는 호출부에서 `{ id, content, date, ... }`를 직접 조립하지 않고 `createTodo` 또는 정규화 함수만 사용한다.

### 케이스 2. Todo 수정/토글 객체 생성

- 위치: `js/features/todo/todoService.js`의 `updateTodo`, `toggleTodo`
- 현재 상태: 기존 Todo에서 유지할 필드와 변경할 필드를 명시한 뒤 내부 `createTodoModel`로 새 Todo 객체를 반환한다.
- 판단: Todo 필드 구조가 한 생성 함수에 모여 있어 수정/토글 시에도 객체 형태가 흩어지지 않는다.
- 유지 기준: Todo 수정 로직을 추가할 때도 object literal을 직접 반환하지 않고 `createTodoModel` 또는 별도 생성 함수를 통해 반환한다.

### 케이스 3. 앱 상태 객체 생성

- 위치: `js/features/todo/todoState.js`의 `createTodoState`
- 현재 상태: `todos`, `today`만 인자로 받고 `selectedDate`, `activeFilter`, `viewMode`, `currentPage`, `editingTodoId`, `storageAvailable` 기본값을 함수 내부에서 채운다.
- 판단: 좋은 방향이다. 앱 초기 상태의 기본값이 한 곳에 모여 있어 호출부가 알아야 하는 값이 줄어든다.
- 유지 기준: 상태 필드를 추가할 때는 호출부 object literal이 아니라 `createTodoState` 내부 기본값을 먼저 갱신한다.

### 케이스 4. 저장소/검증 결과 객체

- 위치: `js/features/todo/todoService.js`의 `validateContent`, `js/features/todo/todoStorage.js`의 `loadTodos`, `saveTodos`
- 현재 상태: `createValidationSuccess`, `createValidationError`, `createLoadSuccess`, `createLoadError`, `createSaveSuccess`, `createSaveError`로 결과 객체 생성을 분리했다.
- 판단: 단순 DTO라도 성공/실패 구조가 함수 이름으로 드러나 호출부와 반환 구조를 이해하기 쉬워졌다.
- 유지 기준: 반환 형태가 늘어나거나 호출부 분기가 복잡해지면 기존 생성 함수에 필드를 추가하거나 더 구체적인 생성 함수로 분리한다.

### 케이스 5. 테스트 데이터 생성

- 위치: `tests/todoService.test.js`의 `createTodoFixture(overrides)`
- 현재 상태: 테스트 전용 Todo 기본값을 object literal로 만들고 override를 덮어쓴다.
- 판단: 테스트에서는 케이스별 차이를 드러내기 쉬워 유용하다. 단, 실제 도메인 생성 규칙과 멀어지면 테스트가 잘못된 구조를 정상으로 가정할 위험이 있다.
- 유지 기준: 프로덕션 `createTodo`와 이름이 겹치지 않도록 fixture 명칭을 유지하고, 기본 필드는 실제 Todo 구조 변경에 맞춰 같이 갱신한다.

## 적용 원칙

- 도메인 객체나 앱 상태처럼 필수 필드, 기본값, 파생값이 있는 객체는 함수나 class를 통해 생성한다.
- 호출부에서는 필요한 입력값만 넘기고, `id`, 날짜, 상태, timestamp 같은 파생값은 생성 함수 내부에서 만든다.
- 단순 결과 객체는 object literal을 허용하되, 같은 구조가 반복되거나 의미가 커지면 생성 함수로 분리한다.
- 테스트 fixture는 object literal을 사용할 수 있지만, 프로덕션 생성 함수와 역할이 헷갈리지 않도록 이름을 구분한다.
