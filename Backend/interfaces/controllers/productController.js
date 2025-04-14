const CustomError = require('../../utils/cerror');
const productService = require('../../application/services/productService');
const { success } = require('../passport/strategies/loginStrategy');

const productController = {
    getProducts: async (req, res, next) => {
        try {
            const filters = {
                page: parseInt(req.body.page) || 1,
                per_page: parseInt(req.body.per_page) || 5,
                min: parseInt(req.body.min) || 0,
                max: parseInt(req.body.max) || Infinity,
                sort: req.body.sort || 'none',
                query: req.cookies.search_query || '',
                catID: parseInt(req.body.catID) || 0
            };

            const result = await productService.getFilteredProducts(filters);
            res.status(200).json({
                message: "Products fetched successfully",
                data: result,
            });
        } catch (error) {
            console.error(error.message);
            next(new CustomError(500, 'DB error'));
        }
    },

    getDetail: async (req, res, next) => {
        try {
            const user = req.user || {};
            const id = parseInt(req.params.id);
            
            const result = await productService.getProductDetail(id);
            if (!result.product) {
                return next(new CustomError(404, "Product not found or already been deleted"));
            }
            
            res.staus(200).json({ 
                message: "Product detail fetched successfully",
                data: {
                    product: result.product, 
                    relativeProducts: result.relativeProducts
                },

            });
        } catch (error) {
            console.error(error.message);
            next(new CustomError(500, 'Error fetching product detail'));
        }
    },

    postAddProduct: async (req, res, next) => {
        try {
            const { name, description, price, stock, category_id, image, user } = req.body;
            
            if (!user || !user.is_admin) {
                return res.status(400).json({message: "Invalid request"});
            }

            const productData = { name, description, price, stock, category_id, image };
            const result = await productService.addProduct(productData);
            
            res.status(201).json({ 
                message: "Product added successfully", 
                data: { product: result }
            });
        } catch (error) {
            console.error(error.message);
            next(new CustomError(500, 'Error adding product'));
        }
    },

    putEditProduct: async (req, res, next) => {
        try {
            const { id, name, description, price, stock, category_id, image, user } = req.body;
            
            if (!user || !user.is_admin) {
                return res.status(400).json({message: "Invalid request"});
            }
            
            if (!id) {
                return next(new CustomError(400, 'Product ID is required'));
            }

            const productData = { 
                id: parseInt(id), 
                name, 
                description, 
                price, 
                stock, 
                category_id, 
                image 
            };
            
            const result = await productService.updateProduct(productData);
            
            if (!result) {
                return next(new CustomError(404, 'Product not found'));
            }
            
            res.status(200).json({ 
                message: "Product updated successfully", 
                data: { product: result }
            });
        } catch (error) {
            console.error(error.message);
            next(new CustomError(500, 'Error editing product'));
        }
    },

    deleteProduct: async (req, res, next) => {
        try {
            const { id, user } = req.body;
            
            if (!user || !user.is_admin) {
                return res.status(403).json({ 
                    message: "Invalid request. Only admins can delete products." 
                });
            }
            
            if (!id) {
                return res.status(400).json({message: 'Product ID is required.'});
            }

            const result = await productService.deleteProduct(parseInt(id));
    
            if (!result) {
                return res.status(404).json({message: 'Product not found.'});
            }

            res.status(200).json({
                message: "Product marked as deleted successfully.",
                data: { deletedProduct: result }
            });
        } catch (error) {
            console.error('Error deleting product:', error.message);
            next(new CustomError(500, 'Error deleting product', error));
        }
    },

    uploadImg: (req, res) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send('No files uploaded.');
        }
        
        res.status(201).json({
            message: 'Files uploaded successfully',
            data: {
                files: req.files.map(file => ({
                    filename: file.filename,
                    path: '/imgs/' + file.filename,
                    destination: file.destination,
                })),
            },   
        });
    }
};

module.exports = productController;