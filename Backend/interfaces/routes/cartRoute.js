const cartController = require("../controllers/cartController");
const { authorize } = require("../middlewares/authorize");

const router = require("express").Router();
router.get(
  "/:id",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  cartController.getCartData
);

router.post(
  "/:id/add",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  cartController.addProduct
);

router.put(
  "/:id/update",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  cartController.updateProduct
);

router.delete(
  "/:id/delete",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  cartController.deleteProduct
);

module.exports = router;
