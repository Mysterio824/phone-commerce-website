const db = require("../../infrastructure/database/db");
const orderModel = require("../../infrastructure/database/models/order.m");
const orderDetailModel = require("../../infrastructure/database/models/orderDetail.m");
const orderAddressModel = require("../../infrastructure/database/models/orderAddress.m");
const cartItemModel = require("../../infrastructure/database/models/cartItem.m");
const productModel = require("../../infrastructure/database/models/product.m");
const variantModel = require("../../infrastructure/database/models/productVariant.m");
const couponService = require("./couponService");
const cartService = require("./cartService");
const CustomError = require("../../utils/cerror");

const orderService = {
  createOrder: async (userId, orderData) => {
    const { formattedCart } = await cartService.getFormattedCartData(userId);
    if (!formattedCart.products || formattedCart.products.length === 0) {
      throw new CustomError(400, "Your cart is empty");
    }

    const client = await db.startTransaction();

    try {
      let addressId;
      if (orderData.addressId) {
        const address = await orderAddressModel.one(orderData.addressId);
        if (!address || address.userId !== userId) {
          throw new CustomError(404, "Address not found");
        }
        addressId = address.id;
      } else {
        const addressData = {
          userId,
          fullName: orderData.fullName,
          city: orderData.city,
          district: orderData.district,
          ward: orderData.ward,
          address: orderData.address,
          phoneNumber: orderData.phoneNumber,
          note: orderData.note || null,
          state: orderData.state || null,
        };
        const newAddress = await orderAddressModel.add(addressData, client);
        addressId = newAddress.id;
      }

      let couponId = null;
      let totalPrice = formattedCart.totalPrice;

      if (orderData.couponCode) {
        try {
          const couponResult = await couponService.applyCouponDiscount(
            orderData.couponCode, 
            totalPrice
          );
          couponId = couponResult.couponId;
          totalPrice = couponResult.finalAmount;
        } catch (error) {
          console.error("Coupon validation failed:", error.message);
        }
      }

      const order = {
        userId,
        totalPrice,
        addressId,
        couponId,
        payingMethod: orderData.payingMethod,
        shippingMethod: orderData.shippingMethod,
        status: "Pending",
      };

      const newOrder = await orderModel.add(order, client);

      for (const item of formattedCart.products) {
        const variant = await variantModel.one(item.product.variantId);
        if (variant.stock < item.quantity) {
          throw new CustomError(
            400,
            `Insufficient stock for ${item.product.name}`
          );
        }

        const orderDetail = {
          orderId: newOrder.id,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
        };

        await orderDetailModel.add(orderDetail, client);

        variant.stock -= item.quantity;
        await variantModel.edit(variant, client);
      }

      if (couponId) {
        await couponService.incrementUses(couponId);
      }

      const cartItems = await cartItemModel.all(userId, client);
      for (const item of cartItems) {
        await cartItemModel.delete(item.id, client);
      }

      await db.commitTransaction(client);
      return newOrder;
    } catch (error) {
      await db.rollbackTransaction(client);
      throw error;
    }
  },

  getOrder: async (orderId, userId) => {
    const order = await orderModel.one(orderId);
    if (!order || order.userId !== userId) {
      throw new CustomError(404, "Order not found");
    }

    const orderDetails = await orderDetailModel.some(orderId);
    const address = await orderAddressModel.one(order.addressId);

    const formattedOrderDetails = await Promise.all(
      orderDetails.map(async (detail) => {
        const product = await productModel.one("id", detail.productId);
        return {
          id: detail.id,
          productId: detail.productId,
          productName: product ? product.name : "Product no longer available",
          productImage: product ? product.thumbUrl : null,
          quantity: detail.quantity,
          price: detail.price,
        };
      })
    );

    return {
      id: order.id,
      userId: order.userId,
      totalPrice: order.totalPrice,
      status: order.status,
      shippingMethod: order.shippingMethod,
      payingMethod: order.payingMethod,
      address,
      items: formattedOrderDetails,
      createdAt: order.createdAt,
    };
  },

  getUserOrders: async (userId, page, perPage) => {
    page = parseInt(page) || 1;
    perPage = parseInt(perPage) || 10;

    const orders = await orderModel.some(userId, page, perPage);

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderDetails = await orderDetailModel.some(order.id);
        return {
          id: order.id,
          totalPrice: order.totalPrice,
          status: order.status,
          itemCount: orderDetails.length,
          createdAt: order.createdAt,
        };
      })
    );

    return formattedOrders;
  },

  updateOrderStatus: async (orderId, status, userId) => {
    const order = await orderModel.one(orderId);

    if (!order) {
      throw new CustomError(404, "Order not found");
    }

    // Only allow admin or the order owner to update
    if (order.userId !== userId) {
      throw new CustomError(
        403,
        "You don't have permission to update this order"
      );
    }

    // Only allow valid status transitions
    const validStatuses = ["Pending", "Delivering", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      throw new CustomError(400, "Invalid order status");
    }

    order.status = status;
    await orderModel.edit(order);

    return order;
  },
};

module.exports = orderService;
