export interface Thought {
  id: string;
  content: string;
  timestamp: number;
  connections: string[];
  confidence: number;
}

export interface Connection {
  sourceId: string;
  targetId: string;
  strength: number;
  type: ConnectionType;
}

export enum ConnectionType {
  CAUSAL = 'causal',
  TEMPORAL = 'temporal',
  SEMANTIC = 'semantic',
  ANALOGICAL = 'analogical'
}

export interface ThinkingContext {
  activeThoughts: Thought[];
  shortTermMemory: Thought[];
  attentionFocus: string[];
}
