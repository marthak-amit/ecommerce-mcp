import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMCPServer } from "./mcpServer.js";
import { products as catalogProducts, categories } from "./data/products.js";
import { searchProducts, getProductById, filterProducts } from "./services/productService.js";
import { addToCart, getCart } from "./services/cartService.js";
import { purchaseProduct, getOrdersByUserId } from "./services/orderService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

const transports = new Map();

app.all("/mcp", async (req, res) => {
  if (req.method === "POST") {
    const sessionId = req.headers["mcp-session-id"];

    try {
      let transport;

      if (sessionId && transports.has(sessionId)) {
        transport = transports.get(sessionId);
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (createdSessionId) => {
            transports.set(createdSessionId, transport);
          }
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            transports.delete(transport.sessionId);
          }
        };

        const mcpServer = createMCPServer();
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else if (sessionId && !transports.has(sessionId)) {
        res.status(200).json({
          name: "ecommerce-mcp",
          status: "running",
          timestamp: new Date().toISOString()
        });
        return;
      } else {
        res.status(200).json({
          name: "ecommerce-mcp",
          status: "running",
          timestamp: new Date().toISOString()
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
      return;
    } catch (error) {
      console.error("Error handling /mcp request:", error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error"
          },
          id: null
        });
      }
      return;
    }
  }

  res.status(200).json({
    name: "ecommerce-mcp",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

app.get("/.well-known/openai-domain-verification", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(process.env.OPENAI_DOMAIN_VERIFICATION_TOKEN);
});

app.get("/.well-known/openai-apps-challenge", (req, res) => {
  const token = (process.env.OPENAI_APPS_CHALLENGE_TOKEN || "").replace(
    /^openai-apps-challenge=/,
    ""
  );
  res.status(200).type("text/plain");
  res.send(token);
});

app.get("/openapi.json", (req, res) => {
  res.sendFile(path.join(process.cwd(), "openapi.json"));
});

app.post("/api/search-products", async (req, res) => {
  try {
    const { query } = req.body ?? {};

    if (typeof query !== "string" || !query.trim()) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    const products = await searchProducts(query);
    res.status(200).json({ products, count: products.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to search products" });
  }
});

app.get("/api/products", async (req, res) => {
  res.status(200).json({
    products: catalogProducts,
    count: catalogProducts.length
  });
});

app.get("/api/products/:productId", async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ error: "productId must be a positive integer" });
      return;
    }

    const product = await getProductById(productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to get product" });
  }
});

app.get("/api/categories", async (req, res) => {
  res.status(200).json({ categories });
});

app.post("/api/filter-products", async (req, res) => {
  try {
    const { minPrice, maxPrice, category, minRating } = req.body ?? {};
    const filtered = await filterProducts({ minPrice, maxPrice, category, minRating });
    res.status(200).json({ products: filtered, count: filtered.length });
  } catch (error) {
    res.status(400).json({ error: "Failed to filter products" });
  }
});

app.post("/api/cart/add", async (req, res) => {
  try {
    const { productId, quantity } = req.body ?? {};
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({ error: "productId and quantity must be positive integers" });
      return;
    }
    const cart = await addToCart(productId, quantity);
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to add to cart" });
  }
});

app.get("/api/cart", async (req, res) => {
  const cart = await getCart();
  res.status(200).json(cart);
});

app.post("/api/create-order", async (req, res) => {
  try {
    const { productId, quantity } = req.body ?? {};

    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({ error: "productId and quantity must be positive integers" });
      return;
    }

    await addToCart(productId, quantity);
    const order = await purchaseProduct("chatgpt-action-user");

    res.status(200).json({
      message: "Order confirmation",
      order
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create order" });
  }
});

app.post("/api/checkout", async (req, res) => {
  try {
    const { userId } = req.body ?? {};
    if (typeof userId !== "string" || !userId.trim()) {
      res.status(400).json({ error: "userId is required" });
      return;
    }
    const order = await purchaseProduct(userId);
    res.status(200).json({ message: "Checkout successful", order });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to checkout" });
  }
});

app.get("/api/orders/:userId", async (req, res) => {
  const { userId } = req.params;
  const orders = await getOrdersByUserId(userId);
  res.status(200).json({ orders, count: orders.length });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
