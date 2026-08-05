import fs from 'fs';
import path from 'path';
import { toolRegistry, ToolExecutionContext } from '../services/toolRegistry';

export interface ProjectSearchParams {
  query: string;
  directory?: string; // relative to workspace, e.g., 'server' or 'src'
  fileExtension?: string; // e.g. '.ts', '.tsx', '.json'
  maxResults?: number;
}

export interface MatchSnippet {
  filePath: string;
  lineNumber: number;
  lineContent: string;
}

export interface ProjectSearchResult {
  query: string;
  directorySearched: string;
  totalMatches: number;
  matches: MatchSnippet[];
}

const ROOT_WORKSPACE = process.cwd();

function searchInDir(
  dirPath: string,
  query: string,
  fileExt: string | undefined,
  maxResults: number,
  matches: MatchSnippet[]
) {
  if (matches.length >= maxResults) return;
  if (!fs.existsSync(dirPath)) return;

  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    if (matches.length >= maxResults) break;

    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist') continue;
      searchInDir(fullPath, query, fileExt, maxResults, matches);
    } else if (item.isFile()) {
      if (fileExt && !item.name.endsWith(fileExt)) continue;

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        const lowerQuery = query.toLowerCase();

        lines.forEach((line, idx) => {
          if (matches.length >= maxResults) return;
          if (line.toLowerCase().includes(lowerQuery)) {
            matches.push({
              filePath: path.relative(ROOT_WORKSPACE, fullPath),
              lineNumber: idx + 1,
              lineContent: line.trim()
            });
          }
        });
      } catch (e) {
        // Skip unreadable files
      }
    }
  }
}

export async function executeProjectSearchTool(
  params: ProjectSearchParams,
  context?: ToolExecutionContext
): Promise<ProjectSearchResult> {
  const { query, directory = 'server', fileExtension, maxResults = 50 } = params;

  if (!query) {
    throw new Error('ProjectSearchTool requires a non-empty search query.');
  }

  const targetDir = path.resolve(ROOT_WORKSPACE, directory);
  if (!targetDir.startsWith(ROOT_WORKSPACE)) {
    throw new Error('Security Violation: Search directory escapes workspace.');
  }

  const matches: MatchSnippet[] = [];
  searchInDir(targetDir, query, fileExtension, maxResults, matches);

  return {
    query,
    directorySearched: path.relative(ROOT_WORKSPACE, targetDir),
    totalMatches: matches.length,
    matches
  };
}

// Register Tool 6: Project Search Tool
toolRegistry.registerTool({
  toolId: 'tool-project-search',
  toolName: 'Project Search Tool',
  version: '1.0.0',
  description: 'Codebase keyword and pattern search tool across GURU-XD project workspace.',
  permissions: ['CODE_SEARCH'],
  capabilities: ['CodeSearch', 'PatternMatch', 'FileDiscovery'],
  dependencies: [],
  owner: 'GURU-XD AI Core',
  executor: executeProjectSearchTool
});
