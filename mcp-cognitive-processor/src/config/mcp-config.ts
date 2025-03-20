/**
 * MCP Configuration
 * Defines core settings and capabilities for the Masterful Cognitive Processor
 */

import { MCPConfig } from '../models/types.js';

export const mcpConfig: MCPConfig = {
  defaultModel: {
    name: "flan-t5-large",  // Changed to a smaller default model
    description: "Hugging Face Flan-T5 Large model for text generation",
    tokenLimit: "moderate",
    complexity: "high",
    features: ["text_generation", "question_answering", "summarization"] // Added features
  },
  maxStepsPerStrategy: 10,
  tokenBudget: 10000,
  memoryPath: './data/memory',
  cachePath: './data/cache',
  optimizationThreshold: 0.8,
  name: "Masterful Cognitive Processor",
  version: "1.0.0",
  description: "An advanced cognitive processing system with strategic thinking capabilities",
  core: {
    thinkingModels: [
      {
        name: "strategic",
        description: "High-level strategic thinking with architectural focus",
        tokenLimit: "moderate",
        complexity: "high",
        features: ["architectural_planning", "component_design", "interface_definition"]
      },
      {
        name: "depth_first",
        description: "Deep analysis of critical components",
        tokenLimit: "high",
        complexity: "high",
        features: ["critical_path_analysis", "complexity_management", "performance_optimization"]
      },
      {
        name: "breadth_first",
        description: "Wide exploration of solution space",
        tokenLimit: "high",
        complexity: "medium",
        features: ["solution_exploration", "alternative_analysis", "trade_off_evaluation"]
      },
      {
        name: "minimal",
        description: "Lightweight processing for simple tasks",
        tokenLimit: "very_low",
        complexity: "low",
        features: ["quick_response", "basic_analysis"]
      }
    ],
    intelligence: {
      reasoningSystems: [
        {
          name: "tree_of_thought",
          description: "Multi-branch reasoning with pruning",
          implementation: "Explores multiple reasoning paths and prunes less promising branches"
        },
        {
          name: "chain_of_thought",
          description: "Linear step-by-step reasoning",
          implementation: "Breaks down complex problems into sequential steps"
        },
        {
          name: "parallel_thought",
          description: "Concurrent analysis of multiple aspects",
          implementation: "Analyzes different aspects of a problem simultaneously"
        }
      ],
      abstractionLevels: [
        {
          name: "system",
          focus: "Overall architecture and system design"
        },
        {
          name: "component",
          focus: "Individual component design and implementation"
        },
        {
          name: "interface",
          focus: "Component interaction and API design"
        }
      ]
    }
  },
  stepByStepThinking: {
    enabled: true,
    documentationLevel: "detailed",
    components: [
      {
        name: "problem_analyzer",
        description: "Analyzes problem complexity and requirements",
        capabilities: [
          {
            name: "complexity_assessment",
            description: "Evaluates problem difficulty and scope"
          },
          {
            name: "requirement_extraction",
            description: "Identifies key requirements and constraints"
          }
        ]
      },
      {
        name: "solution_designer",
        description: "Designs high-level solution architecture",
        capabilities: [
          {
            name: "architecture_planning",
            description: "Plans system architecture and components"
          },
          {
            name: "pattern_selection",
            description: "Selects appropriate design patterns"
          }
        ]
      },
      {
        name: "implementation_planner",
        description: "Plans implementation steps and timelines",
        capabilities: [
          {
            name: "task_breakdown",
            description: "Breaks down implementation into tasks"
          },
          {
            name: "dependency_analysis",
            description: "Analyzes task dependencies"
          }
        ],
        outputFormats: [
          {
            name: "task_list",
            description: "Ordered list of implementation tasks"
          },
          {
            name: "timeline",
            description: "Timeline with task dependencies"
          }
        ]
      }
    ]
  },
  memory: {
    systemType: "hierarchical",
    components: [
      {
        name: 'working_memory',
        description: 'Short-term active memory for current processing',
        capacity: 'limited',
        persistenceLevel: 'temporary'
      },
      {
        name: 'episodic_memory',
        description: 'Long-term memory for past experiences and solutions',
        capacity: 'large',
        persistenceLevel: 'permanent',
        indexing: {
          method: "semantic",
          features: ["timestamp", "problem_type", "solution_pattern"]
        }
      },
      {
        name: 'semantic_memory',
        description: 'Knowledge base of concepts and relationships',
        capacity: 'very_large',
        persistenceLevel: 'permanent',
        organization: {
          method: "graph",
          relationshipTypes: ["is_a", "has_a", "requires", "implements"]
        }
      }
    ]
  },
  preprocessingPipeline: {
    enabled: true,
    gemini: {
      model: 'gemini-pro',
      temperature: 0.7,
      topP: 0.8,
      maxTokens: 1000
    },
    claude: {
      model: 'claude-2.1',
      temperature: 0.5,
      maxTokens: 2048
    },
    pipelineSteps: [
      {
        name: 'Initial Preprocessing',
        description: 'Gemini Flash preprocesses and structures the query',
        service: 'googleflash',
        priority: 1
      },
      {
        name: 'Advanced Preprocessing',
        description: 'Gemini Pro further refines the problem structure',
        service: 'gemini',
        priority: 2
      },
      {
        name: 'Preliminary Reasoning',
        description: 'DeepSeek performs initial reasoning steps and problem analysis',
        service: 'deepseek',
        priority: 3
      },
      {
        name: 'Final Reasoning',
        description: 'Claude finalizes the reasoning process with high-quality insights',
        service: 'claude',
        priority: 4
      }
    ]
  }
};
