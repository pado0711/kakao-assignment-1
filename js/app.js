import {
  ITEMS_PER_PAGE,
  STORAGE_KEY,
  TODO_FILTER,
} from './features/todo/todoConstants.js';
import {
  createTodo,
  selectVisibleTodos,
  toggleTodo,
  updateTodo,
  validateContent,
} from './features/todo/todoService.js';
import { canUseStorage, loadTodos, saveTodos } from './features/todo/todoStorage.js';
import {
  createTodoState,
  replaceTodos,
  showDate,
  showFilter,
} from './features/todo/todoState.js';
import {
  clearContentInput,
  elements,
  markContentInputAsInvalid,
  renderControls,
  renderTodoList,
  updateCharacterCount,
} from './features/todo/todoView.js';
import { getKstDate, shiftDate } from './shared/date.js';
import { showModal } from './shared/modal.js';
import {
  clampPage,
  getTotalPages,
  paginate,
  renderPagination,
} from './shared/pagination.js';

const initialToday = getKstDate();
const initialLoad = loadTodos(initialToday);
const state = createTodoState({ todos: initialLoad.todos, today: initialToday });
state.storageAvailable = canUseStorage();

const getVisibleTodos = () => selectVisibleTodos(state);

const render = () => {
  const visibleTodos = getVisibleTodos();
  const totalPages = getTotalPages(visibleTodos.length, ITEMS_PER_PAGE);
  state.currentPage = clampPage(state.currentPage, totalPages);
  renderControls(state);
  renderTodoList(paginate(visibleTodos, state.currentPage, ITEMS_PER_PAGE), state.editingTodoId);
  renderPagination(elements.pagination, state.currentPage, totalPages, (page) => {
    state.currentPage = clampPage(page, totalPages);
    state.editingTodoId = null;
    render();
  });
};

const commitTodos = (nextTodos) => {
  if (!state.storageAvailable) {
    showModal('현재 브라우저에서는 로컬스토리지를 사용할 수 없습니다.');
    return false;
  }

  const result = saveTodos(nextTodos);
  if (!result.saved) {
    showModal(result.error);
    return false;
  }

  replaceTodos(state, nextTodos);
  return true;
};

const handleAddTodo = (event) => {
  event.preventDefault();
  const validation = validateContent(elements.contentInput.value);
  if (!validation.valid) {
    markContentInputAsInvalid();
    showModal(validation.message);
    return;
  }

  const date = elements.dateInput.value || getKstDate();
  const todo = createTodo({ content: validation.content, date, today: getKstDate() });
  if (!commitTodos([...state.todos, todo])) return;

  clearContentInput();
  showDate(state, date);
  render();
};

const handleUpdateTodo = (todoId, input) => {
  const validation = validateContent(input.value);
  if (!validation.valid) {
    input.classList.add('error');
    showModal(validation.message);
    return;
  }

  const nextTodos = state.todos.map((todo) => (
    todo.id === todoId ? updateTodo(todo, validation.content, getKstDate()) : todo
  ));
  if (!commitTodos(nextTodos)) return;

  state.editingTodoId = null;
  render();
};

const handleListClick = (event) => {
  const { action, id } = event.target.dataset;
  if (!action || !id) return;

  if (action === 'edit') {
    state.editingTodoId = id;
    render();
    return;
  }

  if (action === 'delete') {
    if (!window.confirm('이 할 일을 삭제할까요?')) return;
    if (!commitTodos(state.todos.filter((todo) => todo.id !== id))) return;
    state.editingTodoId = null;
    render();
  }
};

const handleToggleTodo = (event) => {
  const { action, id } = event.target.dataset;
  if (action !== 'toggle' || !id) return;

  const nextTodos = state.todos.map((todo) => (todo.id === id ? toggleTodo(todo) : todo));
  if (!commitTodos(nextTodos)) {
    event.target.checked = !event.target.checked;
    return;
  }

  state.editingTodoId = null;
  render();
};

const handleEditKeydown = (event) => {
  if (!event.target.matches('[data-edit-id]')) return;
  if (event.key === 'Enter') handleUpdateTodo(event.target.dataset.editId, event.target);
  if (event.key === 'Escape') {
    state.editingTodoId = null;
    render();
  }
};

const refreshToday = () => {
  const nextToday = getKstDate();
  if (nextToday === state.today) return;
  const wasShowingToday = state.selectedDate === state.today;
  state.today = nextToday;
  if (wasShowingToday) state.selectedDate = nextToday;
  elements.dateInput.value = nextToday;
  render();
};

elements.form.addEventListener('submit', handleAddTodo);
elements.contentInput.addEventListener('input', updateCharacterCount);
elements.previousDateButton.addEventListener('click', () => {
  showDate(state, shiftDate(state.selectedDate, -1));
  render();
});
elements.nextDateButton.addEventListener('click', () => {
  showDate(state, shiftDate(state.selectedDate, 1));
  render();
});
elements.filterTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    showFilter(state, tab.dataset.filter);
    render();
  });
});
elements.list.addEventListener('click', handleListClick);
elements.list.addEventListener('change', handleToggleTodo);
elements.list.addEventListener('keydown', handleEditKeydown);
document.addEventListener('click', (event) => {
  if (!state.editingTodoId || event.target.closest(`[data-id="${state.editingTodoId}"]`)) return;
  state.editingTodoId = null;
  render();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshToday();
});
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  replaceTodos(state, loadTodos(getKstDate()).todos);
  render();
});

setInterval(refreshToday, 60 * 1000);
elements.dateInput.value = initialToday;
render();

if (initialLoad.error) showModal(initialLoad.error);
if (!state.storageAvailable) showModal('현재 브라우저에서는 로컬스토리지를 사용할 수 없어 변경사항이 저장되지 않습니다.');

window.todoApp = {
  state,
  refreshToday,
  TODO_FILTER,
};
