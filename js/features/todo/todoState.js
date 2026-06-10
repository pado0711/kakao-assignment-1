import { TODO_FILTER, VIEW_MODE } from './todoConstants.js';

export const createTodoState = ({ todos, today }) => ({
  todos,
  today,
  selectedDate: today,
  activeFilter: TODO_FILTER.ALL,
  viewMode: VIEW_MODE.DATE,
  currentPage: 1,
  editingTodoId: null,
  storageAvailable: true,
});

export const replaceTodos = (state, todos) => {
  Object.assign(state, { todos });
};

export const showDate = (state, date) => {
  Object.assign(state, {
    selectedDate: date,
    viewMode: VIEW_MODE.DATE,
    currentPage: 1,
  });
};

export const showFilter = (state, filter) => {
  Object.assign(state, {
    activeFilter: filter,
    viewMode: VIEW_MODE.FILTER,
    currentPage: 1,
  });
};
