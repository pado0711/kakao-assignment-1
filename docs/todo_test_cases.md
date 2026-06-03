# Todo 앱 테스트 케이스

목적: `functional_spec.md`와 `error_case.md`에 정의된 동작 및 에러 케이스를 바탕으로 수동/자동화 가능한 테스트 케이스를 정리한다.

- 작성일: 2026-06-02
- 대상 파일: [kakao-assignment-1/functional_spec.md](kakao-assignment-1/functional_spec.md), [kakao-assignment-1/error_case.md](kakao-assignment-1/error_case.md)

---

## 실행 전 공통 전제
- 브라우저 시간대는 임의로 설정할 수 있으나, KST 기준 날짜 계산은 `Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul" })`로 강제한다.
- 로컬스토리지 비우기: 테스트 시작 전 `localStorage.clear()` 수행.
- 페이지는 초기 로드 상태에서 시작.

---

## 주요 기능 테스트 (정상 동작)

TC-FN-01 | Todo 생성 - 오늘 날짜, 정상 입력
- 관련 명세: 3-1, 초기 state 결정
# Todo 앱 테스트 케이스 (실행 스크립트형)

목적: `functional_spec.md`와 `error_case.md`에 정의된 동작 및 에러 케이스를 바탕으로, 수동 또는 간단한 자동화(브라우저 콘솔에서 실행 가능한)용 테스트 스크립트를 추가합니다.

- 작성일: 2026-06-02
- 대상 파일: [kakao-assignment-1/functional_spec.md](kakao-assignment-1/functional_spec.md), [kakao-assignment-1/error_case.md](kakao-assignment-1/error_case.md)

---

## 실행 전 공통 전제
- 브라우저 콘솔에서 테스트를 실행할 경우: `localStorage.clear()`로 초기화 후 페이지 리로드.
- KST 기준 날짜 계산은 앱이 `Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul" })`를 사용하도록 가정.

---

주의: 아래 예시는 DOM 셀렉터(`.todo-item`, `input[name=todo-content]`, 등)가 앱 구현에 따라 달라집니다. 실행 전 셀렉터를 실제 앱 요소에 맞게 교체하세요.

표기법:
- Step: 수동/자동 수행 단계
- Assertion: 브라우저 콘솔 또는 테스트 러너에서 확인할 표현식(Plain JS)

---

## 주요 기능 테스트 (정상 동작) — 실행 스크립트

TC-FN-01 | Todo 생성 - 오늘 날짜, 정상 입력
Step:
1) `localStorage.clear(); location.reload();`
2) document.querySelector('input[name="todo-content"]').value = '테스트1';
3) document.querySelector('input[name="todo-date"]').value = (new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date()));
4) document.querySelector('button#add').click();
Assertion (콘솔):
 - `JSON.parse(localStorage.getItem('todo-app-v2:todos')||'[]').some(t => t.content==='테스트1' && t.state==='진행중')` -> true
 - `document.querySelectorAll('.todo-item').length >= 1`

TC-FN-02 | Todo 생성 - 다른 날짜 선택
Step:
1) dateInput.value = '2030-01-01' (또는 오늘이 아닌 날짜)
2) fill content and click add
Assertion:
 - `const t = JSON.parse(localStorage.getItem('todo-app-v2:todos')||'[]').find(x=>x.content==='테스트1'); t && t.date==='2030-01-01' && t.state==='전체'`

TC-FN-03 | Todo 목록 정렬 (날짜별 뷰)
Step:
1) Create Todo A then Todo B for same date via UI or localStorage injection
2) Open that date view
Assertion:
 - `document.querySelectorAll('.todo-item')[0].textContent.includes('B')` (가장 상단이 B)

TC-FN-04 | Todo 수정 저장 및 `updatedAt` 갱신
Step:
1) Click edit on an item, change value to '수정됨', press Enter
Assertion:
 - `const t = JSON.parse(localStorage.getItem('todo-app-v2:todos')||'[]').find(x=>x.content==='수정됨'); !!t && t.updatedAt` (timestamp 존재)

TC-FN-05 | Todo 완료 처리 및 정렬
Step:
1) Click checkbox of a 진행중 item
Assertion:
 - `const t = JSON.parse(localStorage.getItem('todo-app-v2:todos')||'[]').find(x=>x.id === '<id>'); t.state==='완료'`
 - `document.querySelector('.todo-item.completed')` 존재 또는 strike-through 스타일 적용

TC-FN-06 | 완료 되돌리기
Step:
1) Click checkbox on a 완료 item to uncheck
Assertion:
 - `t.state==='진행중'` and item appears in 진행중 group top

TC-FN-07 | 삭제 처리
Step:
1) Click delete on an item, confirm
Assertion:
 - `!JSON.parse(localStorage.getItem('todo-app-v2:todos')||'[]').some(x=>x.id==='<id>')`
 - `document.querySelectorAll('.todo-item')`에서 해당 항목 없음

