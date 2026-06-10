# AGENTS.md

## Project Context
이 프로젝트의 상세 요구사항은 `docs/` 디렉토리의 문서를 기준으로 한다.
Codex는 구현 전에 관련 문서를 먼저 읽고, 문서와 충돌하는 구현을 하지 않는다.

## Documents
- 기능 요구사항: `docs/functional.md`
- 비기능 요구사항: `docs/non-functional.md`
- 아키텍처: `docs/architecture.md`
- 에러 케이스: `docs/error-cases.md`

## Reading Order
작업 시작 전 다음 순서로 문서를 확인한다.

1. `docs/architecture.md`
2. `docs/functional.md`
3. `docs/error-cases.md`
4. `docs/non-functional.md`

## How to Use Documents
- 기능 추가/수정 시 `functional.md`를 우선 기준으로 삼는다.
- 예외 처리 수정 시 `error-cases.md`를 반드시 확인한다.
- 구조 변경 시 `architecture.md`와 충돌하지 않아야 한다.
- 성능, 보안, 확장성, 로깅, 트랜잭션 관련 변경 시 `non-functional.md`를 확인한다.

## Conflict Rules
문서 간 내용이 충돌하면 다음 우선순위를 따른다.

1. `architecture.md`
2. `error-cases.md`
3. `functional.md`
4. `non-functional.md`

단, 보안/데이터 무결성 관련 내용은 항상 우선한다.

## Implementation Rules
- 문서에 명시되지 않은 동작은 임의로 추가하지 않는다.
- 요구사항이 모호하면 기존 코드 패턴을 따른다.
- 변경 범위를 요청된 기능에 한정한다.
- DTO, Entity, Service, Repository 계층 책임을 분리한다.
- API 응답 형식은 문서에 정의된 스펙을 따른다.

## Before Coding
Codex는 구현 전에 다음을 요약한다.

- 읽은 문서
- 구현 대상 기능
- 관련 에러 케이스
- 영향받는 계층
- 테스트해야 할 항목



구현 전 반드시 확인

- docs/lessons-learned.md

이미 해결한 문제를 다시 만들지 않는다.

동일한 실패 사례가 존재하면
기존 해결 방식을 우선 검토한다.

## Before Finishing
완료 전 `checklist.md` 의 내용을 지키는지 검증한다.


