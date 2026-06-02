Manual / Console Test Instructions

Quick start (from project root `kakao-assignment-1`):

```bash
# 1) Install dependencies (only a static server may be used)
npm install

# 2) Start a local static server (serves repository root at http://localhost:3000)
npm run start
```

Notes:
- The automated Playwright scaffold has been removed. Test cases are available in `tests/todo_test_cases.md` as console-style steps and assertions.
- To run assertions manually, open the app in a browser, open DevTools Console, and paste the provided JS assertion snippets.
- If you want automated conversion (Jest/Playwright) later, I can regenerate it on request.Playwright E2E test scaffold (Vanilla JS)

Quick start (from project root `kakao-assignment-1`):

```bash
# 1) Install dependencies
npm install

# 2) Install Playwright browsers
npx playwright install

# 3) Start a local static server (serves repository root at http://localhost:3000)
npm run start

# 4) Run E2E tests
npm run test:e2e
```

Notes:
- The example spec `tests/playwright/todo.spec.js` is a template. Update CSS selectors to match your app's DOM (input names, buttons, list item classes).
- `playwright.config.js` sets `baseURL` to `http://localhost:3000/kakao-assignment-1/`. If your index is at a different path, update `baseURL` or use full URLs in tests.
- This scaffold uses plain JavaScript — no TypeScript required.
- For debugging, run `npm run test:e2e:headed` to see the browser.
