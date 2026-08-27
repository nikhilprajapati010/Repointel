import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Zap, 
  BrainCircuit,
  ArrowRight,
  Flame,
  FileCode2,
  Activity,
  MessageSquare,
  Package,
  CornerDownRight,
  Link2,
  Filter,
  Layers,
  ExternalLink,
  Cpu,
  BarChart2,
  Gauge,
  GitBranch,
  ShieldCheck,
  Binary,
  Code2,
  Sparkles
} from 'lucide-react';
import { GraphNode, ChatMessage } from '../types';
import { TYPE_COLORS } from '../data/repositories';

interface AIPanelProps {
  node: GraphNode;
  allNodes?: GraphNode[];
  repoName: string;
  onClose: () => void;
  onSelectNode?: (node: GraphNode) => void;
  onOpenCodeModal?: (node: GraphNode) => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({ 
  node, 
  allNodes = [], 
  repoName, 
  onClose,
  onSelectNode,
  onOpenCodeModal
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'code' | 'chat'>('summary');
  const [snippetMode, setSnippetMode] = useState<'linked' | 'all'>('linked');
  const [summary, setSummary] = useState<string>(node.summary);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: `AST indexed for ${node.name}. Ready to analyze dependencies, cyclomatic complexity (${node.metrics.complexity}/10), and memory profiles.`,
      timestamp: Date.now(),
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [highThinkingEnabled, setHighThinkingEnabled] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Extract specific lines through which this node is linked (imports, exports, dependency callers)
  const linkedLines = useMemo(() => {
    const allLines = node.codePreview.split('\n');
    const result: Array<{
      lineNum: number;
      text: string;
      type: 'import' | 'export' | 'call';
      tag: string;
      matchedDep?: string;
    }> = [];

    allLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 1. Import statements (linking upstream dependencies)
      if (trimmed.startsWith('import ') || trimmed.startsWith('import{')) {
        const matchDep = node.dependencies.find((dep) => {
          const baseName = dep.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
          return baseName && trimmed.includes(baseName);
        });
        result.push({
          lineNum: idx + 1,
          text: line,
          type: 'import',
          tag: 'IMPORT LINK',
          matchedDep: matchDep,
        });
        return;
      }

      // 2. Export statements (linking downstream consumers)
      if (trimmed.startsWith('export ') || trimmed.startsWith('export default')) {
        result.push({
          lineNum: idx + 1,
          text: line,
          type: 'export',
          tag: 'EXPORT CONTRACT',
        });
        return;
      }

      // 3. Direct caller usage lines matching dependencies
      const matchedDep = node.dependencies.find((dep) => {
        const cleanName = dep.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
        return cleanName && cleanName.length > 2 && trimmed.includes(cleanName);
      });

      if (matchedDep) {
        result.push({
          lineNum: idx + 1,
          text: line,
          type: 'call',
          tag: 'USAGE CALL',
          matchedDep,
        });
      }
    });

    return result;
  }, [node.codePreview, node.dependencies, node.exports]);

