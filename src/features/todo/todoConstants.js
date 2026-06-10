export const STORAGE_KEY = 'todo-app-v2:todos';
export const CONTENT_MAX_LENGTH = 50;
export const ITEMS_PER_PAGE = 6;

export const TODO_STATUS = Object.freeze({
  DEFAULT: 'default',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
});

export const TODO_FILTER = Object.freeze({
  ALL: 'all',
  IN_PROGRESS: TODO_STATUS.IN_PROGRESS,
  COMPLETED: TODO_STATUS.COMPLETED,
});

export const VIEW_MODE = Object.freeze({
  DATE: 'date',
  FILTER: 'filter',
});

export const STATUS_LABEL = Object.freeze({
  [TODO_STATUS.DEFAULT]: '전체',
  [TODO_STATUS.IN_PROGRESS]: '진행중',
  [TODO_STATUS.COMPLETED]: '완료',
});

export const LABEL_STATUS = Object.freeze({
  전체: TODO_STATUS.DEFAULT,
  진행중: TODO_STATUS.IN_PROGRESS,
  완료: TODO_STATUS.COMPLETED,
});
