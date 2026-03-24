import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMCPServer } from "./mcpServer.js";

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
