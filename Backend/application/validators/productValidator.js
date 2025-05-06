const productValidator = {
  validateProduct: (product) => {
    const errors = [];

    // Business rule validations
    if (product.name && product.name.length < 3) {
      errors.push("Product name must be at least 3 characters");
    }

    if (product.variants && product.variants.some((v) => v.price < 0)) {
      errors.push("Product variant prices cannot be negative");
    }

    return {
      Valid: errors.length === 0,
      errors,
    };
  },
  validateFilters: (filters = {}) => {
    return {
      page: Math.max(1, parseInt(filters.page) || 1),
      perPage: Math.min(50, Math.max(1, parseInt(filters.perPage) || 10)),
      min: Math.max(0, parseFloat(filters.min) || 0),
      max: parseFloat(filters.max) > 0 ? parseFloat(filters.max) : Infinity,
      sort: ["min", "max", "rating", "newest"].includes(filters.sort)
        ? filters.sort
        : "",
      query: (filters.query || "").toString().toLowerCase(),
      cateId: parseInt(filters.cateId) || 0,
      rating: Math.max(0, Math.min(5, parseFloat(filters.rating) || 0)),
      brandId: parseInt(filters.brandId) || 0,
    };
  },
};

module.exports = productValidator;
