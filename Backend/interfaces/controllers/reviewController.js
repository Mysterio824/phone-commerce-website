const reviewService = require("../../application/services/reviewService");

const reviewController = {
  getReviews: async (req, res, next) => {
    try {
      const productId = parseInt(req.params.productId);
      if (!productId) {
        return res.status(400).json({ message: "Invalid product ID." });
      }
      const { page, perPage } = req.query;

      const { currentPage, totalPages, reviews } =
        await reviewService.getReviews(productId, page, perPage);
      res
        .status(200)
        .json({ data: { reviews, currentPage, totalPages, perPage } });
    } catch (error) {
      console.error(error.message);
      next(new CustomError(500, "Failed to fetch rating."));
    }
  },

  addReview: async (req, res, next) => {
    try {
      const userId = req.user.uid;

      const { productId, rating, comment } = req.body;
      if (!productId || !rating) {
        return res
          .status(400)
          .json({ message: "Product ID and rating are required." });
      }

      const review = await reviewService.addReview(
        userId,
        productId,
        rating,
        comment
      );
      res.status(201).json({ data: review });
    } catch (error) {
      console.error(error.message);
      next(new CustomError(500, "Failed to add review."));
    }
  },

  updateReview: async (req, res, next) => {
    try {
      const userId = req.user.uid;

      const { reviewId, rating, comment } = req.body;
      if (!reviewId || !rating) {
        return res
          .status(400)
          .json({ message: "Review ID and rating are required." });
      }

      const review = await reviewService.updateReview(
        userId,
        reviewId,
        rating,
        comment
      );
      res.status(200).json({ data: review });
    } catch (error) {
      console.error(error.message);
      next(new CustomError(500, "Failed to update review."));
    }
  },

  deleteReview: async (req, res, next) => {
    try {
      const userId = req.user.uid;

      const reviewId = parseInt(req.params.reviewId);
      if (!reviewId) {
        return res.status(400).json({ message: "Invalid review ID." });
      }

      await reviewService.deleteReview(userId, reviewId);
      res.status(200).json({ message: "Review deleted successfully." });
    } catch (error) {
      console.error(error.message);
      next(new CustomError(500, "Failed to delete review."));
    }
  },
};

module.exports = reviewController;
