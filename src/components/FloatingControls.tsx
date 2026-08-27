import React, { useState } from 'react';
import { 
   Search, 
   RotateCcw, 
   Filter, 
   Orbit, 
   Layers, 
   Eye, 
   EyeOff, 
   Check, 
   Globe, 
   Network,
   Sparkles,
   CheckSquare,
   Square
} from 'lucide-react';
import { LayoutMode, NodeType, GraphNode } from '../types';
import { TYPE_COLORS } from '../data/repositories';

interface FloatingControlsProps {
  onOpenSearch: () => void;
  onResetCamera: () => void;
  nodes?: GraphNode[];
  selectedTypes: Set<NodeType>;
  onToggleType: (type: NodeType) => void;
  onSelectOnlyType?: (type: NodeType) => void;
  onSelectAllTypes: () => void;
  onResetAllTypes?: () => void;
  layoutMode: LayoutMode;
  onChangeLayout: (mode: LayoutMode) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  showEdges: boolean;
  onToggleEdges: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  onOpenSearch,
  onResetCamera,
  nodes = [],
  selectedTypes,
  onToggleType,
  onSelectOnlyType,
  onSelectAllTypes,
  onResetAllTypes,
  layoutMode,
  onChangeLayout,
  autoRotate,
  onToggleAutoRotate,
  showEdges,
  onToggleEdges,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);

  const allNodeTypes = Object.keys(TYPE_COLORS) as NodeType[];
  const isAllSelected = selectedTypes.size === allNodeTypes.length;
  const isNoneSelected = selectedTypes.size === 0;

  // Calculate node counts per archetype
  const typeCounts = React.useMemo(() => {
    const counts: Record<NodeType, number> = {
      component: 0,
      hook: 0,
      api: 0,
      util: 0,
      state: 0,
      style: 0,
      config: 0,
      test: 0,
    };
    nodes.forEach((node) => {
      if (counts[node.type] !== undefined) {
        counts[node.type]++;
      }
    });
    return counts;
  }, [nodes]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
      {/* Type Filter Popover */}
      {filterOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
          <div 
            id="filter-popover-menu"
            className="absolute bottom-full mb-3 p-3 w-72 rounded-2xl bg-[#09090b]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="flex items-center justify-between px-1 pb-2.5 mb-2 border-b border-white/10 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-white/40 uppercase tracking-widest text-[9px]">Archetypes</span>
                <span className="px-1.5 py-0.2 bg-white/10 text-white/70 rounded text-[9px]">
                  {selectedTypes.size}/{allNodeTypes.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isNoneSelected || !isAllSelected ? (
                  <button 
                    onClick={onResetAllTypes || onSelectAllTypes}
                    className="text-blue-400 hover:text-blue-300 transition-colors text-[10px] cursor-pointer font-medium hover:underline"
                  >
                    Select All
                  </button>
                ) : (
                  <button 
                    onClick={onSelectAllTypes}
                    className="text-white/40 hover:text-white/80 transition-colors text-[10px] cursor-pointer hover:underline"
                  >
                    Deselect All
                  </button>
                )}
              </div>
            </div>

            {isNoneSelected && (
              <div className="mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center justify-between">
                <span>0 archetypes visible</span>
                <button 
                  onClick={onResetAllTypes || onSelectAllTypes}
                  className="underline hover:text-amber-200 cursor-pointer font-semibold"
                >
                  Show All
                </button>
              </div>
            )}

            <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5 custom-scrollbar">
              {allNodeTypes.map((type) => {
                const info = TYPE_COLORS[type];
                const active = selectedTypes.has(type);
                const count = typeCounts[type] || 0;

                return (
                  <div
                    key={type}
                    className={`group/item w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl font-mono text-xs transition-all ${
                      active ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                    }`}
                  >
                    {/* Toggle button */}
                    <button
                      onClick={() => onToggleType(type)}
                      className="flex items-center gap-2 flex-1 text-left cursor-pointer min-w-0"
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                        style={{ 
                          backgroundColor: info.hex, 
                          boxShadow: active ? `0 0 8px ${info.hex}` : 'none',
                          opacity: active ? 1 : 0.4
                        }}
                      />
                      <span className="capitalize truncate">{info.label}</span>
                      {count > 0 && (
                        <span className="text-[10px] text-white/30 group-hover/item:text-white/60">
                          ({count})
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Isolate / Only button */}
                      {onSelectOnlyType && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOnlyType(type);
                          }}
                          title={`Show only ${info.label}`}
                          className="opacity-0 group-hover/item:opacity-100 hover:opacity-100 text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 hover:text-white transition-all cursor-pointer"
                        >
                          Only
                        </button>
                      )}

                      {/* Checkbox toggle status */}
                      <button
                        onClick={() => onToggleType(type)}
                        className="p-0.5 cursor-pointer text-white/60 hover:text-white"
                      >
                        {active ? (
                          <CheckSquare size={13} className="text-blue-400" />
                        ) : (
                          <Square size={13} className="text-white/20 hover:text-white/40" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Layout Mode Popover */}
      {layoutMenuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setLayoutMenuOpen(false)} />
          <div 
            id="layout-popover-menu"
            className="absolute bottom-full mb-3 p-2.5 w-56 rounded-2xl bg-[#09090b]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 animate-in fade-in slide-in-from-bottom-2 duration-150 font-mono text-xs"
          >
            <div className="px-2 py-1.5 text-[9px] font-mono uppercase tracking-widest text-white/40 border-b border-white/10 mb-1">
              3D Topology
            </div>
            {[
              { id: 'sphere', label: 'Spherical Core', icon: Globe },
              { id: 'force-cloud', label: 'Force Constellation', icon: Network },
              { id: 'cluster-type', label: 'Archetype Clusters', icon: Layers },
              { id: 'radial-orbital', label: 'Orbital Rings', icon: Orbit },
            ].map((item) => {
              const Icon = item.icon;
              const active = layoutMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeLayout(item.id as LayoutMode);
                    setLayoutMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    active ? 'bg-blue-500/15 text-blue-300 font-medium border border-blue-500/30' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className={active ? "text-blue-400" : "text-white/50"} />
                    <span>{item.label}</span>
                  </div>
                  {active && <Check size={12} className="text-blue-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Floating Toolbar Pill - Professional Polish Style */}
      <nav 
        id="floating-controls-toolbar"
        className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
      >
        {/* Search / Command trigger */}
        <button
          id="btn-search-trigger"
          onClick={onOpenSearch}
          title="Search Nodes (⌘K)"
          className="relative group p-3 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors cursor-pointer text-white/80 hover:text-white"
        >
          <Search size={18} />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[10px] font-mono text-white/90 px-2 py-0.5 rounded-md border border-white/10 pointer-events-none whitespace-nowrap">
            Search (⌘K)
          </span>
        </button>

        {/* Reset Camera */}
        <button
          id="btn-reset-camera"
          onClick={onResetCamera}
          title="Reset 3D Viewport"
          className="relative group p-3 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors cursor-pointer text-white/80 hover:text-white"
        >
          <RotateCcw size={18} />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[10px] font-mono text-white/90 px-2 py-0.5 rounded-md border border-white/10 pointer-events-none whitespace-nowrap">
            Reset Camera
          </span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-1" />

        {/* Filter by Type */}
        <button
          id="btn-filter-type"
          onClick={() => {
            setFilterOpen(!filterOpen);
            setLayoutMenuOpen(false);
          }}
          title={!isAllSelected ? `Filtered: ${selectedTypes.size}/${allNodeTypes.length} types` : "Filter Archetypes"}
          className={`relative group p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            filterOpen
              ? 'text-blue-400 bg-blue-500/20 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : !isAllSelected
              ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <Filter size={18} />
          {!isAllSelected && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-mono font-bold shadow-sm">
              {selectedTypes.size}
            </span>
          )}
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[10px] font-mono text-white/90 px-2 py-0.5 rounded-md border border-white/10 pointer-events-none whitespace-nowrap">
            {!isAllSelected ? `Filter: ${selectedTypes.size}/${allNodeTypes.length}` : 'Filter Types'}
          </span>
        </button>

        {/* Layout Modes */}
        <button
          id="btn-layout-mode"
          onClick={() => {
            setLayoutMenuOpen(!layoutMenuOpen);
            setFilterOpen(false);
          }}
          title="Switch 3D Topology"
          className={`relative group p-3 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            layoutMenuOpen ? 'text-blue-400 bg-white/10' : 'text-white/80 hover:text-white'
          }`}
        >
          <Layers size={18} />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[10px] font-mono text-white/90 px-2 py-0.5 rounded-md border border-white/10 pointer-events-none whitespace-nowrap">
            3D Topology
          </span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-1" />

        {/* Toggle Dependency Edges */}
        <button
          id="btn-toggle-edges"
          onClick={onToggleEdges}
          title={showEdges ? "Hide Dependency Lines" : "Show Dependency Lines"}
          className={`relative group p-3 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            showEdges ? 'text-white/80 hover:text-white' : 'text-white/30 hover:text-white/60'
          }`}
        >
          {showEdges ? <Eye size={18} /> : <EyeOff size={18} />}
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[10px] font-mono text-white/90 px-2 py-0.5 rounded-md border border-white/10 pointer-events-none whitespace-nowrap">
            {showEdges ? 'Hide Lines' : 'Show Lines'}
          </span>
        </button>

        {/* Toggle Auto Orbit */}
        <button
          id="btn-toggle-orbit"
          onClick={onToggleAutoRotate}
          title={autoRotate ? "Pause Orbit" : "Resume Auto-Orbit"}
          aria-label={autoRotate ? "Pause camera orbit" : "Start camera auto-orbit"}
          className={`relative group p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            autoRotate 
              ? 'text-blue-400 bg-blue-500/20 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]' 
              : 'text-white/40 hover:text-white hover:bg-white/10'
          }`}
        >
          <Orbit size={18} className={autoRotate ? "animate-spin [animation-duration:10s]" : ""} />
          {autoRotate && (
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          )}
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[10px] font-mono text-white/90 px-2 py-0.5 rounded-md border border-white/10 pointer-events-none whitespace-nowrap">
            {autoRotate ? 'Pause Orbit' : 'Auto Orbit'}
          </span>
        </button>
      </nav>
    </div>
  );
};
