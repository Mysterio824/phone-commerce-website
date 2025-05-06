const express = require("express");
const reviewController = require("../controllers/reviewController");
const { authorize } = require("../middlewares/authorize");

const router = express.Router();

router.get("/:productId/reviews", reviewController.getReviews);
router.post("/:productId/review", authorize(), reviewController.addReview);
router.put("/:reviewId/review", authorize(), reviewController.updateReview);
router.delete("/:reviewId/review", authorize(), reviewController.deleteReview);

module.exports = router;
