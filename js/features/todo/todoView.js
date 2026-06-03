import { CONTENT_MAX_LENGTH, STATUS_LABEL, VIEW_MODE } from './todoConstants.js';
import { formatKstDateLabel } from '../../shared/date.js';

const elements = {
  form: document.querySelector('#todo-form'),
  contentInput: document.querySelector('#todo-content'),
  dateInput: document.querySelector('#todo-date'),
  characterCount: document.querySelector('#character-count'),
  selectedDateLabel: document.querySelector('#selected-date-label'),
  previousDateButton: document.querySelector('#previous-date'),
  nextDateButton: document.querySelector('#next-date'),
  filterTabs: document.querySelectorAll('.filter-tab'),
  viewTitle: document.querySelector('#view-title'),
  storageNotice: document.querySelector('#storage-notice'),
  list: document.querySelector('#todo-list'),
  pagination: document.querySelector('#pagination'),
};

const createActionButton = (label, action, id) => {
  const button = document.createElement('button');
  button.className = `todo-action${action === 'delete' ? ' todo-action--delete' : ''}`;
  button.type = 'button';
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
};

const createTodoItem = (todo, editingTodoId) => {
  const item = document.createElement('li');
  item.className = `todo-item${todo.status === 'completed' ? ' completed' : ''}`;
  item.dataset.id = todo.id;

  const checkbox = document.createElement('input');
  checkbox.className = 'todo-checkbox';
  checkbox.type = 'checkbox';
  checkbox.checked = todo.status === 'completed';
  checkbox.dataset.action = 'toggle';
  checkbox.dataset.id = todo.id;
  checkbox.setAttribute('aria-label', `${todo.content} 완료 처리`);

  const content = editingTodoId === todo.id
    ? document.createElement('input')
    : document.createElement('span');
  if (editingTodoId === todo.id) {
    content.className = 'todo-edit-input';
    content.value = todo.content;
    content.maxLength = CONTENT_MAX_LENGTH;
    content.dataset.editId = todo.id;
    content.setAttribute('aria-label', '할 일 수정');
  } else {
    content.className = 'todo-content';
    content.textContent = todo.content;
  }

  const state = document.createElement('span');
  state.className = 'todo-state';
  state.textContent = STATUS_LABEL[todo.status];

  const actions = document.createElement('div');
  actions.className = 'todo-actions';
  actions.append(
    createActionButton('수정', 'edit', todo.id),
    createActionButton('삭제', 'delete', todo.id),
  );

  item.append(checkbox, content, state, actions);
  return item;
};

export const renderTodoList = (todos, editingTodoId) => {
  elements.list.replaceChildren();
  if (todos.length === 0) {
    const emptyState = document.createElement('li');
    emptyState.className = 'empty-state';
    emptyState.textContent = '해당 조건의 할 일이 없습니다.';
    elements.list.append(emptyState);
    return;
  }

  elements.list.append(...todos.map((todo) => createTodoItem(todo, editingTodoId)));
  const editInput = elements.list.querySelector('[data-edit-id]');
  editInput?.focus();
  editInput?.select();
};

export const renderControls = (state) => {
  elements.selectedDateLabel.textContent = formatKstDateLabel(state.selectedDate);
  elements.dateInput.value ||= state.today;
  elements.filterTabs.forEach((tab) => {
    const isActive = state.viewMode === VIEW_MODE.FILTER && tab.dataset.filter === state.activeFilter;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
  elements.viewTitle.textContent = state.viewMode === VIEW_MODE.DATE
    ? `${formatKstDateLabel(state.selectedDate)}의 할 일`
    : `${document.querySelector(`[data-filter="${state.activeFilter}"]`).textContent} 상태의 모든 할 일`;
  elements.storageNotice.textContent = state.storageAvailable ? '' : '저장 불가 모드';
};

export const markContentInputAsInvalid = () => {
  elements.contentInput.classList.add('error');
  elements.contentInput.focus();
};

export const clearContentInput = () => {
  elements.contentInput.value = '';
  elements.contentInput.classList.remove('error');
  elements.characterCount.textContent = `0 / ${CONTENT_MAX_LENGTH}`;
};

export const updateCharacterCount = () => {
  elements.characterCount.textContent = `${elements.contentInput.value.length} / ${CONTENT_MAX_LENGTH}`;
  elements.contentInput.classList.remove('error');
};

export { elements };
