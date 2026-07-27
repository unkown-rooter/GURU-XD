import React, { useState } from 'react';
import { 
  HardDrive, 
  Upload, 
  File, 
  Trash2, 
  FolderPlus, 
  Download, 
  Check, 
  Database, 
  ShieldCheck, 
  Plus, 
  X,
  Lock,
  Globe
} from 'lucide-react';

export interface StorageBucket {
  id: string;
  name: string;
  region: string;
  objectCount: number;
  usedSize: string;
  isPublic: boolean;
  createdAt: string;
}

export interface StorageFile {
  id: string;
  name: string;
  bucketName: string;
  size: string;
  type: string;
  updatedAt: string;
}

export default function StorageView() {
  const [buckets, setBuckets] = useState<StorageBucket[]>([
    {
      id: 'b-1',
      name: 'guru-media-assets',
      region: 'us-east-1',
      objectCount: 1420,
      usedSize: '18.4 GB',
      isPublic: true,
      createdAt: '2026-01-15'
    },
    {
      id: 'b-2',
      name: 'guru-bot-backups',
      region: 'eu-west-2',
      objectCount: 38,
      usedSize: '4.2 GB',
      isPublic: false,
      createdAt: '2026-02-01'
    },
    {
      id: 'b-3',
      name: 'guru-session-dumps',
      region: 'ap-south-1',
      objectCount: 120,
      usedSize: '850 MB',
      isPublic: false,
      createdAt: '2026-03-10'
    }
  ]);

  const [selectedBucket, setSelectedBucket] = useState<string>('guru-media-assets');
  const [showCreateBucketModal, setShowCreateBucketModal] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketPublic, setNewBucketPublic] = useState(false);

  const [files, setFiles] = useState<StorageFile[]>([
    { id: 'f-1', name: 'whatsapp_session_backup_07252026.json', bucketName: 'guru-session-dumps', size: '12.4 MB', type: 'application/json', updatedAt: '2026-07-25 01:20' },
    { id: 'f-2', name: 'bot_avatar_master.png', bucketName: 'guru-media-assets', size: '2.1 MB', type: 'image/png', updatedAt: '2026-07-24 18:45' },
    { id: 'f-3', name: 'database_export_full.sql.gz', bucketName: 'guru-bot-backups', size: '1.2 GB', type: 'application/gzip', updatedAt: '2026-07-23 04:00' }
  ]);

  const handleCreateBucketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;

    setBuckets([
      ...buckets,
      {
        id: 'b-' + Date.now(),
        name: newBucketName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        region: 'us-east-1',
        objectCount: 0,
        usedSize: '0 B',
        isPublic: newBucketPublic,
        createdAt: new Date().toISOString().split('T')[0]
      }
    ]);

    setNewBucketName('');
    setShowCreateBucketModal(false);
  };

  const currentFiles = files.filter((f) => f.bucketName === selectedBucket);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-blue-500" />
            <span>NVMe SSD Cloud Storage & Buckets</span>
          </h1>
          <p className="text-xs text-slate-400">High-performance S3-compatible object storage for bot media dumps, session backups, and static assets.</p>
        </div>

        <button
          onClick={() => setShowCreateBucketModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer self-start"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Create Storage Bucket</span>
        </button>
      </div>

      {/* Quota Metric Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>NVMe SSD Storage Used</span>
            <span className="font-mono text-blue-400 font-bold">23.45 GB / 100 GB</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-blue-500 h-full rounded-full w-[23%]" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 block">Total Active Buckets</span>
          <span className="text-xl font-bold font-mono text-slate-100">{buckets.length} Buckets</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 block">Egress Bandwidth (Monthly)</span>
          <span className="text-xl font-bold font-mono text-emerald-400">142.8 GB / Unlimited</span>
        </div>
      </div>

      {/* Buckets Bar & File Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bucket Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Storage Buckets</span>
          <div className="space-y-2">
            {buckets.map((b) => {
              const isSelected = selectedBucket === b.name;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBucket(b.name)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected 
                      ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/10' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-100 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-blue-400" />
                      <span>{b.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full">
                      {b.isPublic ? 'Public Read' : 'Private ACL'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>{b.usedSize}</span>
                    <span>{b.objectCount} Objects</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bucket Files Table */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-mono">s3://{selectedBucket}/</h3>
              <p className="text-xs text-slate-400">Objects & Files stored in bucket</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="pb-2">Object Name</th>
                  <th className="pb-2">Size</th>
                  <th className="pb-2">Content-Type</th>
                  <th className="pb-2">Last Modified</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {currentFiles.length > 0 ? (
                  currentFiles.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-900/40">
                      <td className="py-3 font-semibold text-slate-200 flex items-center gap-2">
                        <File className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{f.name}</span>
                      </td>
                      <td className="py-3 text-slate-400">{f.size}</td>
                      <td className="py-3 text-slate-500 text-[11px]">{f.type}</td>
                      <td className="py-3 text-slate-400">{f.updatedAt}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setFiles(files.filter((item) => item.id !== f.id))}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs font-sans">
                      No files in this storage bucket yet. Click 'Upload File' to add objects.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Bucket Modal */}
      {showCreateBucketModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100">Create Storage Bucket</h3>
              <button onClick={() => setShowCreateBucketModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateBucketSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Bucket Name</label>
                <input
                  type="text"
                  required
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  placeholder="e.g. my-app-uploads"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBucketPublic}
                  onChange={(e) => setNewBucketPublic(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500/20"
                />
                <span className="text-xs text-slate-300">Enable Public Read Access (S3 Web Bucket)</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateBucketModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Create Bucket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
