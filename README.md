# Kakao Todo Full-stack

Next.js App Router와 FastAPI로 구성한 Todo 모노레포입니다. 이메일/Google 로그인, 사용자별 Todo, 선택 요일 반복과 날짜별 예외를 지원합니다.

## 실행

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env.local
uvicorn main:app --reload
```

API 문서: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

웹 앱: `http://localhost:3000`

Google Cloud Console의 승인된 리디렉션 URI에는 `http://localhost:3000/api/auth/google/callback`을 등록합니다. 같은 `GOOGLE_CLIENT_ID`를 양쪽 환경에, Client Secret은 백엔드에만 설정합니다.

## 검증

```bash
npm run test:backend
npm run test:frontend
npm --prefix frontend run lint
npm run build:frontend
```

## 주요 구조

- `frontend/app/actions.ts`: Server Component 조회
- `frontend/app/api`: 인증 쿠키와 FastAPI 프록시
- `frontend/components`: Todo·반복·인증 상호작용
- `backend/main.py`: 사용자, 세션, Todo, 반복 규칙과 예외 API
- `backend/tests`: 인증·소유권·CRUD·반복 테스트
