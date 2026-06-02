import {
  CONTENT_MAX_LENGTH,
  LABEL_STATUS,
  STATUS_LABEL,
  TODO_FILTER,
  TODO_STATUS,
  VIEW_MODE,
} from './todoConstants.js';

const STATUS_PRIORITY = new Map([
  [TODO_STATUS.IN_PROGRESS, 0],
  [TODO_STATUS.DEFAULT, 1],
  [TODO_STATUS.COMPLETED, 2],
]);

const getTimestamp = () => Date.now();

const createId = () => (
  globalThis.crypto?.randomUUID?.()
  ?? `${getTimestamp()}-${Math.random().toString(16).slice(2)}`
);

export const validateContent = (content) => {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { valid: false, message: '할 일을 입력해 주세요.' };
  }
  if (trimmedContent.length > CONTENT_MAX_LENGTH) {
    return { valid: false, message: `할 일은 ${CONTENT_MAX_LENGTH}자 이내로 입력해 주세요.` };
  }
  return { valid: true, content: trimmedContent };
};

export const getInitialStatus = (date, today) => (
  date === today ? TODO_STATUS.IN_PROGRESS : TODO_STATUS.DEFAULT
);

export const createTodo = ({ content, date, today }) => {
  const timestamp = getTimestamp();
  return {
    id: createId(),
    content,
    date,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: getInitialStatus(date, today),
  };
};

export const updateTodo = (todo, content, today) => ({
  ...todo,
  content,
  updatedAt: getTimestamp(),
  status: todo.date === today ? TODO_STATUS.IN_PROGRESS : TODO_STATUS.DEFAULT,
});

export const toggleTodo = (todo) => ({
  ...todo,
  updatedAt: getTimestamp(),
  status: todo.status === TODO_STATUS.COMPLETED
    ? TODO_STATUS.IN_PROGRESS
    : TODO_STATUS.COMPLETED,
});

const sortNewestFirst = (left, right) => right.createdAt - left.createdAt;

export const sortTodosForDate = (todos) => [...todos].sort(sortNewestFirst);

export const sortTodosForFilter = (todos) => [...todos].sort((left, right) => (
  STATUS_PRIORITY.get(left.status) - STATUS_PRIORITY.get(right.status)
  || sortNewestFirst(left, right)
));

export const selectVisibleTodos = ({ todos, viewMode, selectedDate, activeFilter }) => {
  if (viewMode === VIEW_MODE.DATE) {
    return sortTodosForDate(todos.filter((todo) => todo.date === selectedDate));
  }

  const filteredTodos = activeFilter === TODO_FILTER.ALL
    ? todos
    : todos.filter((todo) => todo.status === activeFilter);
  return sortTodosForFilter(filteredTodos);
};

export const serializeTodo = (todo) => ({
  ...todo,
  state: STATUS_LABEL[todo.status],
});

export const normalizeTodo = (todo, today) => {
  if (!todo || typeof todo !== 'object') return null;
  if (typeof todo.id !== 'string' || typeof todo.content !== 'string') return null;

  const contentResult = validateContent(todo.content);
  if (!contentResult.valid) return null;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(todo.date) ? todo.date : today;
  const status = Object.values(TODO_STATUS).includes(todo.status)
    ? todo.status
    : LABEL_STATUS[todo.state] ?? getInitialStatus(date, today);
  const createdAt = Number.isFinite(todo.createdAt) ? todo.createdAt : getTimestamp();
  const updatedAt = Number.isFinite(todo.updatedAt) ? todo.updatedAt : createdAt;

  return {
    id: todo.id,
    content: contentResult.content,
    date,
    createdAt,
    updatedAt,
    status,
  };
};
