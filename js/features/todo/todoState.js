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
  state.todos = todos;
};

export const showDate = (state, date) => {
  state.selectedDate = date;
  state.viewMode = VIEW_MODE.DATE;
  state.currentPage = 1;
};

export const showFilter = (state, filter) => {
  state.activeFilter = filter;
  state.viewMode = VIEW_MODE.FILTER;
  state.currentPage = 1;
};
