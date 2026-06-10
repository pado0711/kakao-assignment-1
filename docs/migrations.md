# 목표: VanilaJS로 이루어진 프로젝트를 React로 마이그레이션

# 마이그레이션 가이드

**Todo 웹 서비스 | Vanilla JS → React + Vite + Custom Hooks**

---

## 개요

### 왜 마이그레이션하는가

기존 Vanilla JS 구조는 레이어 분리가 잘 되어 있으나, `app.js`가 모든 이벤트 바인딩과 `render()` 호출을 직접 관리하는 중앙 조율자 역할을 하기 때문에 기능이 늘어날수록 비대해지는 구조적 한계가 있다.

React + Custom Hook으로 전환하면 이 문제를 구조적으로 방지할 수 있다.

```
Vanilla JS     app.js가 상태 · 이벤트 · 렌더링을 모두 관리
               ↓
React only     App.jsx가 useState 6개 + 핸들러를 모두 보유 → 같은 문제 반복
               ↓
React + Hook   App.jsx는 Hook 조합 + JSX 반환만 → 상태 로직은 Hook으로 분산
```

### 마이그레이션 범위

| 대상 | 처리 방식 |
|---|---|
| `todoService.js` | 그대로 재사용 (순수 함수, DOM 의존 없음) |
| `todoStorage.js` | 그대로 재사용 (순수 함수, DOM 의존 없음) |
| `todoConstants.js` | 그대로 재사용 |
| `shared/date.js` | 그대로 재사용 |
| `todoState.js` | 삭제 → `useTodos`, `useView`로 대체 |
| `todoView.js` | 삭제 → JSX 컴포넌트로 대체 |
| `shared/modal.js` | 삭제 → `useModal` + `Modal.jsx`로 대체 |
| `shared/pagination.js` | 삭제 → `Pagination.jsx`로 대체 |
| `app.js` | 삭제 → `App.jsx` + 3개 Hook으로 대체 |
| `index.html` | Vite 진입점으로 교체 |
| `css/styles.css` | `src/App.css`로 이동, 내용 그대로 |

---

## 마이그레이션 체크리스트

### 1단계 — 환경 구성

```
[ ] Vite + React 프로젝트 생성
      npm create vite@latest kakao-assignment-react -- --template react

[ ] 의존성 설치
      npm install

[ ] 기존 테스트 러너 설정 이관 (package.json의 jest 설정 확인)

[ ] css/styles.css → src/App.css 복사
```

### 2단계 — 순수 로직 이식

```
[ ] features/todo/todoConstants.js → src/features/todo/todoConstants.js
[ ] features/todo/todoService.js   → src/features/todo/todoService.js
[ ] features/todo/todoStorage.js   → src/features/todo/todoStorage.js
[ ] shared/date.js                 → src/shared/date.js

[ ] 기존 테스트(todoService.test.js) 통과 확인 — 이 단계에서 실패하면 진행 금지
```

### 3단계 — Custom Hook 작성

```
[ ] src/hooks/useModal.js 작성
      - message 상태
      - showModal(msg), closeModal() 반환

[ ] src/hooks/useView.js 작성
      - selectedDate, activeFilter, viewMode, currentPage 상태
      - goToDate(date), setFilter(filter), goToPage(page) 반환

[ ] src/hooks/useTodos.js 작성
      - todos, editingTodoId 상태
      - useEffect로 saveTodos 연결
      - handleAdd, handleToggle, handleDelete, handleUpdate 반환
```

### 4단계 — 컴포넌트 작성

```
[ ] src/components/Modal.jsx
[ ] src/components/TodoForm.jsx
[ ] src/components/Pagination.jsx
[ ] src/components/TodoItem.jsx
[ ] src/components/TodoList.jsx
[ ] src/components/ListControls.jsx
```

### 5단계 — 조합 및 검증

