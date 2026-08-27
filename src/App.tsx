import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GraphCanvas } from './components/GraphCanvas';
import { HUDHeader } from './components/HUDHeader';
import { FloatingControls } from './components/FloatingControls';
import { AIPanel } from './components/AIPanel';
import { SearchModal } from './components/SearchModal';
import { AddProjectModal } from './components/AddProjectModal';
import { CodeModal } from './components/CodeModal';
import { SAMPLE_REPOSITORIES, generateFullRepositoryGraph, TYPE_COLORS } from './data/repositories';
import { RepositoryData, GraphNode, LayoutMode, NodeType } from './types';

export default function App() {
  // Initialize repository with generated full AST node network
  const [repositories, setRepositories] = useState<RepositoryData[]>(() =>
    SAMPLE_REPOSITORIES.map(r => generateFullRepositoryGraph(r))
  );
  const [currentRepo, setCurrentRepo] = useState<RepositoryData>(repositories[0]);

  // Active interaction states
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [codeModalNode, setCodeModalNode] = useState<GraphNode | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force-cloud');
  const [autoRotate, setAutoRotate] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [resetCameraTrigger, setResetCameraTrigger] = useState(0);

  // Type filter states (default: all archetypes active)
  const [selectedTypes, setSelectedTypes] = useState<Set<NodeType>>(
    () => new Set(Object.keys(TYPE_COLORS) as NodeType[])
  );

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / Escape / Cmd+O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setAddProjectOpen(true);
      } else if (e.key === 'Escape') {
        if (isCodeModalOpen) {
          setIsCodeModalOpen(false);
        } else if (addProjectOpen) {
          setAddProjectOpen(false);
        } else if (searchOpen) {
          setSearchOpen(false);
        } else if (selectedNode) {
          setSelectedNode(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, selectedNode, addProjectOpen, isCodeModalOpen]);

  const handleSelectNode = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const handleOpenCodeModal = useCallback((node: GraphNode) => {
    setCodeModalNode(node);
    setIsCodeModalOpen(true);
  }, []);

  const handleDeselectNode = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleResetCamera = useCallback(() => {
    setSelectedNode(null);
    setResetCameraTrigger((prev) => prev + 1);
  }, []);

  const handleToggleType = useCallback((type: NodeType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleSelectOnlyType = useCallback((type: NodeType) => {
    setSelectedTypes(new Set([type]));
  }, []);

  const handleSelectAllTypes = useCallback(() => {
    const allTypes = Object.keys(TYPE_COLORS) as NodeType[];
    setSelectedTypes((prev) => {
      if (prev.size === allTypes.length) {
        return new Set();
      }
      return new Set(allTypes);
    });
  }, []);

  const handleResetAllTypes = useCallback(() => {
    const allTypes = Object.keys(TYPE_COLORS) as NodeType[];
    setSelectedTypes(new Set(allTypes));
  }, []);

  const handleSwitchRepository = useCallback((newRepo: RepositoryData) => {
    setCurrentRepo(newRepo);
    setSelectedNode(null);
    setResetCameraTrigger((prev) => prev + 1);
  }, []);

  const handleAddProject = useCallback((newRepo: RepositoryData) => {
    setRepositories((prev) => [newRepo, ...prev.filter(r => r.id !== newRepo.id)]);
    setCurrentRepo(newRepo);
    setSelectedNode(null);
    setResetCameraTrigger((prev) => prev + 1);
    // Ensure all node types are enabled for the newly imported project
    setSelectedTypes(new Set(Object.keys(TYPE_COLORS) as NodeType[]));
  }, []);

  // Compute visible node count according to filter
  const visibleNodesCount = useMemo(() => {
    return currentRepo.nodes.filter((node) => selectedTypes.has(node.type)).length;
  }, [currentRepo.nodes, selectedTypes]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#09090b] text-[#e4e4e7] select-none font-sans">
      {/* 1. Full-Screen WebGL Canvas (Layer 0) */}
      <GraphCanvas
        nodes={currentRepo.nodes}
        edges={currentRepo.edges}
        selectedNode={selectedNode}
        onSelectNode={handleSelectNode}
        onDeselectNode={handleDeselectNode}
        onShowCode={handleOpenCodeModal}
        selectedTypes={selectedTypes}
        layoutMode={layoutMode}
        autoRotate={autoRotate}
        showEdges={showEdges}
        resetTrigger={resetCameraTrigger}
      />

      {/* 2. System Labels / Coordinates Flourish */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col gap-8 opacity-20 pointer-events-none z-10 select-none">
        <div className="[writing-mode:vertical-rl] text-[9px] font-mono uppercase tracking-[0.3em] text-white">
          RPT-772_NODE_CLUSTER
        </div>
        <div className="[writing-mode:vertical-rl] text-[9px] font-mono uppercase tracking-[0.3em] text-white">
          COORD_X_0912
        </div>
      </div>

      {/* 3. Floating Heads-Up Display (Layer 10) */}
      <HUDHeader
        currentRepo={currentRepo}
        repositories={repositories}
        onSelectRepo={handleSwitchRepository}
        onOpenAddProject={() => setAddProjectOpen(true)}
        nodeCount={visibleNodesCount}
        totalNodeCount={currentRepo.nodeCount}
        statusText="Scan Complete"
      />

      {/* 4. Floating Bottom Controls Toolbar (Layer 10) */}
      <FloatingControls
        onOpenSearch={() => setSearchOpen(true)}
        onResetCamera={handleResetCamera}
        nodes={currentRepo.nodes}
        selectedTypes={selectedTypes}
        onToggleType={handleToggleType}
        onSelectOnlyType={handleSelectOnlyType}
        onSelectAllTypes={handleSelectAllTypes}
        onResetAllTypes={handleResetAllTypes}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((prev) => !prev)}
        showEdges={showEdges}
        onToggleEdges={() => setShowEdges((prev) => !prev)}
      />

      {/* 5. Sliding Glass AI Terminal Panel (Layer 10 - slides in when node selected) */}
      {selectedNode && (
        <AIPanel
          node={selectedNode}
          allNodes={currentRepo.nodes}
          repoName={currentRepo.name}
          onClose={handleDeselectNode}
          onSelectNode={handleSelectNode}
          onOpenCodeModal={handleOpenCodeModal}
        />
      )}

      {/* 6. Command Search Palette Modal (Layer 50) */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        nodes={currentRepo.nodes}
        onSelectNode={handleSelectNode}
      />

      {/* 7. Add Project Folder / Import Modal (Layer 50) */}
      <AddProjectModal
        isOpen={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        onAddProject={handleAddProject}
      />

      {/* 8. Dedicated IDE Source Code Viewer Modal (Layer 50) */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        node={codeModalNode}
      />
    </main>
  );
}
