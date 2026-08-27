import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CornerDownLeft, ArrowUpRight } from 'lucide-react';
import { GraphNode } from '../types';
import { TYPE_COLORS } from '../data/repositories';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: GraphNode[];
  onSelectNode: (node: GraphNode) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  nodes,
  onSelectNode,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredNodes = nodes
    .filter((n) =>
      query === ''
        ? true
        : n.name.toLowerCase().includes(query.toLowerCase()) ||
          n.path.toLowerCase().includes(query.toLowerCase()) ||
          n.type.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 8);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredNodes.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredNodes.length) % Math.max(1, filteredNodes.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredNodes[selectedIndex]) {
        onSelectNode(filteredNodes[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div
        id="search-command-palette"
        className="relative w-full max-w-xl rounded-2xl bg-[#09090b]/90 backdrop-blur-2xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.9)] overflow-hidden font-mono text-white animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-3">
          <Search size={16} className="text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files, components, hooks, routes... (↑↓ to navigate)"
            className="w-full bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-white/30 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50 shrink-0">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredNodes.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40">
              No matching modules found in AST graph
            </div>
          ) : (
            filteredNodes.map((node, index) => {
              const isSelected = index === selectedIndex;
              const typeConfig = TYPE_COLORS[node.type] || TYPE_COLORS.component;
              return (
                <div
                  key={node.id}
                  onClick={() => {
                    onSelectNode(node);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: typeConfig.hex }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white/95 truncate">
                        {node.name}
                      </span>
                      <span className="text-[10px] text-white/40 truncate">
                        {node.path}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-medium"
                      style={{
                        backgroundColor: `${typeConfig.hex}20`,
                        color: typeConfig.hex,
                      }}
                    >
                      {node.type}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {node.metrics.loc} LOC
                    </span>
                    {isSelected && <ArrowUpRight size={13} className="text-blue-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-[10px] text-white/30">
          <span>{nodes.length} total nodes indexed</span>
          <div className="flex items-center gap-1">
            <span>Press</span>
            <CornerDownLeft size={10} />
            <span>to jump to 3D node</span>
          </div>
        </div>
      </div>
    </div>
  );
};