```
[ ] src/App.jsx — 3개 Hook 조합 + JSX 반환
[ ] src/main.jsx — ReactDOM.createRoot 진입점
[ ] 전체 기능 동작 확인
      [ ] Todo 추가 / 수정 / 삭제 / 토글
      [ ] 날짜 이동 (이전 / 다음)
      [ ] 필터 탭 전환
      [ ] 페이지네이션
      [ ] localStorage 저장 및 새로고침 후 복원
      [ ] 모달 표시 (유효성 오류, storage 오류)
[ ] 기존 테스트(todoService.test.js) 최종 통과 확인
```

---

## Vanilla JS에서의 변경 사항

### 상태 관리

`todoState.js`의 mutable 객체 직접 변경 방식이 React의 불변 업데이트 방식으로 바뀐다.

### 렌더링

상태 변경 시 `render()`를 수동으로 호출하던 패턴이 사라진다. 상태가 바뀌면 React가 자동으로 리렌더한다.


### DOM 조작

`todoView.js`의 `elements` 객체(querySelector 캐싱)와 `createElement` 체인이 JSX로 교체된다.



### 이벤트 처리

이벤트 위임 + `dataset`으로 액션을 판별하던 방식이 컴포넌트 props 콜백으로 바뀐다.


### 모달

전역 singleton(`activeModal` 변수)으로 관리하던 모달이 state 기반 조건부 렌더링으로 바뀐다.



### localStorage 저장 시점

명시적으로 호출하던 `saveTodos()`가 `useEffect`로 이관되어 todos 상태가 바뀔 때마다 자동으로 실행된다.



---

## 금지 사항

### DOM 직접 접근 금지

컴포넌트 안에서 `document.querySelector`, `getElementById`, `innerHTML` 등으로 DOM을 직접 건드리지 않는다. React가 관리하는 DOM을 외부에서 변경하면 React의 가상 DOM과 실제 DOM이 어긋나 예측 불가한 버그가 생긴다.

```js
// 금지
document.querySelector('#todo-list').innerHTML = '';
document.getElementById('todo-content').focus();

// 대신 ref 사용 (꼭 필요한 경우에만)
const inputRef = useRef(null);
useEffect(() => { inputRef.current?.focus(); }, [isEditing]);
```

### 상태 직접 변경 금지

`useState`로 관리하는 값을 직접 수정하지 않는다. React는 참조가 바뀌어야 변경을 감지하기 때문에 직접 수정하면 리렌더가 발생하지 않는다.

```js
// 금지
todos.push(newTodo);
todos[0].status = 'completed';

// 대신 새 배열/객체 반환
setTodos(prev => [...prev, newTodo]);
setTodos(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
```

### render() 수동 호출 금지

상태 변경 후 직접 렌더링을 트리거하려 하지 않는다. `setState` 함수 호출이 곧 리렌더 예약이다.

```js
// 금지
setTodos(nextTodos);
render();            // 불필요하며 존재하지도 않음

// 대신
setTodos(nextTodos); // 이것만으로 충분
```

### App.jsx에 상태 로직 추가 금지

새 기능을 추가할 때 편의상 App.jsx에 `useState`나 핸들러를 직접 추가하지 않는다. 관련 Hook 파일에 추가하거나, 새 Hook을 만들어 App.jsx에서 조합한다.

```js
// 금지 — App.jsx에 직접 추가
const App = () => {
  const [newFeatureState, setNewFeatureState] = useState(null); // App.jsx 비대화 시작
  const handleNewFeature = () => { ... };
  ...
};

// 대신 — 관련 Hook에 추가하거나 새 Hook 생성
// hooks/useNewFeature.js
export const useNewFeature = () => {
  const [state, setState] = useState(null);
  const handle = () => { ... };
  return { state, handle };
};
```

### 전역 변수 사용 금지

`window.todoApp`처럼 전역 객체에 상태를 노출하지 않는다. 디버깅 목적이라면 React DevTools를 사용한다.
