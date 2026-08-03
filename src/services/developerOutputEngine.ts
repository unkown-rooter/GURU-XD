/**
 * GURU-XD Developer Output Engine
 * Universal Provider-Agnostic Output Renderer & Code Intelligence Service
 */

export interface DetectedFile {
  id: string;
  filename: string;
  path: string;
  language: string;
  content: string;
  sizeBytes: number;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  file?: DetectedFile;
}

export interface OutputAnalysisResult {
  hasCode: boolean;
  isMultiFileProject: boolean;
  projectName?: string;
  detectedFiles: DetectedFile[];
  projectTree: TreeNode[];
  primaryLanguage?: string;
  contentType: 'CODE_PROJECT' | 'SINGLE_FILE' | 'MARKDOWN_DOC' | 'JSON_DATA' | 'LOG_STREAM' | 'SYSTEM_CARD';
}

/**
 * Language normalization plugin
 */
export function detectLanguage(langInput: string, codeSample: string = ''): string {
  const l = (langInput || '').toLowerCase().trim();
  
  if (['js', 'javascript', 'jsx', 'node', 'nodejs'].includes(l)) return 'javascript';
  if (['ts', 'typescript', 'tsx'].includes(l)) return 'typescript';
  if (['py', 'python', 'python3'].includes(l)) return 'python';
  if (['html', 'htm'].includes(l)) return 'html';
  if (['css', 'scss', 'sass', 'less'].includes(l)) return 'css';
  if (['json', 'json5'].includes(l)) return 'json';
  if (['yaml', 'yml'].includes(l)) return 'yaml';
  if (['xml', 'svg'].includes(l)) return 'xml';
  if (['sql', 'postgres', 'postgresql', 'mysql', 'sqlite'].includes(l)) return 'sql';
  if (['sh', 'bash', 'zsh', 'shell', 'cmd', 'powershell'].includes(l)) return 'shell';
  if (['dockerfile', 'docker'].includes(l)) return 'dockerfile';
  if (['md', 'markdown'].includes(l)) return 'markdown';
  if (['java'].includes(l)) return 'java';
  if (['c'].includes(l)) return 'c';
  if (['cpp', 'c++'].includes(l)) return 'cpp';
  if (['csharp', 'c#', 'cs'].includes(l)) return 'csharp';
  if (['php'].includes(l)) return 'php';
  if (['go', 'golang'].includes(l)) return 'go';
  if (['rust', 'rs'].includes(l)) return 'rust';
  if (['env', 'dotenv'].includes(l)) return 'env';

  // Heuristic detection based on code sample if missing
  if (codeSample.includes('import ') && (codeSample.includes(': string') || codeSample.includes('interface '))) return 'typescript';
  if (codeSample.includes('def ') && codeSample.includes(':')) return 'python';
  if (codeSample.includes('class ') && codeSample.includes('public static void main')) return 'java';
  if (codeSample.includes('package main') && codeSample.includes('func main')) return 'go';
  if (codeSample.includes('fn main()')) return 'rust';
  if (codeSample.trim().startsWith('{') || codeSample.trim().startsWith('[')) {
    try { JSON.parse(codeSample); return 'json'; } catch (e) {}
  }

  return l || 'text';
}

/**
 * Developer Output Engine Main Class
 */
export class DeveloperOutputEngine {
  private static instance: DeveloperOutputEngine;

  public static getInstance(): DeveloperOutputEngine {
    if (!DeveloperOutputEngine.instance) {
      DeveloperOutputEngine.instance = new DeveloperOutputEngine();
    }
    return DeveloperOutputEngine.instance;
  }

