import { toolRegistry } from '../services/toolRegistry';
import './fileSystemTool';
import './logExplorerTool';
import './systemMetricsTool';
import './httpClientTool';
import './healthInspectorTool';
import './projectSearchTool';
import './performanceAnalyzerTool';
import './knowledgeGraphQueryTool';
import './configurationInspectorTool';
import './permissionInspectorTool';

export function initializeGURUXDToolInfrastructure() {
  const report = toolRegistry.getToolProgressReport();
  return report;
}

export { toolRegistry };
