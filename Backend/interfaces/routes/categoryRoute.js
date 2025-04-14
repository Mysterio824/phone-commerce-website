const categoryController = require('../controllers/categoryController');

const router = require('express').Router();
router.put('/edit', categoryController.putEditCategory);
router.post('/add', categoryController.postAddCategory);
router.delete('/delete', categoryController.deleteCategory);

module.exports = router;