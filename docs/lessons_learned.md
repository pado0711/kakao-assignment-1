
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

---

2. Hook 반환값 구조분해 후 잔여 참조

## 발생한 문제

- 위치: `src/App.jsx`의 `useView()` 사용부
- 증상: `useView()` 반환값을 구조분해해 `goToPage`를 직접 꺼내 쓰도록 바꿨지만, `Pagination`에 넘기는 콜백에는 이전 형태인 `view.goToPage` 참조가 남아 있었다.
- 실제 영향: 초기 렌더링과 빌드는 통과하지만, Todo가 7개 이상이 되어 페이지네이션이 표시되고 페이지 버튼을 클릭하는 순간 `view is not defined` 런타임 오류가 발생할 수 있었다.

## 왜 발생했는가

- 리팩토링 중 Hook 반환 객체 사용 방식을 바꾸면서 호출부 전체를 끝까지 치환하지 못했다.
- `App.jsx`의 상단 로직에서는 구조분해된 `goToPage`를 사용하고 있었기 때문에 코드가 얼핏 일관되어 보였지만, JSX 하단의 prop 전달부에 오래된 객체 참조가 남았다.
- ESLint와 빌드만으로는 이 문제가 드러나지 않았다. JSX 안의 이벤트 콜백은 렌더 시점에는 단순 함수 참조로 전달되고, 실제 클릭 전까지 실행되지 않기 때문이다.
- 당시 테스트는 순수 로직 중심이라 페이지네이션 클릭 같은 사용자 상호작용을 검증하지 못했다.

## 수정 내용

```jsx
// 수정 전
<Pagination
  currentPage={safeCurrentPage}
  totalPages={totalPages}
  onPageChange={view.goToPage}
/>

// 수정 후
<Pagination
  currentPage={safeCurrentPage}
  totalPages={totalPages}
  onPageChange={goToPage}
/>
```

## 재발 방지 기준

- Hook 반환값을 객체 참조 방식에서 구조분해 방식으로 바꿀 때는 같은 파일에서 기존 객체명(`view`, `todoState` 등)이 남아 있는지 `rg`로 확인한다.
- 컴포넌트 prop에 전달되는 이벤트 핸들러는 렌더만으로 검증되지 않을 수 있으므로, 실제 클릭/입력 테스트를 추가한다.
- 페이지네이션, 삭제 confirm, 수정 Enter/Escape처럼 “조건이 맞아야 나타나는 UI”는 단위 테스트가 아니라 컴포넌트 상호작용 테스트로 최소 1개 이상 검증한다.
- 리팩토링 후 `npm run build`와 `npm run lint`가 통과해도, 사용자 액션 콜백이 모두 실행되는 것은 아니므로 `npm run test`에 UI 이벤트 케이스를 포함한다.

## 적용된 테스트

- `tests/App.test.jsx`에 Todo 7개 이상 생성 후 페이지 버튼을 클릭하는 테스트를 추가했다.
- 이 테스트는 페이지네이션 렌더링뿐 아니라 `onPageChange` 콜백이 실제로 호출되어 화면이 바뀌는지 확인한다.

---

3. 체크리스트 반영 중 발생한 에러 정리

## 배경

- `docs/checklist.md`의 미충족 항목을 맞추기 위해 Vitest 전환, React ESLint 설정, 컴포넌트 테스트 추가, README/문서/CI 업데이트를 진행했다.
- 이 과정에서 단순 설정 변경뿐 아니라 기존 구현의 암묵적인 동작과 테스트 기대값이 충돌하는 문제가 드러났다.

## 에러 1. `package.json` 패치 컨텍스트 불일치

### 증상

- `package.json`을 한 번에 수정하는 `apply_patch`가 실패했다.
- 원인은 의존성 설치 후 `package.json`의 실제 내용이 이미 바뀌어 있었는데, 패치가 설치 전의 라인을 기준으로 작성되어 있었기 때문이다.

### 원인

- `npm install`이 `devDependencies`를 자동으로 갱신했는데, 이후 수동 패치가 이전 파일 형태를 가정했다.
- 설정 파일을 변경할 때는 패키지 설치처럼 파일을 자동 변경하는 명령 이후 반드시 파일을 다시 읽어야 한다.

### 수정

- `package.json`, `.eslintrc.cjs`, `vite.config.js`를 다시 읽고 현재 파일 내용 기준으로 작은 패치를 다시 적용했다.

### 재발 방지

- `npm install`, formatter, codemod처럼 파일을 자동 변경하는 명령 이후에는 바로 이어서 추정 패치를 적용하지 않는다.
- 자동 변경 이후에는 `sed`나 `git diff`로 현재 파일을 확인한 뒤 패치한다.

## 에러 2. Vitest 변환 중 괄호 누락으로 파싱 실패

### 증상

