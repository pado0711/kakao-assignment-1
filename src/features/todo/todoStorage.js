import { STORAGE_KEY } from './todoConstants.js';
import { normalizeTodo, serializeTodo } from './todoService.js';

const STORAGE_PROBE_KEY = `${STORAGE_KEY}:probe`;

const createLoadSuccess = (todos) => ({ todos, error: null });

const createLoadError = (error) => ({ todos: [], error });

const createSaveSuccess = () => ({ saved: true, error: null });

const createSaveError = (error) => ({ saved: false, error });

export const canUseStorage = () => {
  try {
    localStorage.setItem(STORAGE_PROBE_KEY, 'available');
    localStorage.removeItem(STORAGE_PROBE_KEY);
    return true;
  } catch (error) {
    return false;
  }
};

export const loadTodos = (today) => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return createLoadSuccess([]);

    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) throw new TypeError('Stored todos must be an array.');

    return createLoadSuccess(parsedValue.map((todo) => normalizeTodo(todo, today)).filter(Boolean));
  } catch (error) {
    console.error('Failed to load todos from localStorage.', error);
    return createLoadError('저장된 데이터를 읽을 수 없어 빈 목록으로 시작합니다.');
  }
};

export const saveTodos = (todos) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.map(serializeTodo)));
    return createSaveSuccess();
  } catch (error) {
    console.error('Failed to save todos to localStorage.', error);
    return createSaveError('변경사항을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');
  }
};
