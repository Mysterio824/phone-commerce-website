const { validateFilters } = require('../validators/productValidator');
const { getPagination } = require('../utils/paginationUtils');

class ProductFilterService {
  constructor(categoryService) {
    this.categoryService = categoryService;
  }

  async applyFilters(products, filters) {
    const validatedFilters = validateFilters(filters);
    const {
      page, perPage, min, max, sort, query,
      cateId, rating, brandId
    } = validatedFilters;

    const categories = await this.categoryService.buildCategoryHierarchy();
    const categoryMap = await this.categoryService.getCategoryMap();

    let filteredProducts = [...products];

    try {
      filteredProducts = await this._filterByCategory(filteredProducts, cateId);
      if (!filteredProducts) {
        return this._createEmptyResponse(categories, validatedFilters);
      }

      if (brandId !== 0) {
        filteredProducts = this._filterByBrand(filteredProducts, brandId);
      }

      filteredProducts = this._filterByPrice(filteredProducts, min, max);
      filteredProducts = this._filterByRating(filteredProducts, rating);
      filteredProducts = this._filterBySearchQuery(filteredProducts, query, categoryMap);

      // Apply sorting
      filteredProducts = this._sortProducts(filteredProducts, sort);

      // Handle pagination and results
      return this._prepareResponse(filteredProducts, categories, validatedFilters);
    } catch (error) {
      console.error('Error in product filtering:', error);
      return this._createEmptyResponse(categories, validatedFilters, error.message);
    }
  }

  _filterByBrand(products, brandId) {
    return products.filter(item => item.brandid === brandId);
  }

  _filterByPrice(products, min, max) {
    return products.filter(item => {
      const hasVariantInRange = item.variants && item.variants.length > 0
        ? item.variants.some(v => v.price >= min && v.price <= max)
        : true;
      return hasVariantInRange;
    });
  }

  _filterByRating(products, minRating) {
    return products.filter(item => item.rating >= minRating);
  }

  _filterBySearchQuery(products, query, categoryMap) {
    if (!query) return products;

    return products.filter(item => {
      // Search in name
      if (item.name.toLowerCase().includes(query)) return true;

      // Search in description
      if (item.description && item.description.toLowerCase().includes(query)) return true;

      // Search in category
      if (item.cateid) {
        const category = categoryMap.get(item.cateid);
        if (category && category.name.toLowerCase().includes(query)) return true;
      }

      // Search in brand
      if (item.brand && item.brand.name.toLowerCase().includes(query)) return true;

      return false;
    });
  }

  async _filterByCategory(products, cateId) {
    if (cateId === 0) {
      return products;
    }

    const selectedCategory = await this.categoryService.findCategoryById(cateId);
    if (!selectedCategory) {
      return null;
    }

    if (selectedCategory.children?.length > 0) {
      const childCategoryIds = new Set();
      for (const child of selectedCategory.children) {
        childCategoryIds.add(child.id);
      }

      return products.filter(item =>
        item.cateid &&
        (item.cateid === cateId || childCategoryIds.has(item.cateid))
      );
    } else {
      return products.filter(item => item.cateid === cateId);
    } 
  }

  _sortProducts(products, sortType) {
    const productsCopy = [...products];

    switch (sortType) {
      case 'min':
        return productsCopy.sort((a, b) => {
          const aMinPrice = a.variants && a.variants.length > 0
            ? Math.min(...a.variants.map(v => v.price))
            : Infinity;
          const bMinPrice = b.variants && b.variants.length > 0
            ? Math.min(...b.variants.map(v => v.price))
            : Infinity;
          return aMinPrice - bMinPrice;
        });
      case 'max':
        return productsCopy.sort((a, b) => {
          const aMaxPrice = a.variants && a.variants.length > 0
            ? Math.max(...a.variants.map(v => v.price))
            : 0;
          const bMaxPrice = b.variants && b.variants.length > 0
            ? Math.max(...b.variants.map(v => v.price))
            : 0;
          return bMaxPrice - aMaxPrice;
        });
      case 'rating':
        return productsCopy.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return productsCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default:
        return productsCopy;
    }
  }

  _prepareResponse(products, categories, filters) {
    const { page, perPage, cateId, min, max, sort, query, rating, brandId } = filters;
    const totalResults = products.length;

    // Handle empty results
    if (totalResults === 0) {
      return this._createEmptyResponse(categories, filters);
    }

    // Calculate pagination
    const { currentPage, totalPages, startIdx, endIdx } = getPagination(page, perPage, totalResults);
    const pagedProducts = products.slice(startIdx, endIdx);

    return {
      categories,
      products: pagedProducts,
      page: currentPage,
      totalPages,
      totalResults,
      perPage,
      filters: { min, max, sort, query, rating, brandId, cateId }
    };
  }

  _createEmptyResponse(categories, filters, errorMessage = null) {
    const { catID, perPage } = filters;
    const response = {
      categories,
      products: [],
      page: 1,
      totalPages: 1,
      perPage,
      catID,
      totalResults: 0
    };

    if (errorMessage) {
      response.message = errorMessage;
    }

    return response;
  }
}

module.exports = ProductFilterService;
