import { useEffect, useState } from 'react';
import { CONTENT_MAX_LENGTH } from '../features/todo/todoConstants.js';

const TodoForm = ({ selectedDate, onAdd, onValidationError }) => {
  const [content, setContent] = useState('');
  const [date, setDate] = useState(selectedDate);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = onAdd({ content, date });
    if (!result.ok) {
      setHasError(true);
      onValidationError(result.error);
      return;
    }

    setContent('');
    setHasError(false);
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate>
      <div className="input-group input-group--content">
        <label htmlFor="todo-content">할 일</label>
        <input
          id="todo-content"
          name="todo-content"
          type="text"
          maxLength={CONTENT_MAX_LENGTH}
          autoComplete="off"
          placeholder="할 일을 입력하세요"
          value={content}
          className={hasError ? 'error' : ''}
          onChange={(event) => {
            setContent(event.target.value);
            setHasError(false);
          }}
        />
        <span className="character-count">
          {content.length}
          {' / '}
          {CONTENT_MAX_LENGTH}
        </span>
      </div>
      <div className="input-group">
        <label htmlFor="todo-date">날짜</label>
        <input
          id="todo-date"
          name="todo-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <button className="primary-button" type="submit">추가</button>
    </form>
  );
};

export default TodoForm;
