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

// Todo content 유효성 검사 로직
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

// Todo 객체 생성 및 업데이트 로직
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
// Todo 객체 업데이트 로직
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

/***
 * 뷰 모드와 필터링 조건에 따라 보여줄 Todo 리스트를 반환하는 로직
 * - 날짜별 보기 모드에서는 선택된 날짜에 해당하는 Todo만 필터링하여 최신순으로 정렬
 * - 필터링 보기 모드에서는 선택된 상태에 따라 Todo를 필터링하고, 상태 우선순위와 최신순으로 정렬
 */
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

/**
 * Todo 객체를 받아서 유효성을 검사하고, 필요한 필드를 보완하여 반환하는 로직
 * - content 필드는 유효성 검사를 통해 공백 제거 및 최대 길이 제한을 적용
 * - date 필드는 YYYY-MM-DD 형식인지 검사하고, 유효하지 않으면 오늘 날짜로 설정
 * - status 필드는 TODO_STATUS에 포함된 값인지 검사하고, 유효하지 않으면 date와 today를 기준으로 초기 상태로 설정
 * - createdAt과 updatedAt 필드는 숫자인지 검사하고, 유효하지 않으면 현재 타임스탬프로 설정
 * - 모든 검사를 통과하면 보완된 Todo 객체를 반환하고, 그렇지 않으면 null을 반환
 */
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
