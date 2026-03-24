import {
  searchProducts,
  getProductById,
  filterProducts
} from "../services/productService.js";
import { addToCart, getCart } from "../services/cartService.js";
import { getOrdersByUserId, purchaseProduct } from "../services/orderService.js";
import {
  addToCartSchema,
  filterProductsSchema,
  getOrdersSchema,
  getProductSchema,
  purchaseProductSchema,
  searchProductsSchema
} from "./schemas.js";

const toToolTextResponse = (payload) => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(payload, null, 2)
    }
  ]
});

export function registerProductTools(server) {
  // Tool 1: Search products by query against name and category.
  server.registerTool(
    "search_products",
    {
      description: "Search products by name or category.",
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false
      },
      inputSchema: searchProductsSchema
    },
    async ({ query }) => {
      const results = await searchProducts(query);
      return toToolTextResponse({ count: results.length, products: results });
    }
  );

  // Tool 2: Get full details for one product by its numeric ID.
  server.registerTool(
    "get_product",
    {
      description: "Get complete details for one product.",
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false
      },
      inputSchema: getProductSchema
    },
    async ({ productId }) => {
      const product = await getProductById(productId);

      if (!product) {
        return {
          content: [{ type: "text", text: `Product ${productId} not found.` }],
          isError: true
        };
      }

      return toToolTextResponse(product);
    }
  );

  // Tool 3: Filter products by optional price/category/rating criteria.
  server.registerTool(
    "filter_products",
    {
      description: "Filter products by optional price, category, and rating.",
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false
      },
      inputSchema: filterProductsSchema
    },
    async (filters) => {
      const results = await filterProducts(filters);
      return toToolTextResponse({ count: results.length, products: results });
    }
  );

  // Tool 4: Add selected product quantity to the in-memory cart.
  server.registerTool(
    "add_to_cart",
    {
      description: "Add a product and quantity to the cart.",
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false
      },
      inputSchema: addToCartSchema
    },
    async ({ productId, quantity }) => {
      const cart = await addToCart(productId, quantity);
      return toToolTextResponse({ message: "Item added to cart.", cart });
    }
  );

  // Tool 5: Return current cart items and computed totals.
  server.registerTool(
    "view_cart",
    {
      description: "View current cart with totals.",
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false
      },
      inputSchema: {}
    },
    async () => {
      const cart = await getCart();
      return toToolTextResponse(cart);
    }
  );

  // Tool 6: Checkout the in-memory cart and create an order summary.
  server.registerTool(
    "purchase_product",
    {
      description: "Create an order from the current cart for a user.",
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false
      },
      inputSchema: purchaseProductSchema
    },
    async ({ userId }) => {
      const order = await purchaseProduct(userId);
      return toToolTextResponse({ message: "Purchase completed.", order });
    }
  );

  // Tool 7: Retrieve previously created orders by user ID.
  server.registerTool(
    "get_orders",
    {
      description: "Get order history for a user.",
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false
      },
      inputSchema: getOrdersSchema
    },
    async ({ userId }) => {
      const userOrders = await getOrdersByUserId(userId);
      return toToolTextResponse({ count: userOrders.length, orders: userOrders });
    }
  );
}
