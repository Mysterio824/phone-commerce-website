const categoryValidator = {
  validateCategory: (category) => {
    const errors = [];

    if (!category.name || category.name.trim() === "") {
      errors.push("Category name is required");
    }

    if (category.parent !== undefined && category.parent !== null) {
      const parentId = parseInt(category.parent);
      if (isNaN(parentId) || parentId <= 0) {
        errors.push("Parent category ID must be a positive integer");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

module.exports = categoryValidator;