TC-FN-08 | 상태별 탭 필터링
Step:
1) Click `진행중` tab
Assertion:
 - All rendered items satisfy `(item.state==='진행중')` when checked against localStorage data

TC-FN-09 | 날짜별 뷰 네비게이션
Step:
1) Click next/prev date buttons
Assertion:
 - Visible list only contains items whose `date` equals selected date
 - `currentPage === 1`

TC-FN-10 | Pagination 정상 동작
Step:
1) Ensure >6 items for a view, click page 2
Assertion:
 - `document.querySelectorAll('.todo-item').length <= 6`
 - Current page index equals clicked page

TC-FN-11 | 로컬스토리지 저장 지속성
Step:
1) Create items, then `location.reload()`
Assertion:
 - Items from `localStorage` are rendered after reload

---

## 에러 / 음수 테스트 — 실행 스크립트

TC-CR-001 | 내용 비입력으로 추가 시도 (CR-001 / CR-002)
Step:
1) `document.querySelector('input[name="todo-content"]').value = '   '` (공백)
2) Click add
Assertion:
 - UI shows modal or validation element: `document.querySelector('.modal')` 또는 `document.querySelector('input[name="todo-content"]').classList.contains('error')`
 - `localStorage` 변경 없음: `JSON.parse(localStorage.getItem('todo-app-v2:todos')||'[]').length === 0`

TC-CR-003 | 최대 글자수 초과 입력 차단 (CR-003)
Step:
1) Type 51+ characters into content input
Assertion:
 - Input value length is capped or add action blocked: `document.querySelector('input[name="todo-content"]').value.length <= 50`

TC-CR-006 | 로컬스토리지 쓰기 실패 시 생성 실패 처리 (CR-006 / ST-001)
Step (시뮬레이션):
1) Override localStorage.setItem to throw: `localStorage.setItem = ()=>{throw new Error('QuotaExceededError')}`
2) Try add
Assertion:
 - UI shows error modal
 - No new item in DOM and `localStorage` unchanged (fallback state)

TC-UP-001 | 수정 후 빈 값 엔터 (UP-001 / UP-002)
Step:
1) Enter edit mode, clear text, press Enter
Assertion:
 - Change not saved: localStorage item content unchanged
 - Input shows validation highlight

TC-UP-005 | 수정 저장 중 로컬스토리지 쓰기 실패 (UP-005)
Step (시뮬.):
1) Monkey-patch `localStorage.setItem` to throw
2) Attempt save
Assertion:
 - UI rolls back to previous content
 - Error modal displayed

TC-CP-001 | 완료 처리 후 저장 실패 롤백 (CP-001)
Step (시뮬.):
1) Monkey-patch storage write to throw
2) Click complete checkbox
Assertion:
 - Checkbox state is restored to previous state
 - localStorage state unchanged

TC-DL-001 | 삭제 취소 처리 (DL-001)
Step:
1) Click delete, in confirm dialog choose cancel
Assertion:
 - Item remains in DOM and in `localStorage`

TC-DL-003 | 삭제 후 페이지 아이템 0 처리 (DL-003 / PG-004)
Step:
1) On last page with single item, delete and confirm
Assertion:
 - After deletion, `currentPage` is at least 1 and <= totalPages
 - No empty page shown (previous page data rendered)

TC-TB-001 | 탭 전환 시 페이지 초기화 (TB-001)
Step:
1) Set `currentPage` > 1, click another tab
Assertion:
 - `currentPage === 1` and UI shows first page

TC-DT-003 | 자정 경계 날짜 재산출 (DT-003)
Step (시뮬.):
1) Simulate time rollover by calling the app's date-recalc handler or trigger `visibilitychange`/timer
Assertion:
 - Today label and data refreshed to new KST date

TC-PG-001 | 페이지 범위 초과 방지 (PG-001 / PG-002)
Step:
1) At first page, click Previous; at last page, click Next
Assertion:
 - `currentPage` stays within [1, totalPages]; navigation buttons disabled appropriately

TC-ST-002 | 로컬스토리지 파싱 오류 처리 (ST-002)
Step:
1) `localStorage.setItem('todo-app-v2:todos', 'INVALID_JSON')`; reload
Assertion:
 - App catches parse error and initializes empty array
 - User notified (modal or console error)

TC-MD-001 | Modal 중복/스크롤 차단 확인 (MD-001 / MD-004)
Step:
1) Trigger modal; attempt to scroll background
2) Trigger another modal quickly
Assertion:
 - `document.body.style.overflow === 'hidden'` while modal open
 - No duplicate modal elements inserted (check only one `.modal` exists)

---

## 우선순위 권장 실행 목록
1. CR-001 (필수 입력 검증)
2. ST-001 (스토리지 예외) / CR-006
3. UP-001 (수정 빈값 차단)
4. PG-001 (페이지 범위 안전성)
5. DT-003 (자정 경계)

---

## 파일 위치
- 테스트 케이스 파일: [kakao-assignment-1/tests/todo_test_cases.md](kakao-assignment-1/tests/todo_test_cases.md)

---
