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
