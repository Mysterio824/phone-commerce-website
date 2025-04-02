import { oneOrNone } from "../db";

const cartModel = {
  add: async (cart) => {
    const query = `
      INSERT INTO carts (user_id, cart_total_price)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO NOTHING
      RETURNING *;
    `;
    const values = [cart.user_id, cart.cart_total_price || 0.00];
    return await oneOrNone(query, values);
  },

  findByUserId: async (user_id) => {
    const query = `SELECT * FROM carts WHERE user_id = $1`;
    return await oneOrNone(query, [user_id]);
  },

  updateTotalPrice: async (user_id, cart_total_price) => {
    const query = `
      UPDATE carts
      SET cart_total_price = $2
      WHERE user_id = $1
      RETURNING *;
    `;
    return await oneOrNone(query, [user_id, cart_total_price]);
  },
};

export default cartModel;