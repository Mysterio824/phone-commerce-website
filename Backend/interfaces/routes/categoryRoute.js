const categoryController = require("../controllers/categoryController");
const { authorize } = require("../middlewares/authorize");
const ROLES = require("../../application/enums/roles");

const router = require("express").Router();
router.get("/", categoryController.getAll);

router.put(
  "/edit",
  authorize({ roles: ROLES.ADMIN }),
  categoryController.putEditCategory
);
router.post(
  "/add",
  authorize({ roles: ROLES.ADMIN }),
  categoryController.postAddCategory
);
router.delete(
  "/delete",
  authorize({ roles: ROLES.ADMIN }),
  categoryController.deleteCategory
);

module.exports = router;
