import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerProductTools } from "./tools/productTools.js";

export function createMCPServer() {
  const server = new McpServer(
    {
      name: "ecommerce-mcp-server",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  registerProductTools(server);

  return server;
}
