# 아키텍쳐 파일 구조 문서
**Todo 웹 서비스 | v2.0**

VanilaJS 단일 Todo 앱이므로, 추후 리팩토링을 대비했을 때, feature based 구조로 파일을 구성한다.

1. 파일 구조 정리
js/
├── app.js
├── features/
│   └── todo/
│       ├── todoService.js
│       ├── todoStorage.js
│       ├── todoView.js
│       ├── todoState.js
│       └── todoConstants.js
└── shared/
    ├── modal.js
    ├── pagination.js
    └── date.js


2. 상태 모델 정리
```
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