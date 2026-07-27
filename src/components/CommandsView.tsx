import React, { useState } from 'react';
import { 
  Terminal, 
  Plus, 
  Search, 
  Edit2, 
  Eye, 
  EyeOff, 
  FolderCheck,
  Check, 
  X, 
  Code,
  Sparkles
} from 'lucide-react';
import { Command } from '../types';

interface CommandsViewProps {
  commands: Command[];
  onToggleCommand: (id: string) => void;
  onUpdateCommand: (id: string, updated: Partial<Command>) => void;
  onCreateCommand: (command: Omit<Command, 'id'>) => void;
}

export default function CommandsView({ 
  commands, 
  onToggleCommand, 
  onUpdateCommand, 
  onCreateCommand 
}: CommandsViewProps) {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingCmd, setEditingCmd] = useState<Command | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New command state
  const [newTrigger, setNewTrigger] = useState('');
  const [newPrefix, setNewPrefix] = useState('.');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<'Utility' | 'Fun' | 'Moderation' | 'AI' | 'Economy'>('Utility');

  const categories = ['All', 'Utility', 'AI', 'Moderation', 'Fun', 'Economy'];

  // Filter commands
  const filteredCommands = commands.filter((cmd) => {
    const matchesCategory = filterCategory === 'All' || cmd.category === filterCategory;
    const matchesSearch = cmd.trigger.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrigger.trim() || !newDesc.trim()) return;
    
    const defaultCode = `// ${newPrefix}${newTrigger} handler
module.exports = async (client, message, args) => {
  // Add your custom handler code here
  await client.sendMessage(message.from, "Command triggered successfully!");
};`;

    onCreateCommand({
      trigger: newTrigger.toLowerCase().replace(/[^a-z0-9]/g, ''),
      prefix: newPrefix,
      description: newDesc,
      category: newCat,
      isActive: true,
      code: defaultCode
    });

    setNewTrigger('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const saveCommandCode = () => {
    if (!editingCmd) return;
    onUpdateCommand(editingCmd.id, { code: editingCmd.code, description: editingCmd.description });
    setEditingCmd(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">Command Index</h1>
          <p className="text-xs text-slate-400">Manage and code live handlers triggered on incoming message structures.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Command</span>
        </button>
      </div>

      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/20 border border-slate-900 p-4 rounded-xl">
        {/* Category toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                filterCategory === cat 
                  ? 'bg-slate-900 border border-slate-700 text-blue-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg pl-9 pr-4 py-1.8 text-xs text-slate-200 focus:outline-none placeholder-slate-500"
          />
        </div>
      </div>

      {/* List / Editor Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Commands List - Span 2 */}
        <div className="lg:col-span-2 space-y-3">
          {filteredCommands.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-900 rounded-xl text-center">
              <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-xs font-mono text-slate-500">No active commands found matching filters.</p>
            </div>
          ) : (
            filteredCommands.map((cmd) => (
              <div 
                key={cmd.id}
                className={`p-4 rounded-xl border bg-slate-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  editingCmd?.id === cmd.id 
                    ? 'border-blue-500 bg-blue-950/5' 
                    : 'border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                    cmd.isActive 
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}>
                    <Terminal className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold font-mono text-slate-200">
                        {cmd.prefix}{cmd.trigger}
                      </span>
                      <span className="text-[9px] font-mono bg-slate-900 border border-slate-850 px-1.5 py-0.2 rounded text-slate-400">
                        {cmd.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cmd.description}</p>
                  </div>
                </div>

                {/* Command actions */}
                <div className="flex items-center gap-2.5 sm:self-center">
                  <button
                    onClick={() => setEditingCmd(cmd)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-850 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-slate-100 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Handler</span>
                  </button>
                  <button
                    onClick={() => onToggleCommand(cmd.id)}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                      cmd.isActive 
                        ? 'border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                        : 'border-slate-850 bg-slate-900/60 text-slate-500 hover:text-slate-300'
                    }`}
                    title={cmd.isActive ? 'Deactivate Command' : 'Activate Command'}
                  >
                    {cmd.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live Code Editor Panel - Span 1 */}
        <div className="bg-slate-950/20 border border-slate-900 rounded-xl overflow-hidden flex flex-col h-[520px]">
          {editingCmd ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Live Code sandbox</h3>
                  <p className="text-[10px] font-mono text-blue-400 mt-0.5">{editingCmd.prefix}{editingCmd.trigger}.js</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingCmd(null)}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description editor */}
              <div className="p-4 border-b border-slate-900 bg-slate-950/40 space-y-1.5">
                <span className="text-[9px] uppercase font-mono text-slate-500 font-semibold">Handler Description</span>
                <input 
                  type="text" 
                  value={editingCmd.description}
                  onChange={(e) => setEditingCmd({ ...editingCmd, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 text-xs p-2 rounded text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Code field */}
              <div className="flex-1 p-2 bg-slate-950 text-xs font-mono">
                <textarea
                  value={editingCmd.code}
                  onChange={(e) => setEditingCmd({ ...editingCmd, code: e.target.value })}
                  spellCheck={false}
                  className="w-full h-full bg-slate-950 text-slate-300 resize-none border-0 focus:ring-0 focus:outline-none p-2 leading-relaxed scrollbar-thin"
                />
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-900 bg-slate-950 flex gap-2">
                <button
                  onClick={() => setEditingCmd(null)}
                  className="flex-1 border border-slate-850 hover:bg-slate-900 text-slate-400 py-2 rounded text-xs font-medium cursor-pointer transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={saveCommandCode}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <FolderCheck className="w-4 h-4" />
                  <span>Deploy Handler</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-600">
              <Code className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-xs font-mono font-medium">Select a command to open the sandbox editor.</p>
              <p className="text-[10px] text-slate-500 max-w-[200px] mt-1 leading-relaxed">
                Compile and edit bot callback handlers directly on live nodes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Create command */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-900 w-full max-w-md rounded-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Add Command Trigger</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Prefix</label>
                  <input 
                    type="text"
                    required
                    maxLength={3}
                    placeholder="."
                    value={newPrefix}
                    onChange={(e) => setNewPrefix(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none text-center"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Trigger name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. ping"
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Category</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none"
                >
                  <option value="Utility">Utility Manuals</option>
                  <option value="AI">AI Integrations</option>
                  <option value="Moderation">Moderation Safeguards</option>
                  <option value="Fun">Fun & Entertainment</option>
                  <option value="Economy">Economy & RPG</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Description</label>
                <textarea 
                  required
                  placeholder="Summarize what this command does..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none resize-none"
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
                  Create Live Handler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
