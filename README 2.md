# kakao-assignment-1
[카카오테크캠퍼스] 1주차 과제: Todo 앱 리포지토리입니다.

## 실행 방법

```bash
npm install
npm run start
```

브라우저에서 `http://localhost:3000`을 열어 앱을 확인할 수 있습니다.

## 테스트

```bash
npm test
```

## 구조

React와 TypeScript 도입을 고려하여 기능 중심 구조를 사용합니다.

```text
js/
├── app.js
├── features/
│   └── todo/
│       ├── todoConstants.js
│       ├── todoService.js
│       ├── todoState.js
│       ├── todoStorage.js
│       └── todoView.js
└── shared/
    ├── date.js
    ├── modal.js
    └── pagination.js
```
