import React, { useState } from 'react';
import { 
  FolderClosed, 
  FileCode, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  X,
  FileCheck,
  Search,
  HardDrive
} from 'lucide-react';
import { BotFile } from '../types';

interface FilesViewProps {
  files: BotFile[];
  onCreateFile: (file: BotFile) => void;
  onUpdateFile: (path: string, content: string) => void;
  onDeleteFile: (path: string) => void;
}

export default function FilesView({ 
  files, 
  onCreateFile, 
  onUpdateFile, 
  onDeleteFile 
}: FilesViewProps) {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedFile, setSelectedFile] = useState<BotFile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileContent, setNewFileContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Determine current listed files
  const currentLevelFiles = files.filter(file => {
    if (currentPath === '/') {
      // Show top level files/folders (no secondary slashes except within folders)
      const pathParts = file.path.split('/').filter(Boolean);
      return pathParts.length === 1;
    } else {
      // Show files/folders within current directory
      const folderPrefix = currentPath === '/' ? '/' : currentPath + '/';
      const pathParts = file.path.replace(currentPath, '').split('/').filter(Boolean);
      return file.path.startsWith(folderPrefix) && pathParts.length === 1;
    }
  });

  const handleFolderClick = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
  };

  const handleBackClick = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = '/' + parts.join('/');
    setCurrentPath(parentPath);
    setSelectedFile(null);
  };

  const handleFileClick = (file: BotFile) => {
    setSelectedFile(file);
  };

  const handleSaveFile = () => {
    if (!selectedFile) return;
    onUpdateFile(selectedFile.path, selectedFile.content || '');
    // Simple notice of save
    alert(`Successfully deployed code alterations to instance path: ${selectedFile.path}`);
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const finalPath = currentPath === '/' ? `/${newFileName}` : `${currentPath}/${newFileName}`;
    
    onCreateFile({
      name: newFileName,
      path: finalPath,
      isDirectory: false,
      size: '1.0 KB',
      content: newFileContent || '// New instance file'
    });

    setNewFileName('');
    setNewFileContent('');
    setShowCreateModal(false);
  };

  const handleDeleteClick = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to permanently delete: ${path}?`)) {
      onDeleteFile(path);
      if (selectedFile?.path === path) {
        setSelectedFile(null);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">File System</h1>
          <p className="text-xs text-slate-400">Directly navigate and alter custom command states, configuration schemas, and assets.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Instance File</span>
        </button>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Explorer Panel (Span 2) */}
        <div className="lg:col-span-2 bg-slate-950/20 border border-slate-900 rounded-xl overflow-hidden flex flex-col min-h-[480px]">
          {/* Breadcrumb / Top Controls */}
          <div className="p-4 border-b border-slate-900 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {currentPath !== '/' && (
                <button 
                  onClick={handleBackClick}
                  className="p-1.5 hover:bg-slate-900 border border-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                <span>ROOT:</span>
                <span className="text-slate-200">{currentPath}</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500">
              Total items on current plane: {currentLevelFiles.length}
            </div>
          </div>

          {/* Directory Listings */}
          <div className="flex-1 divide-y divide-slate-900/60 font-mono text-xs max-h-[400px] overflow-y-auto scrollbar-thin">
            {currentLevelFiles.length === 0 ? (
              <div className="p-16 text-center text-slate-600">
                <FolderClosed className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <span>Empty directory plane.</span>
              </div>
            ) : (
              currentLevelFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => file.isDirectory ? handleFolderClick(file.path) : handleFileClick(file)}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-950/60 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {file.isDirectory ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                        <FolderClosed className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-slate-400 flex items-center justify-center border border-slate-800">
                        <FileCode className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <span className="text-slate-200 font-semibold group-hover:text-blue-400 transition-colors">
                        {file.name}
                      </span>
                      {file.size && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">{file.size}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteClick(file.path, e)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Erase File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Code Previewer Pane (Span 1) */}
        <div className="bg-slate-950/20 border border-slate-900 rounded-xl overflow-hidden flex flex-col h-[480px]">
          {selectedFile ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Active Node Sandbox</h3>
                  <p className="text-[10px] font-mono text-blue-400 mt-0.5 truncate max-w-[200px]">{selectedFile.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Editor */}
              <div className="flex-1 p-2 bg-slate-950 font-mono text-xs">
                <textarea
                  value={selectedFile.content || ''}
                  onChange={(e) => setSelectedFile({ ...selectedFile, content: e.target.value })}
                  spellCheck={false}
                  className="w-full h-full bg-slate-950 text-slate-300 border-0 focus:ring-0 focus:outline-none resize-none p-2 leading-relaxed scrollbar-thin"
                />
              </div>

              {/* Save row */}
              <div className="p-4 border-t border-slate-900 bg-slate-950 flex gap-2">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="flex-1 border border-slate-850 hover:bg-slate-900 text-slate-400 py-2 rounded text-xs font-medium cursor-pointer transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveFile}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Update File</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-600">
              <FileCode className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-xs font-mono font-medium">Select a node file to view/compile.</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] leading-relaxed">
                Alter JSON config files, Javascript assets, or source parameters directly.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create File Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-900 w-full max-w-md rounded-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">New Instance File</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFileSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">File Name (with extension)</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. key_handler.js"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Initial Content</label>
                <textarea 
                  placeholder="// Enter code skeleton here..."
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="w-full h-32 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none resize-none scrollbar-thin"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-slate-850 hover:bg-slate-900 text-slate-400 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all shadow-lg shadow-blue-600/20"
                >
                  Generate File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
