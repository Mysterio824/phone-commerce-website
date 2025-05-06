const express = require("express");
const reviewController = require("../controllers/reviewController");
const { authorize } = require("../middlewares/authorize");

const router = express.Router();

router.get("/:productId/reviews", reviewController.getReviews);
router.post("/:productId/add", authorize(), reviewController.addReview);
router.put("/:reviewId/edit", authorize(), reviewController.updateReview);
router.delete("/:reviewId/delete", authorize(), reviewController.deleteReview);

module.exports = router;
