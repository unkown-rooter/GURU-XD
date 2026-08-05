import { toolRegistry, ToolExecutionContext } from '../services/toolRegistry';
import { loggingService, ComponentRelationship } from '../services/loggingService';
import { serviceRegistry } from '../serviceRegistry';

export interface KnowledgeGraphQueryParams {
  filterType?: 'ROUTER' | 'CONTROLLER' | 'SERVICE' | 'PROVIDER' | 'CACHE' | 'DATABASE' | 'MODULE';
  nodeName?: string;
}

export interface GraphNode {
  id: string;
  type: string;
  name: string;
  connectionsCount: number;
}

export interface KnowledgeGraphQueryResult {
  timestamp: string;
  totalEdgesCount: number;
  totalNodesCount: number;
  nodes: GraphNode[];
  edges: ComponentRelationship[];
}

export async function executeKnowledgeGraphQueryTool(
  params: KnowledgeGraphQueryParams,
  context?: ToolExecutionContext
): Promise<KnowledgeGraphQueryResult> {
  const { filterType, nodeName } = params;
  const timestamp = new Date().toISOString();

  let edges = loggingService.getComponentRelationships();

  if (filterType) {
    edges = edges.filter(e => e.sourceType === filterType || e.targetType === filterType);
  }

  if (nodeName) {
    const lower = nodeName.toLowerCase();
    edges = edges.filter(e => e.sourceName.toLowerCase().includes(lower) || e.targetName.toLowerCase().includes(lower));
  }

  // Extract unique nodes
  const nodeMap = new Map<string, { type: string; name: string; count: number }>();

  edges.forEach(e => {
    const srcKey = `${e.sourceType}:${e.sourceName}`;
    const tgtKey = `${e.targetType}:${e.targetName}`;

    const src = nodeMap.get(srcKey) || { type: e.sourceType, name: e.sourceName, count: 0 };
    src.count += 1;
    nodeMap.set(srcKey, src);

    const tgt = nodeMap.get(tgtKey) || { type: e.targetType, name: e.targetName, count: 0 };
    tgt.count += 1;
    nodeMap.set(tgtKey, tgt);
  });

  const nodes: GraphNode[] = Array.from(nodeMap.entries()).map(([id, val]) => ({
    id,
    type: val.type,
    name: val.name,
    connectionsCount: val.count
  }));

  return {
    timestamp,
    totalEdgesCount: edges.length,
    totalNodesCount: nodes.length,
    nodes,
    edges
  };
}

// Register Tool 8: Knowledge Graph Query Tool
toolRegistry.registerTool({
  toolId: 'tool-knowledge-graph-query',
  toolName: 'Knowledge Graph Query Tool',
  version: '1.0.0',
  description: 'Graph relationship, node topology, and architecture dependency explorer for GURU-XD.',
  permissions: ['GRAPH_READ'],
  capabilities: ['GraphTopology', 'DependencyAnalysis', 'ComponentTracing'],
  dependencies: ['loggingService', 'serviceRegistry'],
  owner: 'GURU-XD AI Core',
  executor: executeKnowledgeGraphQueryTool
});
