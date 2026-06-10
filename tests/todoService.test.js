import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getInitialStatus,
  normalizeTodo,
  selectVisibleTodos,
  toggleTodo,
  updateTodo,
  validateContent,
} from '../src/features/todo/todoService.js';
import {
  STORAGE_KEY,
  TODO_FILTER,
  TODO_STATUS,
  VIEW_MODE,
} from '../src/features/todo/todoConstants.js';
import { loadTodos, saveTodos } from '../src/features/todo/todoStorage.js';
import { clampPage, getTotalPages, paginate } from '../src/shared/pagination.js';

const today = '2026-06-02';
const yesterday = '2026-06-01';
const createTodoFixture = (overrides = {}) => ({
  id: 'todo-1',
  content: '테스트',
  date: today,
  createdAt: 1,
  updatedAt: 1,
  status: TODO_STATUS.IN_PROGRESS,
  ...overrides,
});

test('content validation trims text and rejects empty values', () => {
  assert.deepEqual(validateContent('  내용  '), { valid: true, content: '내용' });
  assert.equal(validateContent('   ').valid, false);
  assert.equal(validateContent('a'.repeat(51)).valid, false);
});

test('initial status depends on the KST date supplied by the caller', () => {
  assert.equal(getInitialStatus(today, today), TODO_STATUS.IN_PROGRESS);
  assert.equal(getInitialStatus(yesterday, today), TODO_STATUS.DEFAULT);
});

test('editing and toggling return new todo objects', () => {
  const original = createTodoFixture();
  const completed = toggleTodo(original);
  assert.equal(completed.status, TODO_STATUS.COMPLETED);
  assert.equal(toggleTodo(completed).status, TODO_STATUS.IN_PROGRESS);
  assert.equal(updateTodo(createTodoFixture({ date: yesterday }), '수정', today).status, TODO_STATUS.DEFAULT);
  assert.equal(original.status, TODO_STATUS.IN_PROGRESS);
});

test('date view and filter view stay independent', () => {
  const todos = [
    createTodoFixture({ id: 'old', date: yesterday, createdAt: 1 }),
    createTodoFixture({ id: 'today', createdAt: 2 }),
    createTodoFixture({
      id: 'done',
      date: yesterday,
      createdAt: 3,
      status: TODO_STATUS.COMPLETED,
    }),
  ];
  assert.deepEqual(selectVisibleTodos({
    todos,
    viewMode: VIEW_MODE.DATE,
    selectedDate: today,
    activeFilter: TODO_FILTER.COMPLETED,
  }).map((todo) => todo.id), ['today']);
  assert.deepEqual(selectVisibleTodos({
    todos,
    viewMode: VIEW_MODE.FILTER,
    selectedDate: today,
    activeFilter: TODO_FILTER.COMPLETED,
  }).map((todo) => todo.id), ['done']);
});

test('all filter sorts todos by status priority and then by creation time', () => {
  const todos = [
    createTodoFixture({ id: 'completed', status: TODO_STATUS.COMPLETED, createdAt: 4 }),
    createTodoFixture({ id: 'default', status: TODO_STATUS.DEFAULT, createdAt: 3 }),
    createTodoFixture({ id: 'older-progress', createdAt: 1 }),
    createTodoFixture({ id: 'newer-progress', createdAt: 2 }),
  ];
  assert.deepEqual(selectVisibleTodos({
    todos,
    viewMode: VIEW_MODE.FILTER,
    selectedDate: today,
    activeFilter: TODO_FILTER.ALL,
  }).map((todo) => todo.id), ['newer-progress', 'older-progress', 'default', 'completed']);
});

test('legacy Korean state values migrate to internal status values', () => {
  const migrated = normalizeTodo({
    id: 'legacy',
    content: '이전 데이터',
    date: today,
    createdAt: 1,
    updatedAt: 1,
    state: '완료',
  }, today);
  assert.equal(migrated.status, TODO_STATUS.COMPLETED);
});

test('storage writes Korean state compatibility values and recovers from damaged JSON', () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  assert.equal(saveTodos([createTodoFixture()]).saved, true);
  assert.equal(JSON.parse(values.get(STORAGE_KEY))[0].state, '진행중');

  values.set(STORAGE_KEY, 'INVALID_JSON');
  const originalConsoleError = console.error;
  console.error = () => {};
  const result = loadTodos(today);
  console.error = originalConsoleError;
  assert.deepEqual(result.todos, []);
  assert.match(result.error, /빈 목록/);
  delete globalThis.localStorage;
});

test('pagination stays inside a valid range', () => {
  assert.equal(getTotalPages(0, 6), 1);
  assert.equal(getTotalPages(7, 6), 2);
  assert.equal(clampPage(3, 2), 2);
  assert.deepEqual(paginate([1, 2, 3, 4, 5, 6, 7], 2, 6), [7]);
});
