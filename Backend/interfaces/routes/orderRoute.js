const orderController = require("../controllers/orderController");
const { authorize } = require("../middlewares/authorize");

const router = require("express").Router();

// Get checkout data (pre-checkout information)
router.get(
  "/:id/checkout-data",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  orderController.getCheckoutData
);

router.post(
  "/:id/checkout",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  orderController.createOrder
);

router.get(
  "/:id",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  orderController.getUserOrders
);

router.get(
  "/:id/:orderId",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  orderController.getOrderById
);

router.put(
  "/:id/:orderId/status",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  orderController.updateOrderStatus
);

module.exports = router;
