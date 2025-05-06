const paginationUtils = {
  getPagination: (page, perPage, totalResults) => {
    const totalPages = Math.ceil(totalResults / perPage);
    const currentPage = Math.min(page, totalPages || 1);
    const startIdx = (currentPage - 1) * perPage;
    const endIdx = Math.min(startIdx + perPage, totalResults);

    return { currentPage, totalPages, startIdx, endIdx };
  },
};

module.exports = paginationUtils;
