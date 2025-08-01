import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class SimpleMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'simple-test-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // 도구 목록 조회
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'hello_world',
            description: '간단한 인사말을 반환합니다',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
        ],
      };
    });

    // 도구 실행 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name } = request.params;

      if (name === 'hello_world') {
        return {
          content: [
            {
              type: 'text',
              text: '안녕하세요! MCP 서버가 정상적으로 작동하고 있습니다! 🎉',
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `알 수 없는 도구: ${name}`,
          },
        ],
      };
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Simple MCP Server started');
  }
}

// 서버 실행
const server = new SimpleMCPServer();
server.run().catch(console.error); 