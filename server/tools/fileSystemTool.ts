import fs from 'fs';
import path from 'path';
import { toolRegistry, ToolExecutionContext } from '../services/toolRegistry';
import { loggingService } from '../services/loggingService';
import { unifiedTelemetryEngine } from '../services/unifiedTelemetryEngine';

export interface FileSystemParams {
  action: 'read' | 'write' | 'list' | 'exists' | 'stat';
  filePath: string;
  content?: string;
  encoding?: BufferEncoding;
}

export interface FileSystemResult {
  action: string;
  filePath: string;
  exists: boolean;
  content?: string;
  stat?: {
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    mtime: string;
  };
  files?: string[];
}

const ROOT_WORKSPACE = process.cwd();

function resolveAndValidatePath(targetPath: string): string {
  const normalized = path.normalize(targetPath);
  const resolved = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(ROOT_WORKSPACE, normalized);

  if (!resolved.startsWith(ROOT_WORKSPACE)) {
    throw new Error(`Security Violation: Path [${targetPath}] escapes workspace root.`);
  }

  return resolved;
}

export async function executeFileSystemTool(
  params: FileSystemParams,
  context?: ToolExecutionContext
): Promise<FileSystemResult> {
  const { action, filePath, content, encoding = 'utf-8' } = params;

  if (!filePath) {
    throw new Error('FileSystemTool requires a valid filePath.');
  }

  const absolutePath = resolveAndValidatePath(filePath);
  const relativePath = path.relative(ROOT_WORKSPACE, absolutePath);

  switch (action) {
    case 'exists': {
      const exists = fs.existsSync(absolutePath);
      return { action, filePath: relativePath, exists };
    }

    case 'stat': {
      if (!fs.existsSync(absolutePath)) {
        return { action, filePath: relativePath, exists: false };
      }
      const stats = fs.statSync(absolutePath);
      return {
        action,
        filePath: relativePath,
        exists: true,
        stat: {
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          mtime: stats.mtime.toISOString()
        }
      };
    }

    case 'read': {
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${relativePath}`);
      }
      const fileStat = fs.statSync(absolutePath);
      if (fileStat.isDirectory()) {
        throw new Error(`Path [${relativePath}] is a directory, not a file.`);
      }
      const data = fs.readFileSync(absolutePath, { encoding });
      return {
        action,
        filePath: relativePath,
        exists: true,
        content: data.toString(),
        stat: {
          size: fileStat.size,
          isFile: true,
          isDirectory: false,
          mtime: fileStat.mtime.toISOString()
        }
      };
    }

    case 'write': {
      if (content === undefined || content === null) {
        throw new Error('Write action requires content field.');
      }
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(absolutePath, content, { encoding });
      const newStat = fs.statSync(absolutePath);

      loggingService.log('info', 'SYSTEM', `FileSystemTool written file [${relativePath}] (${newStat.size} bytes)`, {
        filePath: relativePath,
        size: newStat.size
      }, { serviceSource: 'FileSystemTool', correlationId: context?.correlationId });

      return {
        action,
        filePath: relativePath,
        exists: true,
        stat: {
          size: newStat.size,
          isFile: true,
          isDirectory: false,
          mtime: newStat.mtime.toISOString()
        }
      };
    }

    case 'list': {
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Directory not found: ${relativePath}`);
      }
      const dirStat = fs.statSync(absolutePath);
      if (!dirStat.isDirectory()) {
        throw new Error(`Path [${relativePath}] is not a directory.`);
      }
      const files = fs.readdirSync(absolutePath);
      return {
        action,
        filePath: relativePath,
        exists: true,
        files
      };
    }

    default:
      throw new Error(`Unsupported FileSystemTool action: [${action}]`);
  }
}

// Register Tool 1: File System Tool
toolRegistry.registerTool({
  toolId: 'tool-file-system',
  toolName: 'File System Tool',
  version: '1.0.0',
  description: 'Secure workspace filesystem read/write/inspect tool for GURU-XD AI Core.',
  permissions: ['FS_READ', 'FS_WRITE'],
  capabilities: ['FileRead', 'FileWrite', 'DirectoryList', 'StatCheck'],
  dependencies: [],
  owner: 'GURU-XD AI Core',
  executor: executeFileSystemTool
});
