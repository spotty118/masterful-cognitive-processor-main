# MCP Cognitive Processor

A Model Context Protocol (MCP) server that provides advanced cognitive processing capabilities, including thinking models, memory management, caching, and token optimization.

## Features

- **Thinking Models**: Multiple thinking strategies for different types of problems
- **Memory System**: Store and retrieve information with semantic search
- **Caching**: Optimize performance by caching results
- **Token Optimization**: Reduce token usage while maintaining quality
- **Clean Architecture**: Well-organized code with dependency injection
- **MCP Integration**: Seamless integration with Cline and other MCP clients

## Architecture

The MCP Cognitive Processor follows clean architecture principles with a focus on:

- **Separation of Concerns**: Each component has a single responsibility
- **Dependency Injection**: Components depend on abstractions, not implementations
- **Interface-Based Design**: Clear contracts between components
- **Adapter Pattern**: Adapters for external services and implementations

### Key Components

- **Interfaces**: Define contracts for services
- **Models**: Data structures and types
- **Services**: Core business logic implementations
- **Adapters**: Bridge between interfaces and implementations
- **Factories**: Create and manage service instances
- **Utils**: Utility functions and helpers

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-cognitive-processor.git
cd mcp-cognitive-processor

# Install dependencies
npm install
```

### Configuration

Create a `mcp-settings.json` file in the root directory (see `mcp-settings-example.json` for reference):

```json
{
  "core": {
    "thinkingModels": {
      "minimal": {
        "description": "Minimal thinking model for simple problems",
        "tokenMultiplier": 0.5
      },
      "standard": {
        "description": "Standard thinking model for general problems",
        "tokenMultiplier": 1.0
      },
      "expanded_step_by_step": {
        "description": "Expanded step-by-step thinking for complex problems",
        "tokenMultiplier": 2.5
      }
    },
    "intelligence": {
      "reasoningSystems": {
        "deductive": {
          "description": "Deductive reasoning from general principles to specific conclusions"
        },
        "inductive": {
          "description": "Inductive reasoning from specific observations to general principles"
        },
        "abductive": {
          "description": "Abductive reasoning to the most likely explanation"
        }
      }
    }
  }
}
```

### Running the Server

```bash
# Build and start the server
npm start

# For development with auto-reload
npm run dev
```

## Usage with Cline

Add the MCP Cognitive Processor to your Cline configuration:

```json
{
  "mcpServers": {
    "cognitive-processor": {
      "command": "node",
      "args": ["/path/to/mcp-cognitive-processor/build/main.js"],
      "env": {
        "MCP_DB_DIR": "/path/to/data/directory"
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

## Available Tools

The MCP Cognitive Processor provides the following tools:

- `generate_with_mcp`: Generate content using the Masterful Cognitive Processor
- `thinking_process`: Execute a step-by-step thinking process
- `store_memory`: Store a new memory item
- `retrieve_memory`: Retrieve memory items based on a query
- `check_cache`: Check if a result is cached
- `store_cache`: Store a result in the cache
- `perform_maintenance`: Perform maintenance on the MCP systems
- `get_token_optimization_stats`: Get statistics about token optimization
- `update_token_metrics`: Update token metrics with actual token usage
- `estimate_token_count`: Estimate token count for a given text

## Available Resources

The MCP Cognitive Processor provides the following resources:

- `mcp://config/thinking-models`: Available thinking models and their configurations
- `mcp://config/reasoning-systems`: Available reasoning systems and their implementations
- `mcp://memory/stats`: Statistics about the memory system
- `mcp://cache/stats`: Statistics about the cache system

And the following resource templates:

- `mcp://memory/{type}`: Retrieve memory items of a specific type
- `mcp://memory/item/{id}`: Retrieve a specific memory item by its ID
- `mcp://cache/stats/{type}`: Statistics about a specific cache type

## Development

### Project Structure

```
mcp-cognitive-processor/
├── src/
│   ├── adapters/       # Adapters for external services
│   ├── config/         # Configuration management
│   ├── factories/      # Service factories
│   ├── interfaces/     # Service interfaces
│   ├── models/         # Data models and types
│   ├── services/       # Service implementations
│   ├── strategies/     # Thinking strategies
│   ├── utils/          # Utility functions
│   └── main.ts         # Main entry point
├── data/               # Data storage
├── build/              # Compiled JavaScript
├── package.json        # Project configuration
└── tsconfig.json       # TypeScript configuration
```

### Adding a New Thinking Strategy

1. Create a new strategy class in `src/strategies/` that implements `IThinkingModelStrategy`
2. Add the strategy to the `ThinkingModelStrategyFactory`
3. Update the configuration in `mcp-settings.json`

### Adding a New Tool

1. Add the tool definition to the `setupToolHandlers` method in `src/main.ts`
2. Implement the tool handler in the `CallToolRequestSchema` handler

## License

MIT