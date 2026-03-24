import { clearCart, getCart } from "./cartService.js";

const orders = [];

function generateOrderId() {
  return `ord_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export async function purchaseProduct(userId) {
  const cart = await getCart();

  if (!cart.items.length) {
    throw new Error("Cannot create order from an empty cart.");
  }

  const order = {
    orderId: generateOrderId(),
    userId,
    items: cart.items,
    totalItems: cart.totalItems,
    totalAmount: cart.subtotal,
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  await clearCart();

  return order;
}

export async function getOrdersByUserId(userId) {
  return orders.filter((order) => order.userId === userId);
}