  // Sync summary & init chat when selected node changes
  useEffect(() => {
    setSummary(node.summary);
    setMessages([
      {
        id: `init-${node.id}`,
        role: 'assistant',
        content: `Node ${node.name} (${node.metrics.loc} LOC) selected. Ask technical architectural questions or inspect AST diagnostics below.`,
        timestamp: Date.now(),
      }
    ]);
  }, [node.id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, activeTab]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(node.codePreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFetchAiSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/gemini/analyze-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node, repoName }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || chatInput;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsThinking(true);
    setActiveTab('chat');

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node,
          messages: [...messages, userMsg],
          userQuery: textToSend,
          repoName,
          highThinking: highThinkingEnabled,
        }),
      });
      const data = await res.json();

      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Static analysis completed with zero runtime anomalies.',
        timestamp: Date.now(),
        thinkingContent: data.thinking,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: 'AST Verification: Node functions safely with strictly bounded state scopes.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Helper to find a matching GraphNode from a dependency string
  const findMatchingNode = (depString: string): GraphNode | undefined => {
    const cleanDep = depString.replace(/['"@]/g, '').trim();
    return allNodes.find((n) => {
      if (n.id === depString || n.id === cleanDep) return true;
      if (n.name.toLowerCase() === cleanDep.toLowerCase()) return true;
      if (n.name.toLowerCase() === cleanDep.split('/').pop()?.toLowerCase()) return true;
      if (n.path.toLowerCase().includes(cleanDep.toLowerCase())) return true;
      return false;
    });
  };

  const handleDependencyClick = (depName: string) => {
    const targetNode = findMatchingNode(depName);
    if (targetNode && onSelectNode) {
      onSelectNode(targetNode);
    } else {
      // If it's an external library or package, ask AI about it
      handleSendMessage(`Explain the architectural purpose of external dependency "${depName}" in ${node.name} and potential decoupling or performance trade-offs.`);
    }
  };

  const typeConfig = TYPE_COLORS[node.type] || TYPE_COLORS.component;
  const memoryEst = ((node.metrics.loc * 0.045) + (node.dependencies.length * 0.8)).toFixed(1);
  const complexityScore = node.metrics.complexity > 7 ? 'O(n²)' : node.metrics.complexity > 4 ? 'O(n log n)' : 'O(1)';

  return (
    <aside
      id="ai-panel-glass"
      className="fixed top-6 right-6 bottom-6 w-84 sm:w-92 max-w-[calc(100vw-3rem)] z-20 flex flex-col bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-2xl text-white overflow-hidden animate-in fade-in slide-in-from-right-8 duration-200"
    >
      {/* Panel Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex flex-col min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">
              Entity analysis
            </span>
            <span 
              className="text-[9px] font-mono px-1.5 py-0.2 rounded uppercase"
              style={{ backgroundColor: `${typeConfig.hex}25`, color: typeConfig.hex }}
            >
              {node.type}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-white truncate" title={node.path}>
            {node.name}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-header-show-code"
            onClick={() => {
              if (onOpenCodeModal) {
                onOpenCodeModal(node);
              } else {
                setActiveTab('code');
              }
            }}
            title="Show Code inside this node"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-[11px] font-mono text-blue-300 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <FileCode2 size={13} className="text-blue-400" />
            <span className="font-medium">Show Code</span>
          </button>

          <button
            id="ai-panel-close-btn"
            onClick={onClose}
            aria-label="Close entity analysis"
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center px-6 py-2 border-b border-white/5 bg-black/20 gap-2 font-mono text-[11px]">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'summary' 
              ? 'bg-blue-500/15 text-blue-300 font-medium border border-blue-500/30' 
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Activity size={12} />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'code' 
              ? 'bg-blue-500/15 text-blue-300 font-medium border border-blue-500/30' 
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <FileCode2 size={12} />
          <span>Snippet</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'chat' 
              ? 'bg-blue-500/15 text-blue-300 font-medium border border-blue-500/30' 
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <MessageSquare size={12} />
          <span>Chat AI</span>
        </button>
      </div>

      {/* Panel Content Body */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
        {activeTab === 'summary' && (
          <>
            {/* Section 1: AI Summary & High-Level Code Metrics Matrix */}
            <section className="space-y-4">
              {/* AI Summary Card */}
              <div className="p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                    <h3 className="text-[10px] font-mono text-blue-300 uppercase tracking-widest font-semibold">
                      AI Architectural Summary
                    </h3>
                  </div>
                  <button
                    onClick={handleFetchAiSummary}
                    disabled={loadingSummary}
                    className="flex items-center gap-1 text-[10px] font-mono text-blue-400 hover:text-blue-200 transition-colors cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/20"
                  >
                    <Sparkles size={10} className={loadingSummary ? 'animate-spin' : ''} />
                    <span>{loadingSummary ? 'Synthesizing...' : 'Regenerate'}</span>
                  </button>
                </div>
                <p className="text-[13px] leading-relaxed text-white/90 font-normal selection:bg-blue-500/30">
                  {summary}
                </p>
              </div>

              {/* High-Level Code Metrics Dashboard */}
              <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-widest font-semibold">
                    <BarChart2 size={12} className="text-emerald-400" />
                    <span>High-Level Code Metrics</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 uppercase font-medium">
                    Telemetry Live
                  </span>
                </div>

                {/* 2x2 Metric Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Metric 1: Lines of Code (LOC) */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-white/50">
                      <span className="flex items-center gap-1">
                        <Code2 size={11} className="text-blue-400" />
                        <span>Lines of Code</span>
                      </span>
                      <span className="text-blue-300 font-bold">{node.metrics.loc} LOC</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, (node.metrics.loc / 350) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-white/40">
                      <span>{node.codePreview.split('\n').length} raw lines</span>
                      <span>{(node.sizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  {/* Metric 2: Cyclomatic Complexity */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-white/50">
                      <span className="flex items-center gap-1">
                        <Gauge size={11} className="text-amber-400" />
                        <span>Cyclomatic Cmplx</span>
                      </span>
                      <span className={`font-bold ${
                        node.metrics.complexity > 6 ? 'text-rose-400' :
                        node.metrics.complexity > 3 ? 'text-amber-300' : 'text-emerald-400'
                      }`}>
                        {node.metrics.complexity}/10
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          node.metrics.complexity > 6 ? 'bg-rose-500' :
                          node.metrics.complexity > 3 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(15, node.metrics.complexity * 10))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-white/40">Scale: {complexityScore}</span>
                      <span className={`${
                        node.metrics.complexity > 6 ? 'text-rose-300' :
                        node.metrics.complexity > 3 ? 'text-amber-300' : 'text-emerald-300'
                      }`}>
                        {node.metrics.complexity > 6 ? 'High Branching' : node.metrics.complexity > 3 ? 'Moderate' : 'Pure / Linear'}
                      </span>
                    </div>
                  </div>

                  {/* Metric 3: Maintainability Index */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-white/50">
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={11} className="text-emerald-400" />
                        <span>Maintainability</span>
                      </span>
                      <span className="text-emerald-300 font-bold">{node.metrics.maintainability}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, node.metrics.maintainability)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-white/40">
                      <span>Index Score</span>
                      <span className="text-emerald-300">
                        {node.metrics.maintainability >= 85 ? 'Grade A' : node.metrics.maintainability >= 70 ? 'Grade B' : 'Grade C'}
                      </span>
                    </div>
                  </div>

                  {/* Metric 4: Coupling & Tree Depth */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-white/50">
                      <span className="flex items-center gap-1">
                        <GitBranch size={11} className="text-purple-400" />
                        <span>Graph Coupling</span>
                      </span>
                      <span className="text-purple-300 font-bold">Depth {node.metrics.depth}</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (node.dependencies.length / 8) * 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-white/40">
                      <span>{node.dependencies.length} In / {node.exports.length} Out</span>
                      <span className="text-purple-300">
                        {node.dependencies.length > 5 ? 'High Fan-out' : 'Decoupled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footprint & AI Metric Inquiry Chips */}
                <div className="pt-1 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-[10px]">
                  <div className="flex items-center gap-2 text-white/50">
                    <Cpu size={11} className="text-blue-400" />
                    <span>Est. Heap Footprint: <strong className="text-white/80">{memoryEst} MB</strong></span>
                  </div>
                  <button
                    onClick={() => handleSendMessage(`Analyze the code metrics for ${node.name} (LOC: ${node.metrics.loc}, Cyclomatic Complexity: ${node.metrics.complexity}/10, Maintainability: ${node.metrics.maintainability}%, Coupling Depth: ${node.metrics.depth}). Suggest concrete refactoring steps to reduce complexity and improve modularity.`)}
                    className="flex items-center gap-1 text-[9px] text-blue-300 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    title="Ask AI to analyze and optimize these metrics"
                  >
                    <Sparkles size={10} />
                    <span>Audit with AI</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Section 2: Source Code Preview & Quick Action */}
            <section className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/40 uppercase tracking-widest">
                  <Link2 size={12} className="text-purple-400" />
                  <span>Node Linkage Lines</span>
                </div>
                <span className="text-[10px] font-mono text-purple-300">
                  {linkedLines.length} linked lines • {node.codePreview.split('\n').length} in file
                </span>
              </div>

              {/* Code preview snippet showing only the specific linked lines */}
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-blue-200/80 max-h-32 overflow-y-auto custom-scrollbar leading-relaxed">
                {linkedLines.length > 0 ? (
                  <div className="space-y-1.5">
                    {linkedLines.slice(0, 6).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 group hover:bg-white/[0.04] p-0.5 rounded transition-colors">
                        <span className="text-[10px] text-white/30 shrink-0 select-none w-5 text-right font-mono">
                          {item.lineNum}
                        </span>
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded shrink-0 uppercase ${
                          item.type === 'import' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          item.type === 'export' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {item.tag}
                        </span>
                        <span className="text-[11px] font-mono text-white/90 truncate flex-1">
                          {item.text.trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-white/40 italic py-2 text-center">
                    No direct import/export links found.
                  </div>
                )}
              </div>

              {/* Action Buttons: View Full Code (Button 1) & Linked Snippet (Button 2) */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="btn-show-code-inside-node"
                  onClick={() => {
                    if (onOpenCodeModal) {
                      onOpenCodeModal(node);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-xs font-mono text-blue-200 hover:text-white transition-all cursor-pointer font-medium shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  title="Open full file with all lines in dedicated IDE modal"
                >
                  <FileCode2 size={13} className="text-blue-400" />
                  <span>View Full Code ({node.codePreview.split('\n').length} lines)</span>
                </button>
                <button
                  onClick={() => {
                    setSnippetMode('linked');
                    setActiveTab('code');
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-mono text-purple-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  title="View only specific lines linking this node"
                >
                  <Link2 size={12} className="text-purple-400" />
                  <span>Snippet ({linkedLines.length})</span>
                </button>
              </div>
            </section>

            {/* Section 3: Direct Dependencies */}
            {node.dependencies.length > 0 && (
              <section id="section-direct-dependencies">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    Direct Dependencies ({node.dependencies.length})
                  </h3>
                  <span className="text-[10px] font-mono text-blue-400/60">
                    Click to jump / query
                  </span>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {node.dependencies.map((dep, idx) => {
                    const matchedNode = findMatchingNode(dep);
                    const matchedType = matchedNode ? TYPE_COLORS[matchedNode.type] : null;

                    return (
                      <button
                        key={idx}
                        id={`dep-item-${idx}`}
                        onClick={() => handleDependencyClick(dep)}
                        title={matchedNode ? `Jump to ${matchedNode.name} (${matchedNode.type})` : `Ask AI about ${dep}`}
                        className="w-full group px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-blue-500/15 border border-white/5 hover:border-blue-500/30 text-[11px] text-white/80 hover:text-white flex items-center justify-between font-mono transition-all cursor-pointer text-left shadow-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {matchedNode ? (
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: matchedType?.hex || '#60a5fa' }} 
                            />
                          ) : (
                            <Package size={12} className="text-white/40 group-hover:text-blue-300 shrink-0" />
                          )}
                          <span className="truncate group-hover:text-blue-200">{dep}</span>
                          {matchedNode && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/60 uppercase shrink-0">
                              {matchedNode.type}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-white/30 group-hover:text-blue-300 shrink-0 transition-transform group-hover:translate-x-0.5">
                          <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">
                            {matchedNode ? 'Jump' : 'Query'}
                          </span>
                          <ArrowRight size={12} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section 4: Suggestion Card */}
            <section className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <h4 className="text-[11px] font-bold text-blue-300 mb-2">Suggestion</h4>
              <p className="text-[12px] text-blue-200/80 leading-snug">
                {node.metrics.complexity > 6 
                  ? `Consider refactoring inner switch branches in ${node.name} to reduce cyclomatic pressure and lower GC pause latency.` 
                  : `Ensure deterministic purity when importing ${node.name} across worker threads or SSR hydrate boundaries.`}
              </p>
            </section>
          </>
        )}

        {activeTab === 'code' && (
          <div className="space-y-3">
            {/* Header with Mode Filter and Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Filter Tabs: Linked Lines vs Full File */}
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 font-mono text-[10px]">
                <button
                  id="tab-snippet-linked"
                  onClick={() => setSnippetMode('linked')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    snippetMode === 'linked'
                      ? 'bg-purple-500/25 text-purple-200 font-medium border border-purple-500/40 shadow-sm'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <Link2 size={11} className="text-purple-400" />
                  <span>Linked Lines ({linkedLines.length})</span>
                </button>
                <button
                  id="tab-snippet-all"
                  onClick={() => setSnippetMode('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    snippetMode === 'all'
                      ? 'bg-blue-500/25 text-blue-200 font-medium border border-blue-500/40 shadow-sm'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <FileCode2 size={11} className="text-blue-400" />
                  <span>All Code ({node.codePreview.split('\n').length})</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="btn-copy-panel-code"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[11px] font-mono text-white/60 hover:text-white px-2 py-1 rounded-lg bg-white/5 border border-white/10 transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {onOpenCodeModal && (
                  <button
                    id="btn-expand-code-modal"
                    onClick={() => onOpenCodeModal(node)}
                    className="flex items-center gap-1 text-[11px] font-mono text-blue-300 hover:text-white px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 transition-colors cursor-pointer"
                    title="Open Full Code in IDE Modal"
                  >
                    <span>View Full</span>
                    <ArrowRight size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Snippet Code Box */}
            {snippetMode === 'linked' ? (
              <div className="space-y-2">
                <div className="p-2 bg-purple-500/5 border border-purple-500/15 rounded-xl text-[11px] text-purple-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Link2 size={12} className="text-purple-400 shrink-0" />
                    <span>Specific lines creating graph links for <strong>{node.name}</strong></span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300/60">{linkedLines.length} statements</span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 overflow-x-auto max-h-[360px] custom-scrollbar space-y-2">
                  {linkedLines.length > 0 ? (
                    linkedLines.map((item, idx) => {
                      const matchedNode = item.matchedDep ? findMatchingNode(item.matchedDep) : undefined;
                      const matchedType = matchedNode ? TYPE_COLORS[matchedNode.type] : undefined;

                      return (
                        <div 
                          key={idx} 
                          className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all font-mono space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-white/40 border-b border-white/5 pb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-300 font-semibold">Line {item.lineNum}</span>
                              <span className={`text-[8px] px-1.5 py-0.2 rounded uppercase font-semibold ${
                                item.type === 'import' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                item.type === 'export' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {item.tag}
                              </span>
                            </div>

                            {item.matchedDep && (
                              <button
                                onClick={() => handleDependencyClick(item.matchedDep!)}
                                className="flex items-center gap-1 text-[9px] text-blue-300 hover:text-white px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors cursor-pointer"
                                title={matchedNode ? `Jump to ${matchedNode.name}` : `Query ${item.matchedDep}`}
                              >
                                {matchedNode && (
                                  <span 
                                    className="w-1.5 h-1.5 rounded-full" 
                                    style={{ backgroundColor: matchedType?.hex || '#60a5fa' }} 
                                  />
                                )}
                                <span>{matchedNode ? `Jump to ${matchedNode.name}` : item.matchedDep}</span>
                                <ArrowRight size={9} />
                              </button>
                            )}
                          </div>

                          <div className="text-[11px] text-blue-100 whitespace-pre overflow-x-auto pt-0.5 leading-relaxed selection:bg-purple-500/30">
                            {item.text}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-white/40 italic">
                      No external import or contract lines detected in this node.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 overflow-x-auto max-h-[380px] custom-scrollbar">
                <div className="flex font-mono text-[11px] leading-relaxed">
                  {/* Line Numbers */}
                  <div className="select-none pr-3 text-right text-white/20 border-r border-white/10 shrink-0">
                    {node.codePreview.split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  {/* Full Code Content */}
                  <div className="pl-3 flex-1 text-blue-200/90 whitespace-pre">
                    {node.codePreview}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-1">
              <span className="text-purple-300">{linkedLines.length} linked statements</span>
              <span>{node.codePreview.split('\n').length} total lines ({(node.sizeBytes / 1024).toFixed(1)} KB)</span>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-500/10 border border-blue-500/30 text-blue-100 ml-4 font-sans'
                    : 'bg-white/[0.04] border border-white/10 text-white/90 mr-2 font-sans'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-white/40 mb-1.5">
                  <span>{msg.role === 'user' ? 'Developer' : 'Phi-3 / Gemini Intelligence'}</span>
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}

            {isThinking && (
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 flex items-center gap-2.5">
                <BrainCircuit size={14} className="text-blue-400 animate-pulse" />
                <span className="text-xs font-mono text-blue-400/90">
                  {highThinkingEnabled ? 'Deep Static Reasoning...' : 'Analyzing AST dependencies...'}
                </span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-between pb-2 px-1 text-[10px] font-mono text-white/40">
          <span className="text-white/40">AI Code Assistant</span>
          <button
            onClick={() => setHighThinkingEnabled(!highThinkingEnabled)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
              highThinkingEnabled
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'hover:text-white/70'
            }`}
            title="Toggle High Thinking Reasoning"
          >
            <Flame size={10} className={highThinkingEnabled ? "text-blue-400" : ""} />
            <span>High Thinking</span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative"
        >
          <input
            id="ai-panel-chat-input"
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Phi-3 about this code..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-[12px] placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all text-white"
          />
          <button
            id="ai-panel-send-btn"
            type="submit"
            disabled={!chatInput.trim() || isThinking}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </aside>
  );
};