- `tests/todoService.test.js`에서 Vitest 실행과 ESLint가 모두 실패했다.
- 에러 메시지는 `Expected "," or ")" but found ";"`였다.

### 원인

- Node test의 `assert` 문법을 Vitest의 `expect(...).toEqual(...)` 형태로 바꾸는 과정에서 `expect(validateContent('a'.repeat(51))`의 닫는 괄호 하나가 빠졌다.

### 수정

```js
// 수정 전
expect(validateContent('a'.repeat(51)).toEqual({
  valid: false,
  message: '할 일은 50자 이내로 입력해 주세요.',
});

// 수정 후
expect(validateContent('a'.repeat(51))).toEqual({
  valid: false,
  message: '할 일은 50자 이내로 입력해 주세요.',
});
```

### 재발 방지

- 테스트 러너 전환처럼 문법이 많이 바뀌는 작업은 한 파일씩 변환하고 즉시 `npm run lint` 또는 해당 테스트만 실행한다.
- 단순 치환이라도 matcher 체인 구조가 바뀌는 경우 괄호 짝을 우선 확인한다.

## 에러 3. 50자 초과 UI 테스트 실패

### 증상

- 체크리스트의 “50자 초과 입력 시 에러 모달 표시” 테스트가 실패했다.
- 테스트에서 51자를 입력해도 모달이 뜨지 않고, 50자로 잘린 Todo가 정상 추가되었다.

### 원인

- `TodoForm`의 input에 `maxLength={CONTENT_MAX_LENGTH}`가 걸려 있어 브라우저/테스트 환경에서 51번째 글자가 입력되지 않았다.
- 서비스 계층의 `validateContent()`는 50자 초과를 에러로 처리하고 있었지만, UI 레벨에서 입력이 먼저 잘리기 때문에 에러 경로에 도달할 수 없었다.
- 체크리스트는 “초과 입력 시 에러 모달”을 요구하므로, UI 입력 차단 방식과 요구사항이 맞지 않았다.

### 수정

- `TodoForm.jsx`와 `TodoItem.jsx`의 `maxLength` 속성을 제거했다.
- 글자 수 제한은 `validateContent()`에서 저장 시 검증하고, 실패 시 모달을 표시하도록 일관시켰다.

### 재발 방지

- 명세가 “입력 차단”인지 “저장 시 차단 + 에러 표시”인지 먼저 확인한다.
- 서비스 검증 규칙을 UI 속성으로 중복 구현할 경우, 에러 표시 경로가 사라지지 않는지 테스트한다.
- 입력 제한 요구사항은 UI 테스트로 실패 경로까지 확인한다.

## 에러 4. 수정 실패 후 Escape 취소 테스트 실패

### 증상

- 수정 모드에서 빈 값 Enter 후 에러 모달을 닫고 Escape를 입력했을 때, 기존 텍스트가 다시 표시되는지 확인하는 테스트가 실패했다.
- 화면은 여전히 수정 input 상태였고, `getByText('유지할 할 일')`을 찾지 못했다.

### 원인

- 모달을 닫은 뒤 키보드 포커스가 수정 input에 있다고 가정했지만, 실제 테스트 환경에서는 포커스가 모달 확인 버튼 쪽으로 이동해 있었다.
- `TodoItem`의 Escape 처리 로직은 수정 input의 `onKeyDown`에 연결되어 있으므로, input에 포커스를 되돌리지 않으면 취소 동작이 실행되지 않는다.

### 수정

- 테스트에서 모달을 닫은 뒤 `screen.getByLabelText('할 일 수정')`을 다시 클릭해 수정 input에 포커스를 준 다음 Escape를 입력하도록 변경했다.

### 재발 방지

- 키보드 상호작용 테스트에서는 현재 포커스가 어디에 있는지 명확히 만든다.
- 모달, confirm, 포커스 이동이 끼는 플로우에서는 “닫은 후 어느 요소가 키 입력을 받는가”를 테스트 코드에 드러낸다.

## 에러 5. `view.goToPage` 잔여 참조

### 증상

- `App.jsx`에서 `useView()` 반환값을 구조분해했는데, `Pagination`의 `onPageChange`에는 `view.goToPage`가 남아 있었다.
- 빌드와 초기 렌더링만으로는 드러나지 않고, 페이지 버튼 클릭 시 런타임 오류가 날 수 있었다.

### 원인

- Hook 반환값 사용 방식을 리팩토링하면서 JSX 하단 prop 전달부까지 전부 치환하지 못했다.
- 당시 테스트가 순수 로직 중심이라 페이지네이션 클릭 이벤트를 실행하지 않았다.

### 수정

- `onPageChange={view.goToPage}`를 `onPageChange={goToPage}`로 수정했다.
- `tests/App.test.jsx`에 Todo 7개 이상 생성 후 2페이지 버튼을 클릭하는 테스트를 추가했다.

