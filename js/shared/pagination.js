export const getTotalPages = (totalItems, itemsPerPage) => (
  Math.max(1, Math.ceil(totalItems / itemsPerPage))
);

export const clampPage = (page, totalPages) => (
  Math.min(Math.max(page, 1), totalPages)
);

export const paginate = (items, page, itemsPerPage) => {
  const startIndex = (page - 1) * itemsPerPage;
  return items.slice(startIndex, startIndex + itemsPerPage);
};

const createPageButton = ({
  label,
  page,
  disabled = false,
  active = false,
  onSelect,
}) => {
  const button = document.createElement('button');
  button.className = `page-button${active ? ' active' : ''}`;
  button.type = 'button';
  button.textContent = label;
  button.disabled = disabled;
  button.setAttribute('aria-label', `${label} 페이지`);
  if (active) button.setAttribute('aria-current', 'page');
  button.addEventListener('click', () => onSelect(page));
  return button;
};

export const renderPagination = (container, currentPage, totalPages, onSelect) => {
  container.replaceChildren();
  if (totalPages <= 1) return;

  container.append(createPageButton({
    label: '이전',
    page: currentPage - 1,
    disabled: currentPage === 1,
    onSelect,
  }));

  for (let page = 1; page <= totalPages; page += 1) {
    container.append(createPageButton({
      label: String(page),
      page,
      active: page === currentPage,
      onSelect,
    }));
  }

  container.append(createPageButton({
    label: '다음',
    page: currentPage + 1,
    disabled: currentPage === totalPages,
    onSelect,
  }));
};
