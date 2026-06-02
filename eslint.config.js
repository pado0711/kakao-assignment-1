import js from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";

export default [
  js.configs.recommended,
  sonarjs.configs.recommended, // SonarJS의 기본 추천 정적 분석 규칙 적용
  
  {
    files: ["**/*.js"],
    rules: {
      // --- 📊 수치 중심의 정적 분석 가드레일 설정 ---

      // 1. 순환 복잡도 (Cyclomatic Complexity) 제한 
      // 코드가 가질 수 있는 조건문/반복문 등의 경로 수치를 제한합니다. (기본 10~15 추천)
      "complexity": ["warn", { "max": 10 }],

      // 2. 하나의 함수가 가질 수 있는 최대 라인 수 제한
      // 함수 하나가 너무 비대해지는지 감시합니다.
      "max-lines-per-function": ["warn", { "max": 50, "skipBlankLines": true, "skipComments": true }],

      // 3. 하나의 파일이 가질 수 있는 최대 라인 수 제한
      "max-lines": ["warn", { "max": 300, "skipBlankLines": true, "skipComments": true }],

      // 4. 콜백 헬(Callback Hell) 깊이 제한
      // 비동기 처리가 많은 ToDo 앱에서 콜백이나 프로미스가 너무 깊게 중첩되는 걸 막습니다.
      "max-nested-callbacks": ["warn", { "max": 3 }],

      // 5. 함수의 매개변수(Parameter) 개수 제한
      // 매개변수가 너무 많아지면 객체로 묶어 리팩토링하도록 유도합니다.
      "max-params": ["warn", { "max": 4 }],

      // --- 🔍 SonarJS 세부 수치 규칙 예시 (필요시 커스텀) ---
      // 인지 복잡도(Cognitive Complexity)가 15를 넘으면 경고를 보냅니다.
      "sonarjs/cognitive-complexity": ["warn", 15],
    },
  },
];