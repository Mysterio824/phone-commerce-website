const orderService = require("../../application/services/orderService");
const CustomError = require("../../utils/cerror");

const orderController = {
  createOrder: async (req, res, next) => {
    try {
      const userId = req.params.id;
      const orderData = req.body;
      
      // Validate required fields
      const requiredFields = ['payingMethod', 'shippingMethod'];
      
      // If not using existing address, validate address fields
      if (!orderData.addressId) {
        requiredFields.push('fullName', 'city', 'district', 'ward', 'address', 'phoneNumber');
      }
      
      for (const field of requiredFields) {
        if (!orderData[field]) {
          return res.status(400).json({ message: `Missing required field: ${field}` });
        }
      }
      
      const newOrder = await orderService.createOrder(userId, orderData);
      
      res.status(201).json({
        message: "Order created successfully",
        data: { orderId: newOrder.id }
      });
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to create order"));
    }
  },
  
  getOrderById: async (req, res, next) => {
    try {
      const userId = req.params.id;
      const orderId = parseInt(req.params.orderId);
      
      if (!orderId) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await orderService.getOrder(orderId, userId);
      
      res.status(200).json({
        data: { order }
      });
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to retrieve order"));
    }
  },
  
  getUserOrders: async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { page, perPage } = req.query;
      
      const orders = await orderService.getUserOrders(userId, page, perPage);
      
      res.status(200).json({
        data: { orders }
      });
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to retrieve orders"));
    }
  },
  
  updateOrderStatus: async (req, res, next) => {
    try {
      const userId = req.params.id;
      const orderId = parseInt(req.params.orderId);
      const { status } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedOrder = await orderService.updateOrderStatus(orderId, status, userId);
      
      res.status(200).json({
        message: "Order status updated successfully",
        data: { orderId: updatedOrder.id, status: updatedOrder.status }
      });
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to update order status"));
    }
  },
  
  getCheckoutData: async (req, res, next) => {
    try {
      const userId = req.params.id;
      console.log(userId);
      
      const checkoutData = await orderService.getCheckoutData(userId);
      
      res.status(200).json({
        data: checkoutData
      });
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to retrieve checkout data"));
    }
  }
};

module.exports = orderController; 