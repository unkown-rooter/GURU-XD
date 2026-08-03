import React, { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import { DeveloperOutputEngine, DetectedFile } from '../../services/developerOutputEngine';
import { ProjectTreeExplorer } from './ProjectTreeExplorer';
import { CopyBlock } from '../copilot/CopyBlock';
import { EngineeringCard, CardType } from '../copilot/EngineeringCard';
import { 
  Info, 
  Lightbulb, 
  AlertTriangle, 
  ShieldAlert, 
  Code2, 
  FileText, 
  Layers, 
  Sparkles, 
  Terminal, 
  CheckCircle2 
} from 'lucide-react';

export interface DeveloperOutputRendererProps {
  content: string;
  providerName?: string;
}

export function DeveloperOutputRenderer({ content, providerName }: DeveloperOutputRendererProps) {
  const engine = DeveloperOutputEngine.getInstance();

  const analysis = useMemo(() => {
    return engine.analyzeResponse(content);
  }, [content]);

  const [activeFileId, setActiveFileId] = useState<string | undefined>(
    analysis.detectedFiles[0]?.id
  );

  const activeFile = useMemo(() => {
    return analysis.detectedFiles.find(f => f.id === activeFileId) || analysis.detectedFiles[0];
  }, [analysis, activeFileId]);

  // Extract embedded JSON card blocks if any
  const renderCardIfPresent = (text: string) => {
    const cardMatch = text.match(/```json:card\n([\s\S]*?)\n```/i);
    if (cardMatch && cardMatch[1]) {
      try {
        const cardData = JSON.parse(cardMatch[1]);
        return (
          <EngineeringCard
            type={cardData.type as CardType || 'system_status'}
            title={cardData.title || 'Engineering Report'}
            description={cardData.description || ''}
            metrics={cardData.metrics}
            actions={cardData.actions}
            severity={cardData.severity}
            timestamp={cardData.timestamp}
          />
        );
      } catch (e) {
        // Fallback
      }
    }
    return null;
  };

  const embeddedCard = renderCardIfPresent(content);

  return (
    <div className="space-y-3 text-xs leading-relaxed font-sans text-slate-200">
      {/* Embedded Engineering Card */}
      {embeddedCard}

      {/* Multi-File Project Explorer View */}
      {analysis.isMultiFileProject && (
        <div className="space-y-2">
          <ProjectTreeExplorer
            tree={analysis.projectTree}
            files={analysis.detectedFiles}
            projectName={analysis.projectName}
            selectedFileId={activeFile?.id}
            onSelectFile={(file) => setActiveFileId(file.id)}
          />

          {/* Active File Inspector */}
          {activeFile && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span className="flex items-center gap-1 font-semibold text-blue-300">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  Viewing: {activeFile.path}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">{activeFile.language} • {activeFile.sizeBytes} bytes</span>
              </div>
              <CopyBlock
                code={activeFile.content}
                language={activeFile.language}
                title={activeFile.path}
              />
            </div>
          )}
        </div>
      )}

      {/* Standard Markdown / Single Code Block Renderer */}
      {!analysis.isMultiFileProject && (
        <Markdown
          components={{
            pre({ children }: any) {
              return <>{children}</>;
            },
            p({ children }: any) {
              return <div className="my-1.5 leading-relaxed">{children}</div>;
            },
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const lang = match ? match[1] : 'text';
              const codeString = String(children).replace(/\n$/, '');

              if (!inline && codeString) {
                return (
                  <CopyBlock
                    code={codeString}
                    language={lang}
                  />
                );
              }

              return (
                <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300 font-mono text-[11px]" {...props}>
                  {children}
                </code>
              );
            },

            blockquote({ children }: any) {
              const textContent = String(children || '');
              let type: 'note' | 'tip' | 'warning' | 'caution' = 'note';

              if (textContent.includes('[!WARNING]') || textContent.includes('⚠️')) type = 'warning';
              if (textContent.includes('[!CAUTION]') || textContent.includes('🚨')) type = 'caution';
              if (textContent.includes('[!TIP]') || textContent.includes('💡')) type = 'tip';

              const styling = {
                note: 'bg-blue-950/20 border-blue-500/40 text-blue-200',
                tip: 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200',
                warning: 'bg-amber-950/20 border-amber-500/40 text-amber-200',
                caution: 'bg-rose-950/20 border-rose-500/40 text-rose-200'
              }[type];

              const Icon = {
                note: Info,
                tip: Lightbulb,
                warning: AlertTriangle,
                caution: ShieldAlert
              }[type];

              return (
                <div className={`my-2.5 p-3 rounded-xl border flex items-start gap-2.5 shadow-sm ${styling}`}>
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 font-sans text-xs leading-relaxed">{children}</div>
                </div>
              );
            },

            table({ children }: any) {
              return (
                <div className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-[#0A0F1D] custom-scrollbar shadow-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    {children}
                  </table>
                </div>
              );
            },
            thead({ children }: any) {
              return <thead className="bg-slate-900/90 text-slate-300 font-bold border-b border-slate-800 font-mono">{children}</thead>;
            },
            th({ children }: any) {
              return <th className="p-2.5 text-slate-200 border-r border-slate-800/60 last:border-0">{children}</th>;
            },
            td({ children }: any) {
              return <td className="p-2.5 text-slate-300 border-t border-slate-800/50 border-r border-slate-800/40 last:border-0">{children}</td>;
            },

            h1({ children }: any) {
              return <h1 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-1.5 mt-3 mb-2">{children}</h1>;
            },
            h2({ children }: any) {
              return <h2 className="text-sm font-bold text-slate-100 mt-2.5 mb-1.5 flex items-center gap-1.5">{children}</h2>;
            },
            h3({ children }: any) {
              return <h3 className="text-xs font-bold text-slate-200 mt-2 mb-1">{children}</h3>;
            },

            ul({ children }: any) {
              return <ul className="list-disc list-inside space-y-1 text-slate-300 my-1.5 pl-1">{children}</ul>;
            },
            ol({ children }: any) {
              return <ol className="list-decimal list-inside space-y-1 text-slate-300 my-1.5 pl-1">{children}</ol>;
            },
            li({ children }: any) {
              return <li className="leading-relaxed">{children}</li>;
            }
          }}
        >
          {content}
        </Markdown>
      )}
    </div>
  );
}
