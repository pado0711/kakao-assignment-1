import { useEffect, useRef, useState } from 'react';
import { STATUS_LABEL, TODO_STATUS } from '../features/todo/todoConstants.js';

const TodoItem = ({
  todo,
  isEditing,
  onCancelEdit,
  onDelete,
  onEdit,
  onToggle,
  onUpdate,
  onValidationError,
}) => {
  const [content, setContent] = useState(todo.content);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setContent(todo.content);
  }, [todo.content]);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const handleUpdate = () => {
    const result = onUpdate(todo.id, content);
    if (!result.ok) {
      setHasError(true);
      onValidationError(result.error);
    }
  };

  return (
    <li className={`todo-item${todo.status === TODO_STATUS.COMPLETED ? ' completed' : ''}`}>
      <input
        className="todo-checkbox"
        type="checkbox"
        checked={todo.status === TODO_STATUS.COMPLETED}
        aria-label={`${todo.content} 완료 처리`}
        onChange={() => onToggle(todo.id)}
      />
      {isEditing ? (
        <input
          ref={inputRef}
          className={`todo-edit-input${hasError ? ' error' : ''}`}
          value={content}
          aria-label="할 일 수정"
          onChange={(event) => {
            setContent(event.target.value);
            setHasError(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleUpdate();
            if (event.key === 'Escape') onCancelEdit();
          }}
        />
      ) : (
        <span className="todo-content">{todo.content}</span>
      )}
      <span className="todo-state">{STATUS_LABEL[todo.status]}</span>
      <div className="todo-actions">
        <button
          className="todo-action"
          type="button"
          onClick={() => {
            if (isEditing) {
              handleUpdate();
              return;
            }
            onEdit(todo.id);
          }}
        >
          수정
        </button>
        <button
          className="todo-action todo-action--delete"
          type="button"
          onClick={() => onDelete(todo.id)}
        >
          삭제
        </button>
      </div>
    </li>
  );
};

export default TodoItem;
