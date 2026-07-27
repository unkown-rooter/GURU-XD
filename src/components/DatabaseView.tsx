import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Link2, 
  RefreshCw, 
  Plus, 
  Trash2, 
  FileCode, 
  Check, 
  Copy, 
  AlertCircle, 
  Server, 
  Sparkles,
  Layers,
  Save,
  Play,
  CheckCircle2,
  Lock,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import { MongoSchema, MongoField, MongoConfig, LogLine } from '../types';

interface DatabaseViewProps {
  onRefreshLogs?: () => void;
}

export default function DatabaseView({ onRefreshLogs }: DatabaseViewProps) {
  const [config, setConfig] = useState<MongoConfig>({
    uri: "mongodb://localhost:27017/production",
    isConnected: false
  });
  const [schemas, setSchemas] = useState<MongoSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [codeTab, setCodeTab] = useState<'model' | 'connection'>('model');

  // New schema name & description states
  const [newSchemaName, setNewSchemaName] = useState("");
  const [newSchemaDesc, setNewSchemaDesc] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Password masking and visibility controls
  const [showPlainUri, setShowPlainUri] = useState(false);

  const maskMongoUri = (uri: string) => {
    if (!uri) return "";
    // regex to match mongodb://username:password@host or mongodb+srv://username:password@host
    // Handles passwords wrapped with <> as well
    const regex = /^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)(@.+)$/;
    const match = uri.match(regex);
    if (match) {
      const [, protocol, username, password, rest] = match;
      return `${protocol}${username}:••••••••${rest}`;
    }
    return uri;
  };

  // Fetch initial schemas and config
  const fetchMongoData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/mongo/schemas');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.mongoConfig) setConfig(data.mongoConfig);
          if (data.mongoSchemas) {
            setSchemas(data.mongoSchemas);
            if (data.mongoSchemas.length > 0 && !selectedSchemaId) {
              setSelectedSchemaId(data.mongoSchemas[0].id);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load Mongo schemas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMongoData();
  }, []);

  const handleSaveConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/mongo/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: config.uri })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setConfig(data.mongoConfig);
          if (onRefreshLogs) onRefreshLogs();
        }
      }
    } catch (err) {
      console.error("Failed to update Mongo URI:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    try {
      const res = await fetch('/api/mongo/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Simulate polling/checking status after 1.5 seconds
      setTimeout(async () => {
        const checkRes = await fetch('/api/mongo/schemas');
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.success && checkData.mongoConfig) {
            setConfig(checkData.mongoConfig);
          }
        }
        setIsTestingConn(false);
        if (onRefreshLogs) onRefreshLogs();
      }, 1500);
    } catch (err) {
      console.error("Mongo connection handshake failed:", err);
      setIsTestingConn(false);
    }
  };

  const handleCreateSchema = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemaName.trim()) return;

    const formattedName = newSchemaName.trim()
      .replace(/[^a-zA-Z0-9]/g, "") // alphanumeric only
      .replace(/^\d+/, ""); // remove leading digits if any
    
    if (!formattedName) return;

    const newSchema: MongoSchema = {
      id: `schema-${Date.now()}`,
      name: formattedName.charAt(0).toUpperCase() + formattedName.slice(1),
      description: newSchemaDesc || `MongoDB collection schema ledger representing ${formattedName} data rows.`,
      fields: [
        { name: "id", type: "ObjectId", required: true, unique: true },
        { name: "createdAt", type: "Date", required: true, unique: false, defaultValue: "Date.now" }
      ]
    };

    const updatedSchemas = [...schemas, newSchema];
    await saveSchemasToBackend(updatedSchemas);
    setSelectedSchemaId(newSchema.id);
    setNewSchemaName("");
    setNewSchemaDesc("");
    setShowAddModal(false);
  };

  const handleDeleteSchema = async (id: string) => {
    if (schemas.length <= 1) {
      alert("At least one MongoDB schema configuration must be retained.");
      return;
    }
    const updatedSchemas = schemas.filter(s => s.id !== id);
    await saveSchemasToBackend(updatedSchemas);
    if (selectedSchemaId === id) {
      setSelectedSchemaId(updatedSchemas[0].id);
    }
  };

  const saveSchemasToBackend = async (targetSchemas: MongoSchema[]) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/mongo/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mongoSchemas: targetSchemas })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSchemas(data.mongoSchemas);
          if (onRefreshLogs) onRefreshLogs();
        }
      }
    } catch (err) {
      console.error("Failed to sync schemas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeSchema = schemas.find(s => s.id === selectedSchemaId);

  // Field mutations
  const handleAddField = () => {
    if (!activeSchema) return;
    const newField: MongoField = {
      name: `newField_${activeSchema.fields.length}`,
      type: 'String',
      required: false,
      unique: false
    };
    const updated = schemas.map(s => {
      if (s.id === selectedSchemaId) {
        return { ...s, fields: [...s.fields, newField] };
      }
      return s;
    });
    setSchemas(updated);
  };

  const handleRemoveField = (fieldIndex: number) => {
    if (!activeSchema) return;
    const updatedFields = activeSchema.fields.filter((_, idx) => idx !== fieldIndex);
    const updated = schemas.map(s => {
      if (s.id === selectedSchemaId) {
        return { ...s, fields: updatedFields };
      }
      return s;
    });
    setSchemas(updated);
  };

  const handleUpdateField = (fieldIndex: number, key: keyof MongoField, value: any) => {
    if (!activeSchema) return;
    const updatedFields = activeSchema.fields.map((field, idx) => {
      if (idx === fieldIndex) {
        return { ...field, [key]: value };
      }
      return field;
    });
    const updated = schemas.map(s => {
      if (s.id === selectedSchemaId) {
        return { ...s, fields: updatedFields };
      }
      return s;
    });
    setSchemas(updated);
  };

  const handleApplyAllSchemas = async () => {
    await saveSchemasToBackend(schemas);
    alert("MongoDB Schemas compiled and live ledger synced successfully!");
  };

  // Generate Mongoose schema code dynamically
  const generateMongooseCode = () => {
    if (!activeSchema) return `// Select or create a schema collection first.`;

    const sName = activeSchema.name;
    const interfaceFields = activeSchema.fields.map(f => {
      let tsType = 'any';
      if (f.type === 'String') tsType = 'string';
      else if (f.type === 'Number') tsType = 'number';
      else if (f.type === 'Boolean') tsType = 'boolean';
      else if (f.type === 'Date') tsType = 'Date';
      else if (f.type === 'ObjectId') tsType = 'mongoose.Types.ObjectId';
      else if (f.type === 'Array') tsType = 'any[]';
      else if (f.type === 'Mixed') tsType = 'Record<string, any>';
      
      return `  ${f.name}${f.required ? '' : '?'}: ${tsType};`;
    }).join('\n');

    const schemaFields = activeSchema.fields.map(f => {
      let mongooseType: string = f.type;
      if (f.type === 'ObjectId') mongooseType = 'Schema.Types.ObjectId';
      
      const properties: string[] = [`type: ${mongooseType}`];
      if (f.required) properties.push('required: true');
      if (f.unique) properties.push('unique: true');
      if (f.defaultValue) {
        if (f.defaultValue === 'Date.now') properties.push('default: Date.now');
        else if (f.type === 'Boolean') properties.push(`default: ${f.defaultValue}`);
        else if (f.type === 'Number') properties.push(`default: ${f.defaultValue}`);
        else properties.push(`default: '${f.defaultValue}'`);
      }

      return `  ${f.name}: {\n    ${properties.join(',\n    ')}\n  }`;
    }).join(',\n');

    return `import mongoose, { Schema, Document, model } from 'mongoose';

// 1. TypeScript Interface declaration representing data rows
export interface I${sName} extends Document {
${interfaceFields}
}

// 2. Mongoose Schema definition
const ${sName}Schema = new Schema<I${sName}>({
${schemaFields}
}, {
  timestamps: true,
  collection: '${sName.toLowerCase()}s'
});

// 3. Prevent duplicate model compiling during hot-module reloads
export const ${sName} = mongoose.models.${sName} || model<I${sName}>('${sName}', ${sName}Schema);
`;
  };

  const generateConnectionCode = () => {
    // Redact password fully in the generated connection snippet for production safety
    const safeUri = maskMongoUri(config.uri).replace('••••••••', 'YOUR_DB_PASSWORD');

    return `import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "${safeUri}";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot-reloads
 * in development environments to prevent socket leakage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    console.log('[MONGODB] Establishing socket pipeline to cluster...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MONGODB] Connection established. Socket status: OK');
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
`;
  };

  const handleCopyCode = () => {
    const code = codeTab === 'model' ? generateMongooseCode() : generateConnectionCode();
    navigator.clipboard.writeText(code);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-emerald-400" />
            <span>MongoDB Database Brain</span>
          </h1>
          <p className="text-xs text-slate-400">Design Mongoose Schemas, edit collections, copy code, and test connection tunnels in real-time.</p>
        </div>

        <div className="flex items-center gap-2">
          {config.isConnected ? (
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/10" />
              <span>ACTIVE CLUSTER CONNECTED</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-xl text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-slate-500" />
              <span>STANDBY MODE</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection URI Configuration Bar */}
      <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 border-b border-slate-900/40 pb-3">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-400" />
              <span>MongoDB Connection String Configuration</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-sans">Use standard MongoDB connection URI (Atlas, local, or Docker containers).</p>
          </div>
          <div className="text-[10px] bg-slate-900/60 border border-slate-800 text-slate-400 px-2 py-1 rounded font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>ENCRYPTED CREDENTIAL HOOK</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input 
              type="text"
              value={showPlainUri ? config.uri : maskMongoUri(config.uri)}
              onChange={(e) => {
                if (showPlainUri) {
                  setConfig({ ...config, uri: e.target.value });
                }
              }}
              readOnly={!showPlainUri}
              className={`w-full bg-slate-950 border border-slate-900 focus:border-emerald-500 rounded-xl p-3 pr-10 text-xs text-slate-200 focus:outline-none font-mono ${
                !showPlainUri ? 'cursor-not-allowed text-slate-500' : ''
              }`}
              placeholder="mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true"
            />
            <button
              type="button"
              onClick={() => setShowPlainUri(!showPlainUri)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              title={showPlainUri ? "Hide sensitive credentials" : "Show plain credentials"}
            >
              {showPlainUri ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showPlainUri ? (
              <button
                onClick={async () => {
                  await handleSaveConfig();
                  setShowPlainUri(false);
                }}
                disabled={isLoading}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save URI</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowPlainUri(true);
                }}
                disabled={isLoading}
                className="px-4 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                title="Unlock connection string to view or edit the raw password"
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Unlock & Edit</span>
              </button>
            )}
            <button
              onClick={handleTestConnection}
              disabled={isTestingConn}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-950/20"
            >
              <RefreshCw className={`w-4 h-4 ${isTestingConn ? 'animate-spin' : ''}`} />
              <span>{isTestingConn ? "Handshaking..." : "Test Connection"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Designer Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Section: Schemas & Fields Editor (Col-Span 7) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-6 space-y-6">
            
            {/* Schema Selector & Creator Header */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">SCHEMA SELECTION</span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSchemaId}
                    onChange={(e) => setSelectedSchemaId(e.target.value)}
                    className="bg-slate-950 border border-slate-900 text-slate-200 text-xs font-mono font-bold rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500 min-w-[160px] cursor-pointer"
                  >
                    {schemas.map(s => (
                      <option key={s.id} value={s.id}>{s.name} Collection</option>
                    ))}
                  </select>
                  {activeSchema && (
                    <button
                      onClick={() => handleDeleteSchema(activeSchema.id)}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Schema"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Collection</span>
              </button>
            </div>

            {/* Current Active Schema description info */}
            {activeSchema && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold font-display text-slate-200">{activeSchema.name} Collection Definition</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-full">
                    {activeSchema.fields.length} Fields
                  </span>
                </div>
                <input 
                  type="text"
                  value={activeSchema.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = schemas.map(s => s.id === activeSchema.id ? { ...s, description: val } : s);
                    setSchemas(updated);
                  }}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-slate-800 text-slate-400 text-xs rounded-xl p-3 focus:outline-none italic"
                  placeholder="Schema description or documentation notes..."
                />
              </div>
            )}

            {/* Fields List & Specification Form */}
            {activeSchema && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-mono tracking-widest text-slate-400 font-bold">FIELDS SPECIFICATION</span>
                  <button
                    onClick={handleAddField}
                    className="p-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Field</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {activeSchema.fields.map((field, idx) => (
                    <div 
                      key={idx} 
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-900/60 items-center hover:border-slate-800 transition-colors"
                    >
                      {/* Name input */}
                      <div className="sm:col-span-4 space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Field Name</span>
                        <input 
                          type="text" 
                          value={field.name}
                          disabled={field.name === 'id' || field.name === 'createdAt'}
                          onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 disabled:opacity-50 text-xs font-mono rounded-lg p-2 text-slate-200 focus:outline-none"
                        />
                      </div>

                      {/* Type Selector */}
                      <div className="sm:col-span-3 space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Type</span>
                        <select 
                          value={field.type}
                          disabled={field.name === 'id' || field.name === 'createdAt'}
                          onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 text-xs font-mono rounded-lg p-2 text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="String">String</option>
                          <option value="Number">Number</option>
                          <option value="Boolean">Boolean</option>
                          <option value="Date">Date</option>
                          <option value="ObjectId">ObjectId</option>
                          <option value="Array">Array</option>
                          <option value="Mixed">Mixed</option>
                        </select>
                      </div>

                      {/* Required toggle */}
                      <div className="sm:col-span-2 flex flex-col items-center justify-center space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Req</span>
                        <button
                          type="button"
                          disabled={field.name === 'id'}
                          onClick={() => handleUpdateField(idx, 'required', !field.required)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-150 focus:outline-none shrink-0 ${
                            field.required ? 'bg-blue-500' : 'bg-slate-900 border border-slate-800'
                          }`}
                        >
                          <div className={`h-3.5 w-3.5 rounded-full bg-white transition-transform duration-150 ${
                            field.required ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Unique toggle */}
                      <div className="sm:col-span-2 flex flex-col items-center justify-center space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Uniq</span>
                        <button
                          type="button"
                          disabled={field.name === 'id'}
                          onClick={() => handleUpdateField(idx, 'unique', !field.unique)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-150 focus:outline-none shrink-0 ${
                            field.unique ? 'bg-amber-500' : 'bg-slate-900 border border-slate-800'
                          }`}
                        >
                          <div className={`h-3.5 w-3.5 rounded-full bg-white transition-transform duration-150 ${
                            field.unique ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Delete button */}
                      <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                        {field.name !== 'id' && field.name !== 'createdAt' ? (
                          <button
                            onClick={() => handleRemoveField(idx)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors cursor-pointer"
                            title="Remove Field"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apply settings footer */}
            <div className="pt-4 border-t border-slate-900 flex justify-between gap-4">
              <button
                onClick={fetchMongoData}
                className="px-4 py-2 border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Reset Changes
              </button>
              <button
                onClick={handleApplyAllSchemas}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-blue-950/20 animate-pulse-slow"
              >
                <Save className="w-4 h-4" />
                <span>Apply Schemas to Cluster</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Section: Code Generation Output (Col-Span 5) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-6 flex flex-col h-[670px] justify-between relative overflow-hidden">
            
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2.5">
                  <Code className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300 font-mono">Dynamic Mongoose Generator</h3>
                    <p className="text-[10px] text-slate-500 font-sans">Compiling models on state variations.</p>
                  </div>
                </div>

                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-900 text-[10px] font-mono">
                  <button
                    onClick={() => setCodeTab('model')}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                      codeTab === 'model' ? 'bg-slate-900 text-slate-200 border border-slate-800' : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    Model
                  </button>
                  <button
                    onClick={() => setCodeTab('connection')}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                      codeTab === 'connection' ? 'bg-slate-900 text-slate-200 border border-slate-800' : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    Connection
                  </button>
                </div>
              </div>

              {/* Dynamic Code Viewer Block */}
              <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-900/60 p-4 font-mono text-[11px] leading-relaxed overflow-auto relative scrollbar-thin">
                <button
                  onClick={handleCopyCode}
                  className="absolute top-3.5 right-3.5 p-2 bg-slate-950/80 border border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg shrink-0 cursor-pointer transition-colors flex items-center gap-1.5"
                  title="Copy to Clipboard"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400 uppercase font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-[9px] uppercase font-semibold">Copy</span>
                    </>
                  )}
                </button>

                <pre className="text-slate-300 font-normal select-text">
                  <code>{codeTab === 'model' ? generateMongooseCode() : generateConnectionCode()}</code>
                </pre>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-900 flex items-center gap-2 text-slate-500 font-mono text-[10px]">
              <Sparkles className="w-4 h-4 text-amber-500/70" />
              <span>DYNAMIC CODE RE-GENERATOR SYNCED ONLINE</span>
            </div>

          </div>
        </div>

      </div>

      {/* CREATE NEW COLLECTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-900 rounded-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 font-mono">
            
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Compile New Collection</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchema} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Collection Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Message, Ticket, PluginState"
                  value={newSchemaName}
                  onChange={(e) => setNewSchemaName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-blue-500 rounded-xl p-3 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Description / Purpose</label>
                <textarea 
                  placeholder="Summarize the schema data row definition..."
                  value={newSchemaDesc}
                  onChange={(e) => setNewSchemaDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-blue-500 rounded-xl p-3 text-slate-200 focus:outline-none h-20 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Initialize MongoDB Collection</span>
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
