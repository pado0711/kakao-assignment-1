# 코드 생성 후 체크리스트

**Todo 웹 서비스 | React + Vite 마이그레이션 완료 후 검증**

---

## 전제 조건 (Assumptions)

코드 생성 전에 아래 전제를 확인하고 팀과 합의한다.

- [x] JavaScript + JSX로 마이그레이션한다. TypeScript는 도입하지 않는다.
- [x] 기존 디자인과 사용자-facing 문구(버튼 레이블, 오류 메시지 등)를 그대로 유지한다.
- [x] localStorage 기존 데이터는 `normalizeTodo()`로 in-place 복구 처리한다. 별도 one-time migration script는 만들지 않는다.
- [x] 테스트 프레임워크는 Jest → Vitest로 전환한다.

---

## 1. ESLint 설정

### 기존 설정 유지 확인

- [x] Airbnb base 규칙이 그대로 적용되는지 확인한다.
- [x] `eslint-plugin-sonarjs` 규칙이 그대로 적용되는지 확인한다.

### React 관련 규칙 추가

- [x] `eslint-plugin-react`를 설치하고 JSX 파싱 설정을 추가한다.

  ```bash
  npm install -D eslint-plugin-react eslint-plugin-react-hooks
  ```

- [x] `eslint-plugin-react-hooks`를 설치하고 Hooks 규칙을 추가한다.

  ```js
  // eslint.config.js 또는 .eslintrc
  plugins: ['react', 'react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  }
  ```

- [x] `react/jsx-filename-extension` 규칙을 `.jsx` 파일에 적용되도록 설정한다.

### Vitest 환경 설정

- [x] 테스트 파일에서 `describe`, `it`, `expect` 등 전역 변수를 ESLint가 인식하도록 설정한다.

  ```js
  // vitest.config.js
  test: { globals: true }

  // eslint.config.js
  { files: ['**/*.test.js'], env: { 'vitest-globals/env': true } }
  // 또는 각 테스트 파일 상단에 명시적 import 방식 사용
  import { describe, it, expect } from 'vitest';
  ```

- [x] `npm run lint` 실행 후 에러 0건을 확인한다.

---

## 2. 문서 업데이트

### README

- [x] 기술 스택을 Vite + React로 업데이트한다.
- [x] 로컬 실행 명령을 업데이트한다.

  ```
  npm install
  npm run dev      # 개발 서버
  npm run build    # 프로덕션 빌드
  npm run test     # 테스트
  npm run coverage # 커버리지
  ```

### docs/functional_spec.md

- [x] 기술 스택 항목을 Vite + React + Vitest로 업데이트한다.
- [x] 기존 기능 명세 내용은 변경하지 않는다.

### docs/architecture_spec.md

- [x] 파일 구조를 React 기준으로 교체한다 (`architecture_custom_hooks.md` 참고).
- [x] 기술 스택 항목을 Vite + React로 업데이트한다.

### GitHub Actions

- [x] `npm ci` → `npm run lint` → `npm run coverage` → `npm run build` 흐름을 유지한다.
- [x] `package.json`의 변경된 scripts 이름과 CI 명령이 일치하는지 확인한다.

  ```yaml
  - run: npm ci
  - run: npm run lint
  - run: npm run coverage
  - run: npm run build
  ```

---

## 3. 테스트

### 기존 테스트 Vitest 전환

- [x] `tests/todoService.test.js`를 Vitest로 변환한다.

  ```bash
  npm install -D vitest
  ```

  ```js
  // Before (Jest)
  const { createTodo } = require('./todoService');

  // After (Vitest)
  import { describe, it, expect } from 'vitest';
  import { createTodo } from '../src/features/todo/todoService';
  ```

- [x] 변환 후 기존 테스트 케이스 전체가 통과하는지 확인한다.

### 추가 컴포넌트 테스트

**Todo 생성**
- [x] 정상 입력 시 Todo가 목록에 추가된다.
- [x] 빈 값 제출 시 에러 모달이 표시되고 Todo가 추가되지 않는다.
- [x] 50자 초과 입력 시 에러 모달이 표시되고 Todo가 추가되지 않는다.

**보기 모드**
- [x] 날짜별 보기에서 선택한 날짜의 Todo만 표시된다.
- [x] 상태별 필터(전체 / 진행중 / 완료)가 날짜별 보기와 독립적으로 동작한다.

**수정**
- [x] 수정 모드에서 Enter 키 입력 시 변경 내용이 저장된다.
- [x] 수정 모드에서 Escape 키 입력 시 변경 내용이 취소된다.
- [x] 수정 모드에서 빈 값 입력 후 Enter 시 에러 모달이 표시되고 저장되지 않는다.

**완료 토글**
- [x] 체크박스 토글 시 상태가 `inProgress` ↔ `completed`로 전환된다.
- [x] 상태별 필터 보기에서 토글 후 정렬 순서가 즉시 반영된다.

**삭제**
- [x] 삭제 버튼 클릭 후 confirm 취소 시 Todo가 삭제되지 않는다.
- [x] 삭제 버튼 클릭 후 confirm 확인 시 Todo가 목록에서 제거된다.

**페이지네이션**
- [x] Todo가 7개 이상일 때 페이지네이션이 표시된다.
- [x] 페이지당 6개씩 표시된다.
- [x] 날짜를 변경하면 1페이지로 초기화된다.
- [x] 필터를 변경하면 1페이지로 초기화된다.

**localStorage**
- [x] 손상된 JSON이 저장된 경우 에러 모달을 표시하고, 기존 형식 데이터는 `normalizeTodo()`로 복구한다.
- [x] localStorage 저장 실패 시 에러 메시지가 모달로 표시된다.
- [x] localStorage 사용 불가 환경에서 저장 불가 안내가 표시된다.

---

## 4. 최종 검증 명령

코드 생성 완료 후 아래 명령을 순서대로 실행하고 모두 통과해야 한다.

```bash
npm run lint      # ESLint 에러 0건
npm run test      # 전체 테스트 통과
npm run coverage  # 커버리지 리포트 생성 확인
npm run build     # 프로덕션 빌드 에러 없음
```

- [x] `npm run lint` — 에러 0건
- [x] `npm run test` — 전체 통과
- [x] `npm run coverage` — 리포트 생성 확인
- [x] `npm run build` — 빌드 에러 없음
