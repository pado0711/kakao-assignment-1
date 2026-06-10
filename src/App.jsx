import './App.css';
import { useEffect, useMemo } from 'react';
import ListControls from './components/ListControls.jsx';
import Modal from './components/Modal.jsx';
import Pagination from './components/Pagination.jsx';
import TodoForm from './components/TodoForm.jsx';
import TodoList from './components/TodoList.jsx';
import { ITEMS_PER_PAGE, TODO_FILTER } from './features/todo/todoConstants.js';
import useModal from './hooks/useModal.js';
import useTodos from './hooks/useTodos.js';
import useView from './hooks/useView.js';
import { formatKstDateLabel } from './shared/date.js';
import { clampPage, getTotalPages, paginate } from './shared/pagination.js';

const FILTER_LABEL = {
  [TODO_FILTER.ALL]: '전체',
  [TODO_FILTER.IN_PROGRESS]: '진행중',
  [TODO_FILTER.COMPLETED]: '완료',
};

const App = () => {
  const {
    message,
    showModal,
    closeModal,
  } = useModal();
  const {
    activeFilter,
    currentPage,
    goToDate,
    goToPage,
    selectedDate,
    setFilter,
    shiftSelectedDate,
    viewMode,
  } = useView();
  const todoState = useTodos({
    selectedDate,
    activeFilter,
    viewMode,
    onStorageError: showModal,
  });
  const totalPages = getTotalPages(todoState.visibleTodos.length, ITEMS_PER_PAGE);
  const safeCurrentPage = clampPage(currentPage, totalPages);
  const paginatedTodos = useMemo(() => paginate(
    todoState.visibleTodos,
    safeCurrentPage,
    ITEMS_PER_PAGE,
  ), [safeCurrentPage, todoState.visibleTodos]);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) goToPage(safeCurrentPage);
  }, [currentPage, goToPage, safeCurrentPage]);

  useEffect(() => {
    if (todoState.loadError) showModal(todoState.loadError);
    if (!todoState.storageAvailable) {
      showModal('현재 브라우저에서는 로컬스토리지를 사용할 수 없어 변경사항이 저장되지 않습니다.');
    }
  }, [showModal, todoState.loadError, todoState.storageAvailable]);

  const handleAdd = (payload) => {
    const result = todoState.handleAdd(payload);
    if (result.ok) goToDate(result.todo.date);
    return result;
  };

  const handleDelete = (todoId) => {
    if (!window.confirm('이 할 일을 삭제할까요?')) return;
    todoState.handleDelete(todoId);
  };

  return (
    <main className="app-shell">
      <section className="todo-card" aria-labelledby="app-title">
        <header className="app-header">
          <p className="eyebrow">TODO LIST</p>
          <h1 id="app-title">오늘의 할 일</h1>
          <p className="header-copy">작은 일부터 차근차근 기록해 보세요.</p>
        </header>
        <TodoForm
          selectedDate={selectedDate}
          onAdd={handleAdd}
          onValidationError={showModal}
        />
        <ListControls
          activeFilter={activeFilter}
          selectedDate={selectedDate}
          viewMode={viewMode}
          onFilterChange={setFilter}
          onPreviousDate={() => shiftSelectedDate(-1)}
          onNextDate={() => shiftSelectedDate(1)}
        />
        <div className="view-summary">
          <p>
            {viewMode === 'date'
              ? `${formatKstDateLabel(selectedDate)}의 할 일`
              : `${FILTER_LABEL[activeFilter]} 상태의 모든 할 일`}
          </p>
          <p className="storage-notice" role="status">
            {todoState.storageAvailable ? '' : '저장 불가 모드'}
          </p>
        </div>
        <TodoList
          todos={paginatedTodos}
          editingTodoId={todoState.editingTodoId}
          onCancelEdit={() => todoState.setEditingTodoId(null)}
          onDelete={handleDelete}
          onEdit={todoState.setEditingTodoId}
          onToggle={todoState.handleToggle}
          onUpdate={todoState.handleUpdate}
          onValidationError={showModal}
        />
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      </section>
      <Modal message={message} onClose={closeModal} />
    </main>
  );
};

export default App;
