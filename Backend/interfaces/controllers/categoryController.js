const CustomError = require("../../utils/cerror");
const categoryService = require("../../application/services/categoryService");

const categoryController = {
  getAll: async (req, res, next) => {
    try {
      const categories = await categoryService.buildCategoryHierarchy();
      return res.status(200).json({data: { categories }})
    } catch (error) {
      console.error("Error in getAll:", error.message);
      next(new CustomError(500, error.message));
    }
  },

  getMapCate: async (req, res, next) => {
    try {
      const categories = await categoryService.getCategoryMap();
      return res.status(200).json({data: { categories }})
    } catch (error) {
      console.error("Error in getMapCate:", error);
      next(new CustomError(500, error.message));
    }
  },

  getAllLowest: async (req, res, next) => {
    try {
      const categories = await categoryService.getLowestCategories();
      return res.status(200).json({
        data: { categories },
      });
    } catch (error) {
      next(new CustomError(500, "Unable to retrieve categories", error));
    }
  },

  postAddCategory: async (req, res, next) => {
    try {
      const { user, name, parent } = req.body;
      if (!user || !user.is_admin || !name) {
        return res.status(400).json({ message: "Invalid request" });
      }

      const addedCategory = await categoryService.addCategory({ name, parent });

      if (!addedCategory) {
        return res.status(500).json({ message: "Can't add this category" });
      }

      return res.status(201).json({
        data: { addedCategory },
      });
    } catch (err) {
      console.error(err.message);
      next(new CustomError(500, err.message));
    }
  },

  putEditCategory: async (req, res, next) => {
    try {
      const { id, name, parent } = req.body;
      if (!id) {
        return next(new CustomError(400, "Invalid category data"));
      }

      const editedCategory = await categoryService.updateCategory({
        id,
        name,
        parent,
      });

      if (!editedCategory) {
        return next(new CustomError(404, "Category not found"));
      }

      return res.status(200).json({
        data: { editedCategory },
      });
    } catch (err) {
      next(new CustomError(500, "Unable to edit category", err));
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      const { user, id } = req.body;
      if (!user || !user.is_admin) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to perform this action.",
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID provided.",
        });
      }

      const deletedCategory = await categoryService.deleteCategory(id);

      if (!deletedCategory) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      return res.status(200).json({
        message: "Category and its subcategories deleted successfully.",
        data: { deletedCategory },
      });
    } catch (err) {
        console.error(err.message);
        next(new CustomError(500, err.message));
    }
  },
};

module.exports = categoryController;
