const reviewModel = require("../../infrastructure/database/models/productReview.m");
const cacheService = require("../../infrastructure/external/cacheService").forDomain("review");
const { validateReview } = require("../validators/reviewValidator");
const { getPagination } = require("../../utils/paginationUtils");

const CACHE_KEYS = {
  RATING: "rating:",
  REVIEWS: "list:",
};

const CACHE_TTL = {
  RATING: 300, // 5 minutes
  REVIEWS: 180, // 3 minutes
  REVIEW_COUNT: 300, // 5 minutes
};

const reviewService = {
  getAll: async () => {
    try {
      const reviews = await reviewModel.all();
      return reviews;
    } catch (error) {
      console.error("Error getting all reviews:", error);
      throw error;
    }
  },

  getRating: async (productId, forceUpdate = false) => {
    try {
      const cacheKey = `${CACHE_KEYS.RATING}${productId}`;

      if (!forceUpdate) {
        const cached = await cacheService.get(cacheKey);
        if (cached) return cached; // Returns { average, count }
      }

      const reviews = await reviewModel.some("productId", productId);
      if (!reviews?.length) return { average: 0, count: 0 };

      const count = reviews.length;
      const average =
        reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / count;

      const result = {
        average: parseFloat(average.toFixed(1)),
        count,
      };

      await cacheService.set(cacheKey, result, CACHE_TTL.RATING);

      return result;
    } catch (error) {
      console.error(`Error getting rating for product ${productId}:`, error);
      // Fallback to direct calculation
      try {
        const reviews = await reviewModel.some("productId", productId);
        if (!reviews?.length) return { average: 0, count: 0 };

        const count = reviews.length;
        const average =
          reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / count;

        return {
          average: parseFloat(average.toFixed(1)),
          count,
        };
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        return { average: 0, count: 0 };
      }
    }
  },

  getReviews: async (productId, page = 1, perPage = 10) => {
    try {
      // Validate pagination parameters
      page = Math.max(1, parseInt(page) || 1);
      perPage = Math.min(50, Math.max(1, parseInt(perPage) || 10));

      const cacheKey = `${CACHE_KEYS.REVIEWS}${productId}:${page}:${perPage}`;
      let reviews = await cacheService.get(cacheKey);

      if (reviews) {
        return cachedData;
      } else {
        reviews = await reviewModel.some("productId", productId, page, perPage);
        if (!reviews || reviews.length === 0) {
          return { currentPage: 1, totalPages: 1, reviews: [] };
        }
        await cacheService.set(cacheKey, reviews, CACHE_TTL.REVIEWS);
      }

      const { currentPage, totalPages, startIdx, endIdx } = getPagination(
        page,
        perPage,
        reviews.length
      );

      return {
        currentPage,
        totalPages,
        reviews: reviews.slice(startIdx, endIdx),
      };
    } catch (error) {
      console.error(`Error getting reviews for product ${productId}:`, error);
      try {
        const reviews = await reviewModel.some(
          "productId",
          productId,
          page,
          perPage
        );
        if (!reviews || reviews.length === 0) {
          return { currentPage: 1, totalPages: 1, reviews: [] };
        }
        const { currentPage, totalPages, startIdx, endIdx } = getPagination(
          page,
          perPage,
          reviews.length
        );

        return {
          currentPage,
          totalPages,
          reviews: reviews.slice(startIdx, endIdx),
        };
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        return { currentPage: 1, totalPages: 1, reviews: [] };
      }
    }
  },

  invalidateCache: async (productId) => {
    try {
      const keys = [`${CACHE_KEYS.RATING}${productId}`];

      await cacheService.del(keys);
      await cacheService.delByPattern(`${CACHE_KEYS.REVIEWS}${productId}:*`);
    } catch (error) {
      console.error(
        `Error invalidating cache for product ${productId}:`,
        error
      );
    }
  },

  addReview: async (reviewData) => {
    try {
      // Validate review data
      const validation = validateReview(reviewData);
      if (!validation.isValid) {
        throw new Error(`Invalid review data: ${validation.errors.join(", ")}`);
      }

      const result = await reviewModel.add(reviewData);
      await reviewService.invalidateCache(reviewData.productid);

      // Force update of the product rating
      await reviewService.getRating(reviewData.productid, true);

      return result;
    } catch (error) {
      console.error("Error adding review:", error);
      throw error;
    }
  },

  updateReview: async (reviewData) => {
    try {
      // Validate review data
      const validation = validateReview(reviewData);
      if (!validation.isValid) {
        throw new Error(`Invalid review data: ${validation.errors.join(", ")}`);
      }

      // Check if review exists
      const existingReview = await reviewModel.one(reviewData.id);
      if (!existingReview) {
        throw new Error("Review does not exist");
      }

      // Check if user owns the review
      if (existingReview.userid !== reviewData.userid) {
        throw new Error("You can only edit your own reviews");
      }

      const result = await reviewModel.edit(reviewData);
      await reviewService.invalidateCache(reviewData.productid);

      // Force update of the product rating
      await reviewService.getRating(reviewData.productid, true);

      return result;
    } catch (error) {
      console.error("Error updating review:", error);
      throw error;
    }
  },

  deleteReview: async (reviewId, userId) => {
    try {
      // Check if review exists
      const review = await reviewModel.one(reviewId);
      if (!review) {
        throw new Error("Review does not exist");
      }

      // Check if user owns the review or is admin (admin check would be added here if needed)
      if (userId && review.userid !== userId) {
        throw new Error("You can only delete your own reviews");
      }

      const productId = review.productid;
      const result = await reviewModel.delete("id", reviewId);

      await reviewService.invalidateCache(productId);

      // Force update of the product rating
      await reviewService.getRating(productId, true);

      return result;
    } catch (error) {
      console.error("Error deleting review:", error);
      throw error;
    }
  },
};

module.exports = reviewService;
