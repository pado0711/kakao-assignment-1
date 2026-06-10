import { describe, expect, it } from 'vitest';

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

describe('todo service', () => {
  it('content validation trims text and rejects empty values', () => {
    expect(validateContent('  내용  ')).toEqual({ valid: true, content: '내용' });
    expect(validateContent('   ').valid).toBe(false);
    expect(validateContent('a'.repeat(51))).toEqual({
      valid: false,
      message: '할 일은 50자 이내로 입력해 주세요.',
    });
  });

  it('initial status depends on the KST date supplied by the caller', () => {
    expect(getInitialStatus(today, today)).toBe(TODO_STATUS.IN_PROGRESS);
    expect(getInitialStatus(yesterday, today)).toBe(TODO_STATUS.DEFAULT);
  });

  it('editing and toggling return new todo objects', () => {
    const original = createTodoFixture();
    const completed = toggleTodo(original);
    expect(completed.status).toBe(TODO_STATUS.COMPLETED);
    expect(toggleTodo(completed).status).toBe(TODO_STATUS.IN_PROGRESS);
    expect(updateTodo(createTodoFixture({ date: yesterday }), '수정', today).status)
      .toBe(TODO_STATUS.DEFAULT);
    expect(original.status).toBe(TODO_STATUS.IN_PROGRESS);
  });

  it('date view and filter view stay independent', () => {
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
    expect(selectVisibleTodos({
      todos,
      viewMode: VIEW_MODE.DATE,
      selectedDate: today,
      activeFilter: TODO_FILTER.COMPLETED,
    }).map((todo) => todo.id)).toEqual(['today']);
    expect(selectVisibleTodos({
      todos,
      viewMode: VIEW_MODE.FILTER,
      selectedDate: today,
      activeFilter: TODO_FILTER.COMPLETED,
    }).map((todo) => todo.id)).toEqual(['done']);
  });

  it('all filter sorts todos by status priority and then by creation time', () => {
    const todos = [
      createTodoFixture({ id: 'completed', status: TODO_STATUS.COMPLETED, createdAt: 4 }),
      createTodoFixture({ id: 'default', status: TODO_STATUS.DEFAULT, createdAt: 3 }),
      createTodoFixture({ id: 'older-progress', createdAt: 1 }),
      createTodoFixture({ id: 'newer-progress', createdAt: 2 }),
    ];
    expect(selectVisibleTodos({
      todos,
      viewMode: VIEW_MODE.FILTER,
      selectedDate: today,
      activeFilter: TODO_FILTER.ALL,
    }).map((todo) => todo.id)).toEqual(['newer-progress', 'older-progress', 'default', 'completed']);
  });

  it('legacy Korean state values migrate to internal status values', () => {
    const migrated = normalizeTodo({
      id: 'legacy',
      content: '이전 데이터',
      date: today,
      createdAt: 1,
      updatedAt: 1,
      state: '완료',
    }, today);
    expect(migrated.status).toBe(TODO_STATUS.COMPLETED);
  });

  it('storage writes Korean state compatibility values and recovers from damaged JSON', () => {
    expect(saveTodos([createTodoFixture()]).saved).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].state).toBe('진행중');

    localStorage.setItem(STORAGE_KEY, 'INVALID_JSON');
    const originalConsoleError = console.error;
    console.error = () => {};
    const result = loadTodos(today);
    console.error = originalConsoleError;
    expect(result.todos).toEqual([]);
    expect(result.error).toMatch(/빈 목록/);
  });

  it('pagination stays inside a valid range', () => {
    expect(getTotalPages(0, 6)).toBe(1);
    expect(getTotalPages(7, 6)).toBe(2);
    expect(clampPage(3, 2)).toBe(2);
    expect(paginate([1, 2, 3, 4, 5, 6, 7], 2, 6)).toEqual([7]);
  });
});
