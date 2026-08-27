export type NodeType = 
  | 'component' 
  | 'hook' 
  | 'api' 
  | 'util' 
  | 'state' 
  | 'style' 
  | 'config' 
  | 'test';

export interface NodeMetrics {
  loc: number;
  complexity: number; // 1-10
  maintainability: number; // 0-100
  importsCount: number;
  exportsCount: number;
  depth: number;
}

export interface GraphNode {
  id: string;
  name: string;
  path: string;
  type: NodeType;
  extension: string;
  sizeBytes: number;
  metrics: NodeMetrics;
  dependencies: string[]; // target IDs
  exports: string[];
  summary: string;
  codePreview: string;
  // 3D physics / layout properties
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  radius?: number;
  color?: string;
  glowColor?: string;
  highlighted?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'import' | 'dynamic-import' | 'type-only' | 'dependency';
  weight: number;
}

export interface RepositoryData {
  id: string;
  name: string;
  owner: string;
  branch: string;
  commit: string;
  stars: number;
  language: string;
  nodeCount: number;
  edgeCount: number;
  status: 'Complete' | 'Scanning' | 'Indexed';
  timestamp: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type LayoutMode = 'force-cloud' | 'sphere' | 'cluster-type' | 'hierarchical' | 'radial-orbital';

export interface FilterState {
  searchQuery: string;
  selectedTypes: Set<NodeType>;
  minComplexity: number;
  showEdges: boolean;
  pulseActive: boolean;
  glowIntensity: number;
  layoutMode: LayoutMode;
  autoRotate: boolean;
  rotationSpeed: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isThinking?: boolean;
  thinkingContent?: string;
}