### 재발 방지

- 구조분해 방식으로 바꾼 뒤에는 기존 객체명이 남아 있는지 `rg "view\\." src/App.jsx`처럼 확인한다.
- “렌더는 되지만 클릭해야 터지는 코드”는 컴포넌트 상호작용 테스트로 검증한다.

## 적용 원칙

- 체크리스트 항목을 코드로 반영할 때는 설정, 구현, 테스트, 문서를 한 번에 맞춰야 한다.
- 테스트 실패는 단순히 테스트 기대값을 바꾸기보다, 명세와 구현 중 어느 쪽이 맞는지 먼저 판단한다.
- 빌드/ESLint 통과는 사용자 이벤트 콜백의 정상 실행을 보장하지 않는다.
- UI 요구사항은 순수 함수 테스트만으로 충분하지 않으므로 React Testing Library 같은 상호작용 테스트를 함께 둔다.

---

4. 이벤트 핸들러의 숨은 입력값

## 발생한 문제

- 위치: `src/components/TodoItem.jsx`의 `handleUpdate`
- 기존 `handleUpdate()`는 매개변수가 없지만 함수 바깥의 `todo.id`와 `content`를 참조해 수정 대상을 결정했다.
- `onEdit(todo.id)`, `onToggle(todo.id)`, `onDelete(todo.id)`는 호출부에서 대상 ID를 명시하는 반면, 수정 처리만 대상과 수정 내용을 클로저에 숨겨 호출 방식이 일관되지 않았다.

## 코드를 그렇게 생성한 원인

- `handleUpdate`를 `TodoItem`에서만 사용하는 지역 이벤트 핸들러로 보고, 컴포넌트의 props와 state를 클로저로 참조해도 된다는 React의 일반적인 작성 방식을 우선했다.
- 그 과정에서 “동작하는가”에 집중해 함수가 실제로 필요로 하는 입력값이 시그니처에 드러나는지 확인하지 못했다.
- 특히 수정 버튼과 Enter 키가 같은 로직을 공유하도록 중복 제거는 했지만, 다른 Todo 액션들이 ID를 명시적으로 전달하는 기존 코드 패턴과의 일관성을 놓쳤다.

## 어떤 부분이 잘못되었는가

```jsx
const handleUpdate = () => {
  const result = onUpdate(todo.id, content);
  // ...
};

handleUpdate();
```

- `handleUpdate()` 호출만으로는 어느 Todo를 어떤 내용으로 수정하는지 알 수 없다.
- `todo`는 전역 변수가 아니라 React prop이고 `content`는 컴포넌트 state이므로 이 코드가 즉시 잘못 동작하는 것은 아니다. 그러나 두 값 모두 함수 시그니처에 표현되지 않은 숨은 입력값이다.
- 컴포넌트 구조가 바뀌거나 핸들러가 별도 함수로 이동될 때 암묵적인 클로저 의존성을 빠뜨릴 위험이 있다.
- 이는 함수의 순수성 자체보다는 의존성 표현, 재사용성, 호출부 가독성의 문제다. `onUpdate`, `setHasError`, `onValidationError`를 호출하므로 `handleUpdate` 자체는 여전히 부수효과를 조율하는 이벤트 핸들러다.

## 수정 내용

```jsx
const handleUpdate = (todoId, nextContent) => {
  const result = onUpdate(todoId, nextContent);
  // ...
};

handleUpdate(todo.id, content);
```

- `handleUpdate`가 수정 대상 ID와 새 내용을 매개변수로 받도록 변경했다.
- Enter 키와 수정 버튼의 두 호출부 모두 `handleUpdate(todo.id, content)`로 필요한 입력을 명시했다.
- `todo.content`는 저장된 기존 값이고 `content`는 사용자가 편집 중인 값이므로, 수정 시에는 현재 state인 `content`를 전달한다.

## 재발 방지

- 이벤트 핸들러가 특정 엔티티를 변경한다면 대상 식별자와 변경값을 매개변수로 표현한다.
- 지역 함수가 props나 state를 클로저로 참조할 때는 단순 UI 상태인지, 함수의 핵심 입력값인지 구분한다. 대상 ID와 저장할 값처럼 결과를 결정하는 값은 명시적으로 전달한다.
- 같은 컴포넌트의 유사 액션은 `onEdit(todo.id)`, `onDelete(todo.id)`, `handleUpdate(todo.id, content)`처럼 호출 형태를 일관되게 유지한다.
- 핸들러를 추출하거나 재사용할 가능성이 있다면 함수 선언과 호출부만 보고 필요한 입력을 알 수 있는지 리뷰한다.
- 수정 로직을 변경할 때는 Enter 저장, 수정 버튼 저장, 유효성 실패의 세 경로를 함께 테스트한다.
