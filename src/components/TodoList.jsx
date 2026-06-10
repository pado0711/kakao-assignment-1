import TodoItem from './TodoItem.jsx';

const TodoList = ({
  todos,
  editingTodoId,
  onCancelEdit,
  onDelete,
  onEdit,
  onToggle,
  onUpdate,
  onValidationError,
}) => (
  <ul className="todo-list" aria-live="polite">
    {todos.length === 0 ? (
      <li className="empty-state">해당 조건의 할 일이 없습니다.</li>
    ) : todos.map((todo) => (
      <TodoItem
        key={todo.id}
        todo={todo}
        isEditing={editingTodoId === todo.id}
        onCancelEdit={onCancelEdit}
        onDelete={onDelete}
        onEdit={onEdit}
        onToggle={onToggle}
        onUpdate={onUpdate}
        onValidationError={onValidationError}
      />
    ))}
  </ul>
);

export default TodoList;
