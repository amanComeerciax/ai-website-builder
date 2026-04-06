const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
require('dotenv').config();

/**
 * MCP Manager: Connects and Manages external MCP servers (Pexels, etc.)
 */
class MCPManager {
  constructor() {
    this.client = null;
    this.transport = null;
    this.tools = [];
  }

  /**
   * Initializes the Pexels MCP Client
   */
  async init() {
    console.log('[MCPManager] 🔌 Connecting to Pexels MCP Server...');
    
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      console.warn('[MCPManager] ⚠️ PEXELS_API_KEY not found in .env. MCP Image Search will be disabled.');
      return;
    }

    try {
      this.transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "pexels-mcp-server"],
        env: {
          ...process.env,
          PEXELS_API_KEY: apiKey
        }
      });

      this.client = new Client({
        name: "ai-website-builder-client",
        version: "1.0.0"
      }, {
        capabilities: {}
      });

      await this.client.connect(this.transport);
      
      // List available tools
      const result = await this.client.listTools();
      this.tools = result.tools || [];
      
      console.log(`[MCPManager] ✅ Connected! Available tools: ${this.tools.map(t => t.name).join(', ')}`);
    } catch (error) {
      console.error('[MCPManager] ❌ Connection failed:', error.message);
      this.client = null;
    }
  }

  /**
   * Returns tools in a format compatible with OpenAI/Claude Function Calling
   */
  getToolDefinitions() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }));
  }

  /**
   * Execute an MCP tool and simplify the result for the AI
   */
  async executeTool(name, args) {
    if (!this.client) throw new Error("MCP Client not initialized");
    console.log(`[MCPManager] 🛠 Executing tool: ${name}`, args);
    const result = await this.client.callTool({
      name,
      arguments: args
    });

    // Simplify Pexels search results to just a list of high-quality URLs
    if (name === "search_photos" && result.content && Array.isArray(result.content)) {
      try {
        // Pexels MCP server usually returns JSON in the content[0].text
        const data = JSON.parse(result.content[0].text);
        if (data.photos) {
          return data.photos.map(p => p.src.large2x || p.src.large || p.src.original);
        }
      } catch (e) {
        console.warn("[MCPManager] Could not parse tool result as JSON, returning raw.");
      }
    }
    
    return result;
  }
}

const mcpManager = new MCPManager();
module.exports = mcpManager;
