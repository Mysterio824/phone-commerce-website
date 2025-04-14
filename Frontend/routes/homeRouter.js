const homeController = require('../controllers/homeController');
const router = require('express').Router();

router.get('/', homeController.getLobby);

router.get('/search', homeController.getSearchPage);

router.post('/store_query', homeController.storeQuery);

module.exports = router;