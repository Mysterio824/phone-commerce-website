const MyError = require('../modules/cerror');
const axios = require('axios');

module.exports = {
    getProducts: async (req, res, next) => {
        try {
            // let page = parseInt(req.body.page) || 1;
            // const per_page = parseInt(req.body.per_page) || 5;
            // const min = parseInt(req.body.min) || 0;
            // const max = parseInt(req.body.max) || Infinity;
            // const sort = req.body.sort || 'none';
            // const query = req.cookies.search_query || '';
            // const catID = parseInt(req.body.catID) || 0;

            // let products = await productsModel.all();
            // let category = await categoryController.getAll();
            // let cateMap = await categoryController.getMapCate();
            // if (catID !== 0) {
            //     const selectedCategory = findCategoryById(category, catID);
            //     if (!selectedCategory) return res.status(404).json({ message: "Category not found" });
                
            //     if (selectedCategory.children?.length > 0) {
            //         products = products.filter(item => 
            //             item.category_id &&
            //             (item.category_id === catID || 
            //             selectedCategory.children.some(cate => cate.id === item.category_id))
            //         );
            //     } else {
            //         products = products.filter(item => item.category_id === catID);
            //     }
            // }            

            // products = products.filter(item =>
            //     item.price >= min && item.price <= max &&
            //     (item.name.toLowerCase().includes(query.toLowerCase()) ||
            //     (item.category_id && cateMap.get(item.category_id)?.name.toLowerCase().includes(query.toLowerCase())))
            // );
            

            // if (sort === 'min') products.sort((a, b) => a.price - b.price);
            // if (sort === 'max') products.sort((a, b) => b.price - a.price);

            // const total_pages = Math.ceil(products.length / per_page);
            // if(total_pages === 0 && page === 1) {
            //     return res.json({page, total_pages, per_page, products, category, catID});
            // }
            // if (page > total_pages) page = total_pages;

            // products = products.slice((page - 1) * per_page, page * per_page);

            // res.json({ category, products, page, total_pages, catID });
        } catch (error) {
            console.error(error.message);
            next(new MyError(500, 'DB error'));
        }
    },

    getDetail: async (req, res, next) => {
        // try {
        //     const user = req.user || {};
        //     const id = parseInt(req.params.id);
        //     const product = await productsModel.one('id', id);

        //     if (!product) return next(new MyError(404, "Product not found or already been deleted"));
        //     const relativeProducts = await productsModel.allWithCondition('category_id', product.category_id);
        //     res.render('products/productDetail', { product, relativeProducts, user });
        // } catch (error) {
        //     console.error(error.message);
        //     next(new MyError(500, 'Error fetching product detail'));
        // }
    },
};