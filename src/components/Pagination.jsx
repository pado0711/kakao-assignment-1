const createPageNumbers = (totalPages) => (
  Array.from({ length: totalPages }, (_, index) => index + 1)
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="페이지 이동">
      <button
        className="page-button"
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        이전
      </button>
      {createPageNumbers(totalPages).map((page) => (
        <button
          key={page}
          className={`page-button${page === currentPage ? ' active' : ''}`}
          type="button"
          aria-current={page === currentPage ? 'page' : undefined}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        className="page-button"
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음
      </button>
    </nav>
  );
};

export default Pagination;