  /**
   * Parses raw AI response text and extracts code, files, and project structures.
   */
  public analyzeResponse(rawText: string): OutputAnalysisResult {
    const detectedFiles: DetectedFile[] = [];
    const codeBlockRegex = /```(?:(\w+)(?::([^\n]+))?)?\n([\s\S]*?)```/g;

    let match;
    let fileCounter = 1;

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
      const rawLang = match[1] || 'text';
      const headerFilename = match[2]?.trim();
      const codeContent = match[3] || '';

      // Check if preceding line or top line inside block contains filename hint like // file: server.js or ### server.js
      let filename = headerFilename || '';

      if (!filename) {
        const topLines = codeContent.split('\n').slice(0, 3);
        for (const line of topLines) {
          const fileHintMatch = line.match(/(?:\/\/|#|\/\*|<!--)\s*(?:file|filename|path)?:\s*([\w.\-\/]+)/i);
          if (fileHintMatch && fileHintMatch[1]) {
            filename = fileHintMatch[1];
            break;
          }
        }
      }

      if (!filename) {
        if (rawLang === 'json' && codeContent.includes('"name"') && codeContent.includes('"dependencies"')) {
          filename = 'package.json';
        } else if (rawLang === 'dockerfile' || codeContent.includes('FROM node:')) {
          filename = 'Dockerfile';
        } else if (rawLang === 'env' || codeContent.includes('PORT=') || codeContent.includes('DATABASE_URL=')) {
          filename = '.env';
        } else {
          const langExt = this.getFileExtensionForLang(rawLang);
          filename = `file_${fileCounter}.${langExt}`;
        }
      }

      const normalizedLang = detectLanguage(rawLang, codeContent);
      const cleanPath = filename.startsWith('/') ? filename.slice(1) : filename;

      detectedFiles.push({
        id: `file_${fileCounter}_${Date.now()}`,
        filename: cleanPath.split('/').pop() || cleanPath,
        path: cleanPath,
        language: normalizedLang,
        content: codeContent,
        sizeBytes: new Blob([codeContent]).size
      });

      fileCounter++;
    }

    const isMultiFileProject = detectedFiles.length >= 2;
    const projectTree = this.buildProjectTree(detectedFiles);

    let contentType: OutputAnalysisResult['contentType'] = 'MARKDOWN_DOC';
    if (isMultiFileProject) {
      contentType = 'CODE_PROJECT';
    } else if (detectedFiles.length === 1) {
      contentType = 'SINGLE_FILE';
    } else if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
      contentType = 'JSON_DATA';
    } else if (rawText.includes('[ERROR]') || rawText.includes('[INFO]') || rawText.includes('[WARN]')) {
      contentType = 'LOG_STREAM';
    }

    return {
      hasCode: detectedFiles.length > 0,
      isMultiFileProject,
      projectName: isMultiFileProject ? (this.extractProjectName(rawText) || 'Generated Project') : undefined,
      detectedFiles,
      projectTree,
      primaryLanguage: detectedFiles[0]?.language,
      contentType
    };
  }

  /**
   * Constructs folder/file tree nodes from flat file paths.
   */
  public buildProjectTree(files: DetectedFile[]): TreeNode[] {
    const rootNodes: TreeNode[] = [];

    files.forEach(file => {
      const parts = file.path.split('/');
      let currentLevel = rootNodes;

      parts.forEach((part, idx) => {
        const isFile = idx === parts.length - 1;
        const currentPath = parts.slice(0, idx + 1).join('/');

        let existing = currentLevel.find(n => n.name === part);

        if (!existing) {
          const newNode: TreeNode = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            file: isFile ? file : undefined,
            children: isFile ? undefined : []
          };
          currentLevel.push(newNode);
          existing = newNode;
        }

        if (!isFile && existing.children) {
          currentLevel = existing.children;
        }
      });
    });

    return rootNodes;
  }

  /**
   * Formats all project files into a single structured copy payload preserving filenames.
   */
  public formatProjectForCopy(files: DetectedFile[], projectName: string = 'GURU-XD Project'): string {
    let output = `/* ====================================================\n`;
    output += `   📦 ${projectName}\n`;
    output += `   Exported via GURU-XD Developer Output Engine\n`;
    output += `   Total Files: ${files.length}\n`;
    output += `   ==================================================== */\n\n`;

    files.forEach(file => {
      output += `// ==================== FILE: ${file.path} ====================\n`;
      output += file.content.trim();
      output += `\n\n`;
    });

    return output;
  }

  private getFileExtensionForLang(lang: string): string {
    const l = lang.toLowerCase();
    if (l === 'javascript' || l === 'js') return 'js';
    if (l === 'typescript' || l === 'ts') return 'ts';
    if (l === 'python' || l === 'py') return 'py';
    if (l === 'html') return 'html';
    if (l === 'css') return 'css';
    if (l === 'json') return 'json';
    if (l === 'yaml' || l === 'yml') return 'yml';
    if (l === 'sql') return 'sql';
    if (l === 'shell' || l === 'bash') return 'sh';
    if (l === 'go') return 'go';
    if (l === 'rust') return 'rs';
    if (l === 'php') return 'php';
    if (l === 'java') return 'java';
    return 'txt';
  }

  private extractProjectName(rawText: string): string | undefined {
    const headingMatch = rawText.match(/#+\s*(?:Project|Module|App|Package|Service)?:\s*([^\n]+)/i);
    if (headingMatch) return headingMatch[1].trim();
    return undefined;
  }
}
