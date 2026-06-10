import { useCallback, useEffect, useState } from 'react';
import { TODO_FILTER, VIEW_MODE } from '../features/todo/todoConstants.js';
import { getKstDate, shiftDate } from '../shared/date.js';

const useView = () => {
  const [today, setToday] = useState(() => getKstDate());
  const [selectedDate, setSelectedDate] = useState(() => getKstDate());
  const [activeFilter, setActiveFilter] = useState(TODO_FILTER.ALL);
  const [viewMode, setViewMode] = useState(VIEW_MODE.DATE);
  const [currentPage, setCurrentPage] = useState(1);

  const goToDate = useCallback((date) => {
    setSelectedDate(date);
    setViewMode(VIEW_MODE.DATE);
    setCurrentPage(1);
  }, []);

  const shiftSelectedDate = useCallback((amount) => {
    setSelectedDate((currentDate) => shiftDate(currentDate, amount));
    setViewMode(VIEW_MODE.DATE);
    setCurrentPage(1);
  }, []);

  const setFilter = useCallback((filter) => {
    setActiveFilter(filter);
    setViewMode(VIEW_MODE.FILTER);
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const refreshToday = useCallback(() => {
    const nextToday = getKstDate();
    setToday((currentToday) => {
      if (currentToday === nextToday) return currentToday;
      setSelectedDate((currentDate) => (currentDate === currentToday ? nextToday : currentDate));
      return nextToday;
    });
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshToday();
    };
    const intervalId = window.setInterval(refreshToday, 60 * 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshToday]);

  return {
    today,
    selectedDate,
    activeFilter,
    viewMode,
    currentPage,
    goToDate,
    shiftSelectedDate,
    setFilter,
    goToPage,
    refreshToday,
  };
};

export default useView;
