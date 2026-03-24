import { getProductById } from "./productService.js";

const cart = {
  items: []
};

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    totalItems,
    subtotal: Number(subtotal.toFixed(2))
  };
}

export async function addToCart(productId, quantity) {
  const product = await getProductById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }

  const existingItem = cart.items.find((item) => item.productId === productId);

  if (existingItem) {
    const requestedQty = existingItem.quantity + quantity;

    if (requestedQty > product.stock) {
      throw new Error("Insufficient stock for requested quantity.");
    }

    existingItem.quantity = requestedQty;
    existingItem.lineTotal = Number((existingItem.quantity * existingItem.price).toFixed(2));
  } else {
    if (quantity > product.stock) {
      throw new Error("Insufficient stock for requested quantity.");
    }

    cart.items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      lineTotal: Number((product.price * quantity).toFixed(2))
    });
  }

  return getCart();
}

export async function getCart() {
  const totals = calculateTotals(cart.items);

  return {
    items: cart.items,
    ...totals
  };
}

export async function clearCart() {
  cart.items = [];
}
