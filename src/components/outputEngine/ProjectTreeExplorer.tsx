import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Check, 
  Download, 
  Box, 
  Layers, 
  FileText, 
  Code2, 
  Database, 
  Terminal, 
  Shield 
} from 'lucide-react';
import { TreeNode, DetectedFile, DeveloperOutputEngine } from '../../services/developerOutputEngine';

export interface ProjectTreeExplorerProps {
  tree: TreeNode[];
  files: DetectedFile[];
  projectName?: string;
  onSelectFile?: (file: DetectedFile) => void;
  selectedFileId?: string;
}

export function ProjectTreeExplorer({
  tree,
  files,
  projectName = 'Generated Project',
  onSelectFile,
  selectedFileId
}: ProjectTreeExplorerProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ '': true });
  const [copiedAll, setCopiedAll] = useState(false);
  const engine = DeveloperOutputEngine.getInstance();

  const toggleFolder = (path: string) => {
    setOpenFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCopyProject = async () => {
    try {
      const payload = engine.formatProjectForCopy(files, projectName);
      await navigator.clipboard.writeText(payload);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy project:', err);
    }
  };

  const handleDownloadProject = () => {
    try {
      const payload = engine.formatProjectForCopy(files, projectName);
      const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_bundle.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download project:', err);
    }
  };

  const renderFileIcon = (file?: DetectedFile) => {
    if (!file) return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    const lang = file.language;
    if (lang === 'javascript' || lang === 'typescript') return <Code2 className="w-3.5 h-3.5 text-yellow-400" />;
    if (lang === 'python') return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
    if (lang === 'json' || lang === 'yaml') return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
    if (lang === 'sql') return <Database className="w-3.5 h-3.5 text-cyan-400" />;
    if (lang === 'shell') return <Terminal className="w-3.5 h-3.5 text-emerald-400" />;
    if (lang === 'env') return <Shield className="w-3.5 h-3.5 text-rose-400" />;
    return <FileCode className="w-3.5 h-3.5 text-slate-300" />;
  };

  const renderTree = (nodes: TreeNode[], depth: number = 0) => {
    return nodes.map((node) => {
      const isFolder = node.type === 'folder';
      const isOpen = openFolders[node.path] ?? true;
      const isSelected = node.file && node.file.id === selectedFileId;

      if (isFolder) {
        return (
          <div key={node.path} className="space-y-0.5">
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800/60 rounded transition-colors text-left font-mono"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isOpen ? (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-400" />
              )}
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400/90" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-500/80" />
              )}
              <span className="truncate">{node.name}</span>
            </button>
            {isOpen && node.children && (
              <div>{renderTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <button
          key={node.path}
          onClick={() => node.file && onSelectFile && onSelectFile(node.file)}
          className={`w-full flex items-center justify-between gap-1.5 px-2 py-1 text-xs font-mono rounded transition-all text-left ${
            isSelected
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-bold'
              : 'text-slate-300 hover:bg-slate-800/50'
          }`}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
        >
          <div className="flex items-center gap-1.5 truncate">
            {renderFileIcon(node.file)}
            <span className="truncate">{node.name}</span>
          </div>
          {node.file && (
            <span className="text-[9px] text-slate-500 font-sans uppercase font-medium">
              {node.file.language}
            </span>
          )}
        </button>
      );
    });
  };

  return (
    <div className="my-3 rounded-xl bg-[#080C16] border border-blue-900/40 shadow-2xl overflow-hidden font-sans">
      {/* Project Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              📦 {projectName}
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              {files.length} Generated Project Files
            </span>
          </div>
        </div>

        {/* Global Project Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyProject}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              copiedAll
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/50 shadow-sm'
            }`}
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Project Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Entire Project</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadProject}
            title="Download Project Bundle"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Project Tree View */}
      <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar border-b border-slate-800/80 bg-[#060912]">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
          <span>Project Structure</span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            Interactive Explorer
          </span>
        </div>
        {renderTree(tree)}
      </div>
    </div>
  );
}
