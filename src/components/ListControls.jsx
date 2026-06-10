import { TODO_FILTER, VIEW_MODE } from '../features/todo/todoConstants.js';
import { formatKstDateLabel } from '../shared/date.js';

const FILTER_OPTIONS = [
  { value: TODO_FILTER.ALL, label: '전체' },
  { value: TODO_FILTER.IN_PROGRESS, label: '진행중' },
  { value: TODO_FILTER.COMPLETED, label: '완료' },
];

const ListControls = ({
  activeFilter,
  selectedDate,
  viewMode,
  onFilterChange,
  onNextDate,
  onPreviousDate,
}) => (
  <section className="list-controls" aria-label="목록 보기 설정">
    <div className="date-navigation">
      <button
        className="icon-button"
        type="button"
        aria-label="이전 날짜"
        onClick={onPreviousDate}
      >
        &#8249;
      </button>
      <div>
        <p className="control-label">선택한 날짜</p>
        <strong>{formatKstDateLabel(selectedDate)}</strong>
      </div>
      <button
        className="icon-button"
        type="button"
        aria-label="다음 날짜"
        onClick={onNextDate}
      >
        &#8250;
      </button>
    </div>
    <div className="filter-tabs" role="tablist" aria-label="상태별 보기">
      {FILTER_OPTIONS.map(({ value, label }) => {
        const isActive = viewMode === VIEW_MODE.FILTER && activeFilter === value;
        return (
          <button
            key={value}
            className={`filter-tab${isActive ? ' active' : ''}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  </section>
);

export default ListControls;
