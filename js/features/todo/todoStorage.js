import { STORAGE_KEY } from './todoConstants.js';
import { normalizeTodo, serializeTodo } from './todoService.js';

const STORAGE_PROBE_KEY = `${STORAGE_KEY}:probe`;

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
    if (!storedValue) return { todos: [], error: null };

    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) throw new TypeError('Stored todos must be an array.');

    return {
      todos: parsedValue.map((todo) => normalizeTodo(todo, today)).filter(Boolean),
      error: null,
    };
  } catch (error) {
    console.error('Failed to load todos from localStorage.', error);
    return {
      todos: [],
      error: '저장된 데이터를 읽을 수 없어 빈 목록으로 시작합니다.',
    };
  }
};

export const saveTodos = (todos) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.map(serializeTodo)));
    return { saved: true, error: null };
  } catch (error) {
    console.error('Failed to save todos to localStorage.', error);
    return {
      saved: false,
      error: '변경사항을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.',
    };
  }
};
