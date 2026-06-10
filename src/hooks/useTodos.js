import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createTodo,
  selectVisibleTodos,
  toggleTodo,
  updateTodo,
  validateContent,
} from '../features/todo/todoService.js';
import { canUseStorage, loadTodos, saveTodos } from '../features/todo/todoStorage.js';
import { getKstDate } from '../shared/date.js';

const createSuccessResult = () => ({ ok: true, error: null });

const createErrorResult = (error) => ({ ok: false, error });

const useTodos = ({
  selectedDate,
  activeFilter,
  viewMode,
  onStorageError,
} = {}) => {
  const initialTodayRef = useRef(getKstDate());
  const initialLoadRef = useRef(loadTodos(initialTodayRef.current));
  const skipInitialSaveRef = useRef(true);
  const [todos, setTodos] = useState(initialLoadRef.current.todos);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [storageAvailable] = useState(() => canUseStorage());
  const [loadError] = useState(initialLoadRef.current.error);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (skipInitialSaveRef.current) {
      skipInitialSaveRef.current = false;
      return;
    }

    if (!storageAvailable) {
      const error = '현재 브라우저에서는 로컬스토리지를 사용할 수 없습니다.';
      setSaveError(error);
      onStorageError?.(error);
      return;
    }

    const result = saveTodos(todos);
    setSaveError(result.error);
    if (!result.saved) onStorageError?.(result.error);
  }, [onStorageError, storageAvailable, todos]);

  const visibleTodos = useMemo(() => selectVisibleTodos({
    todos,
    selectedDate,
    activeFilter,
    viewMode,
  }), [activeFilter, selectedDate, todos, viewMode]);

  const handleAdd = useCallback(({ content, date }) => {
    const validation = validateContent(content);
    if (!validation.valid) return createErrorResult(validation.message);

    const today = getKstDate();
    const todo = createTodo({
      content: validation.content,
      date: date || today,
      today,
    });
    setTodos((currentTodos) => [...currentTodos, todo]);
    setEditingTodoId(null);
    return createSuccessResult();
  }, []);

  const handleToggle = useCallback((todoId) => {
    setTodos((currentTodos) => currentTodos.map((todo) => (
      todo.id === todoId ? toggleTodo(todo) : todo
    )));
    setEditingTodoId(null);
  }, []);

  const handleDelete = useCallback((todoId) => {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== todoId));
    setEditingTodoId(null);
  }, []);

  const handleUpdate = useCallback((todoId, content) => {
    const validation = validateContent(content);
    if (!validation.valid) return createErrorResult(validation.message);

    setTodos((currentTodos) => currentTodos.map((todo) => (
      todo.id === todoId ? updateTodo(todo, validation.content, getKstDate()) : todo
    )));
    setEditingTodoId(null);
    return createSuccessResult();
  }, []);

  return {
    todos,
    visibleTodos,
    editingTodoId,
    storageAvailable,
    loadError,
    saveError,
    setEditingTodoId,
    handleAdd,
    handleToggle,
    handleDelete,
    handleUpdate,
  };
};

export default useTodos;
