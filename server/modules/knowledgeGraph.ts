import { 
  KnowledgeGraphNode, 
  KnowledgeGraphEdge, 
  ModuleKnowledgeGraphData, 
  RegisteredModuleMetadata 
} from './types';

export class KnowledgeGraphBuilder {
  private static instance: KnowledgeGraphBuilder;
  private nodes: Map<string, KnowledgeGraphNode> = new Map();
  private edges: Set<string> = new Set();
  private edgeObjects: KnowledgeGraphEdge[] = [];

  private constructor() {}

  public static getInstance(): KnowledgeGraphBuilder {
    if (!KnowledgeGraphBuilder.instance) {
      KnowledgeGraphBuilder.instance = new KnowledgeGraphBuilder();
    }
    return KnowledgeGraphBuilder.instance;
  }

  public rebuildGraph(registeredModules: RegisteredModuleMetadata[]): ModuleKnowledgeGraphData {
    this.nodes.clear();
    this.edges.clear();
    this.edgeObjects = [];

    registeredModules.forEach(mod => {
      const manifest = mod.manifest;
      
      // Module Node
      const moduleNodeId = `module:${manifest.id}`;
      this.nodes.set(moduleNodeId, {
        id: moduleNodeId,
        name: manifest.name,
        type: 'module',
        metadata: {
          version: manifest.version,
          status: mod.status,
          health: mod.health.score
        }
      });

      // Services Nodes & Edges
      manifest.services.forEach(srv => {
        const srvNodeId = `service:${srv.serviceKey}`;
        this.nodes.set(srvNodeId, {
          id: srvNodeId,
          name: srv.name,
          type: 'service',
          metadata: { description: srv.description }
        });
        this.addEdge(moduleNodeId, srvNodeId, 'PROVIDES_SERVICE');
      });

      // Capabilities Nodes & Edges
      manifest.capabilities.forEach(cap => {
        const capNodeId = `capability:${cap.id}`;
        this.nodes.set(capNodeId, {
          id: capNodeId,
          name: cap.name,
          type: 'capability',
          metadata: { category: cap.category, description: cap.description }
        });
        this.addEdge(moduleNodeId, capNodeId, 'EXPOSES_CAPABILITY');
      });

      // Events Nodes & Edges
      manifest.events.forEach(evt => {
        const evtNodeId = `event:${evt.eventType}`;
        this.nodes.set(evtNodeId, {
          id: evtNodeId,
          name: evt.eventType,
          type: 'event',
          metadata: { description: evt.description }
        });
        this.addEdge(moduleNodeId, evtNodeId, 'EMITS_EVENT');
      });

      // Routes Nodes & Edges
      manifest.routes.forEach(route => {
        const routeNodeId = `route:${route.method}:${route.path}`;
        this.nodes.set(routeNodeId, {
          id: routeNodeId,
          name: `${route.method} ${route.path}`,
          type: 'route',
          metadata: { description: route.description, protected: route.protected }
        });
        this.addEdge(moduleNodeId, routeNodeId, 'OWNS_ROUTE');
      });

      // Module Dependencies Edges
      manifest.dependencies.forEach(dep => {
        const targetModuleNodeId = `module:${dep.moduleId}`;
        this.addEdge(moduleNodeId, targetModuleNodeId, 'DEPENDS_ON', { minVersion: dep.minVersion });
      });
    });

    return this.getGraph();
  }

  private addEdge(source: string, target: string, relation: KnowledgeGraphEdge['relation'], metadata?: Record<string, any>) {
    const key = `${source}->${relation}->${target}`;
    if (!this.edges.has(key)) {
      this.edges.add(key);
      this.edgeObjects.push({ source, target, relation, metadata });
    }
  }

  public getGraph(): ModuleKnowledgeGraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edgeObjects,
      lastUpdated: new Date().toISOString()
    };
  }

  public getModuleCount(): number {
    return Array.from(this.nodes.values()).filter(n => n.type === 'module').length;
  }

  public getModuleIds(): string[] {
    return Array.from(this.nodes.values())
      .filter(n => n.type === 'module')
      .map(n => n.id.replace(/^module:/, ''));
  }
}

export const knowledgeGraphBuilder = KnowledgeGraphBuilder.getInstance();
