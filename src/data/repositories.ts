import { RepositoryData, GraphNode, GraphEdge, NodeType } from '../types';

export const TYPE_COLORS: Record<NodeType, { hex: string; rgb: [number, number, number]; glow: string; label: string }> = {
  component: { hex: '#38bdf8', rgb: [56, 189, 248], glow: 'rgba(56, 189, 248, 0.6)', label: 'Component' },
  hook: { hex: '#a855f7', rgb: [168, 85, 247], glow: 'rgba(168, 85, 247, 0.6)', label: 'Hook' },
  api: { hex: '#10b981', rgb: [16, 185, 129], glow: 'rgba(16, 185, 129, 0.6)', label: 'API Route' },
  state: { hex: '#f59e0b', rgb: [245, 158, 11], glow: 'rgba(245, 158, 11, 0.6)', label: 'State / Store' },
  util: { hex: '#06b6d4', rgb: [6, 182, 212], glow: 'rgba(6, 182, 212, 0.6)', label: 'Utility' },
  style: { hex: '#ec4899', rgb: [236, 72, 153], glow: 'rgba(236, 72, 153, 0.6)', label: 'Style / Theme' },
  config: { hex: '#94a3b8', rgb: [148, 163, 184], glow: 'rgba(148, 163, 184, 0.5)', label: 'Config' },
  test: { hex: '#6366f1', rgb: [99, 102, 241], glow: 'rgba(99, 102, 241, 0.6)', label: 'Test Suite' },
};

export const SAMPLE_REPOSITORIES: RepositoryData[] = [
  {
    id: 'repo-linear-core',
    name: 'linear/client-web',
    owner: 'linear',
    branch: 'main',
    commit: '7f9c2d1',
    stars: 34200,
    language: 'TypeScript',
    nodeCount: 342,
    edgeCount: 684,
    status: 'Complete',
    timestamp: '2 min ago',
    nodes: [
      {
        id: 'src/components/HUDHeader.tsx',
        name: 'HUDHeader.tsx',
        path: 'src/components/HUDHeader.tsx',
        type: 'component',
        extension: 'tsx',
        sizeBytes: 3420,
        metrics: { loc: 94, complexity: 3, maintainability: 92, importsCount: 4, exportsCount: 1, depth: 2 },
        dependencies: ['src/hooks/useRepoStatus.ts', 'src/types.ts', 'src/styles/glass.css'],
        exports: ['HUDHeader', 'default'],
        summary: 'Pill-shaped glassmorphic heads-up display rendering active repository telemetry, live node count, branch index status, and pulse indicators.',
        codePreview: `import React, { useState, useEffect } from 'react';
import { GitBranch, Box, Activity, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { useRepoStatus } from '../hooks/useRepoStatus';
import { RepositoryData } from '../types';

interface HUDHeaderProps {
  currentRepo: RepositoryData;
  allRepos: RepositoryData[];
  onSelectRepo: (repo: RepositoryData) => void;
  onOpenSearch: () => void;
  onOpenAddProject: () => void;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  currentRepo,
  allRepos,
  onSelectRepo,
  onOpenSearch,
  onOpenAddProject,
}) => {
  const { isLive, latency, workerQueue } = useRepoStatus();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('#repo-selector-dropdown')) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [dropdownOpen]);

  return (
    <header className="fixed top-6 left-6 z-30 flex items-center gap-3 font-mono">
      {/* Main Glass HUD Pill */}
      <div className="relative" id="repo-selector-dropdown">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-white hover:border-white/20 transition-all cursor-pointer group"
          aria-expanded={dropdownOpen}
        >
          {/* Live Status Pulse */}
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                {currentRepo.name}
              </span>
              <ChevronDown size={13} className="text-white/40 group-hover:text-white transition-colors" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/50">
              <span className="flex items-center gap-1">
                <GitBranch size={10} className="text-blue-400" />
                {currentRepo.branch}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Box size={10} className="text-amber-400" />
                {currentRepo.nodeCount} nodes
              </span>
            </div>
          </div>
        </button>

        {/* Repositories Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 p-1.5 rounded-2xl bg-[#0e0f14]/95 backdrop-blur-2xl border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.8)] z-40 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-white/40 border-b border-white/10 mb-1">
              Switch Codebase
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {allRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => {
                    onSelectRepo(repo);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-xs text-white/80 hover:text-white cursor-pointer"
                >
                  <div className="truncate">
                    <div className="font-semibold truncate">{repo.name}</div>
                    <div className="text-[10px] text-white/40">{repo.language} • {repo.nodeCount} nodes</div>
                  </div>
                  {repo.id === currentRepo.id && <Check size={14} className="text-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
            <div className="pt-1.5 mt-1 border-t border-white/10">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenAddProject();
                }}
                className="w-full py-2 px-3 text-center text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
              >
                + Connect New Repository
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Telemetry Status Capsule */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/40 backdrop-blur-lg border border-white/5 text-[11px] text-white/50">
        <Activity size={12} className="text-emerald-400" />
        <span>{latency}ms</span>
        <span>•</span>
        <span className="text-white/40">Queue: {workerQueue}</span>
      </div>
    </header>
  );
};

export default HUDHeader;`
      },
      {
        id: 'src/components/GraphCanvas.tsx',
        name: 'GraphCanvas.tsx',
        path: 'src/components/GraphCanvas.tsx',
        type: 'component',
        extension: 'tsx',
        sizeBytes: 12450,
        metrics: { loc: 310, complexity: 8, maintainability: 84, importsCount: 8, exportsCount: 1, depth: 1 },
        dependencies: ['src/components/HUDHeader.tsx', 'src/store/graphStore.ts', 'src/utils/math3d.ts', 'src/hooks/useRaycaster.ts'],
        exports: ['GraphCanvas', 'default'],
        summary: 'Core WebGL Three.js canvas managing 3D starfield particles, force-directed node physics, glowing point lights, and smooth camera bezier transitions.',
        codePreview: `import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GraphNode, GraphEdge, LayoutMode, NodeType } from '../types';
import { TYPE_COLORS } from '../data/repositories';
import { applyLayoutPositions } from '../utils/graphLayouts';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode) => void;
  onDeselectNode: () => void;
  selectedTypes: Set<NodeType>;
  layoutMode: LayoutMode;
  autoRotate: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  onDeselectNode,
  selectedTypes,
  layoutMode,
  autoRotate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Instanced Meshes & Raycaster References
  const nodeMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const linesGroupRef = useRef<THREE.Group | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);

  // Position layout computation
  const positionedNodes = useMemo(() => {
    return applyLayoutPositions(nodes, layoutMode);
  }, [nodes, layoutMode]);

  // Three.js Lifecycle Initialization
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040508, 0.0018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 3000);
    camera.position.set(0, 80, 260);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 1200;
    controls.minDistance = 30;
    controlsRef.current = controls;

    // Ambient and Point Lights for Depth
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x60a5fa, 1.5);
    dirLight.position.set(100, 200, 150);
    scene.add(dirLight);

    // Particle Background Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1200;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starCoords[i] = (Math.random() - 0.5) * 1600;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0x4f6b94, size: 1.8, transparent: true, opacity: 0.4 });
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // Continuous Animation Frame Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotate && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 0.6;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#06070a]">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default GraphCanvas;`
      },
      {
        id: 'src/components/FloatingControls.tsx',
        name: 'FloatingControls.tsx',
        path: 'src/components/FloatingControls.tsx',
        type: 'component',
        extension: 'tsx',
        sizeBytes: 4210,
        metrics: { loc: 118, complexity: 4, maintainability: 90, importsCount: 5, exportsCount: 1, depth: 2 },
        dependencies: ['src/store/graphStore.ts', 'src/types.ts'],
        exports: ['FloatingControls', 'default'],
        summary: 'Minimal floating glass bottom toolbar exposing camera reset, node filtering by archetype, search overlay trigger, and orbital layout toggles.',
        codePreview: `import React, { useState } from 'react';
import { Search, RotateCcw, Orbit, Layers, Sparkles, Filter, Sliders, Play, Pause } from 'lucide-react';
import { LayoutMode, NodeType } from '../types';
import { TYPE_COLORS } from '../data/repositories';

interface FloatingControlsProps {
  onOpenSearch: () => void;
  onResetCamera: () => void;
  layoutMode: LayoutMode;
  onChangeLayout: (mode: LayoutMode) => void;
  selectedTypes: Set<NodeType>;
  onToggleType: (type: NodeType) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  onOpenSearch,
  onResetCamera,
  layoutMode,
  onChangeLayout,
  selectedTypes,
  onToggleType,
  autoRotate,
  onToggleAutoRotate,
}) => {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);

  const layoutOptions: { mode: LayoutMode; label: string; desc: string }[] = [
    { mode: 'force-cloud', label: 'Cosmic Cloud', desc: 'Barnes-Hut 3D force equilibrium' },
    { mode: 'spherical-orbit', label: 'Fibonacci Sphere', desc: 'Golden-ratio spherical distribution' },
    { mode: 'hierarchical-tree', label: 'Layered Tree', desc: 'AST dependency hierarchy' },
    { mode: 'circular-radial', label: 'Radial Ring', desc: 'Concentric module rings' },
    { mode: 'matrix-grid', label: 'Bento Grid', desc: 'Structured orthographic planar array' }
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-2 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)] font-mono">
      {/* Global Command Palette Trigger */}
      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all cursor-pointer"
        title="Search symbols (⌘K)"
      >
        <Search size={14} className="text-blue-400" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/50">⌘K</kbd>
      </button>

      {/* Auto-Rotation Orbit Toggle */}
      <button
        onClick={onToggleAutoRotate}
        className={\`p-2 rounded-xl border transition-all cursor-pointer \${
          autoRotate 
            ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' 
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
        }\`}
        title={autoRotate ? 'Pause 3D Orbit' : 'Auto-Rotate Camera'}
      >
        {autoRotate ? <Pause size={15} /> : <Play size={15} />}
      </button>

      {/* Camera Reset */}
      <button
        onClick={onResetCamera}
        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
        title="Reset Camera Viewport"
      >
        <RotateCcw size={15} />
      </button>

      <div className="w-[1px] h-5 bg-white/10 mx-0.5" />

      {/* Archetype Filter Button */}
      <button
        onClick={() => {
          setFilterMenuOpen((prev) => !prev);
          setLayoutMenuOpen(false);
        }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all cursor-pointer"
      >
        <Filter size={14} className="text-purple-400" />
        <span className="hidden sm:inline">Filters</span>
        <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
          {selectedTypes.size}
        </span>
      </button>

      {/* Layout Mode Switcher */}
      <button
        onClick={() => {
          setLayoutMenuOpen((prev) => !prev);
          setFilterMenuOpen(false);
        }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all cursor-pointer"
      >
        <Orbit size={14} className="text-emerald-400" />
        <span className="hidden md:inline">Layout</span>
      </button>
    </nav>
  );
};

export default FloatingControls;`
      },
      {
        id: 'src/components/AIPanel.tsx',
        name: 'AIPanel.tsx',
        path: 'src/components/AIPanel.tsx',
        type: 'component',
        extension: 'tsx',
        sizeBytes: 8900,
        metrics: { loc: 240, complexity: 6, maintainability: 88, importsCount: 7, exportsCount: 1, depth: 2 },
        dependencies: ['src/api/geminiClient.ts', 'src/store/graphStore.ts', 'src/types.ts', 'src/components/CodeViewer.tsx'],
        exports: ['AIPanel', 'default'],
        summary: 'Glass terminal sliding drawer providing architectural code synthesis, cyclomatic metrics breakdown, and real-time neural Q&A inspection.',
        codePreview: `import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Terminal, Copy, Check, X, ShieldAlert, Cpu, ArrowRight, CornerDownLeft, FileCode2 } from 'lucide-react';
import { GraphNode } from '../types';
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
  onOpenCodeModal,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'code' | 'chat'>('summary');
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: \`Analyzing \${node.name}. Ask anything regarding its complexity, refactoring paths, or dependencies.\`
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputVal.trim() || isLoading) return;
    const userPrompt = inputVal;
    setInputVal('');
    setMessages((prev) => [...prev, { role: 'user', text: userPrompt }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node, repoName, message: userPrompt })
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply || 'AST analysis generated.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Telemetry analysis generated for node ' + node.name }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside 
      id="ai-panel-glass" 
      className="fixed top-6 right-6 bottom-6 w-[420px] max-w-[calc(100vw-3rem)] z-30 flex flex-col bg-[#0b0c10]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden font-mono"
    >
      {/* Panel Header with Full Code Action */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-[10px] text-blue-400 uppercase tracking-widest">Entity Intelligence</span>
          <h2 className="text-sm font-semibold text-white truncate">{node.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-header-show-code"
            onClick={() => onOpenCodeModal && onOpenCodeModal(node)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-[11px] text-blue-300 hover:text-white transition-all cursor-pointer"
          >
            <FileCode2 size={13} />
            <span>Show Code</span>
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Analysis Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px] text-white/50">
            <span>{node.path}</span>
            <span>{node.metrics.loc} LOC</span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">{node.summary}</p>
        </div>
      </div>
    </aside>
  );
};

export default AIPanel;`
      },
      {
        id: 'src/hooks/useRepoStatus.ts',
        name: 'useRepoStatus.ts',
        path: 'src/hooks/useRepoStatus.ts',
        type: 'hook',
        extension: 'ts',
        sizeBytes: 1980,
        metrics: { loc: 56, complexity: 2, maintainability: 96, importsCount: 2, exportsCount: 1, depth: 3 },
        dependencies: ['src/types.ts'],
        exports: ['useRepoStatus'],
        summary: 'Telemetry hook monitoring WebSocket heartbeat, worker parse queue depth, and memory consumption.',
        codePreview: `import { useState, useEffect, useRef } from 'react';

export interface RepoTelemetryStatus {
  isLive: boolean;
  latency: number;
  workerQueue: number;
  memoryUsageMb: number;
  fps: number;
  lastIndexedCommit: string;
}

/**
 * Custom React hook for streaming real-time AST parser telemetry
 * and background WebWorker indexing queue progress.
 */
export function useRepoStatus(): RepoTelemetryStatus {
  const [telemetry, setTelemetry] = useState<RepoTelemetryStatus>({
    isLive: true,
    latency: 14,
    workerQueue: 0,
    memoryUsageMb: 42.8,
    fps: 60,
    lastIndexedCommit: '7f9c2d1',
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    // 1. Simulating reactive WebSocket heartbeat and worker pool telemetry
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        latency: Math.max(8, 12 + Math.floor(Math.sin(Date.now() / 1000) * 6)),
        memoryUsageMb: +(42.5 + (Math.random() * 1.8)).toFixed(1),
        workerQueue: Math.random() > 0.85 ? Math.floor(Math.random() * 3) : 0,
      }));
    }, 2500);

    // 2. High-precision WebGL FPS counter
    let animId: number;
    const calculateFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        const measuredFps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        setTelemetry((prev) => ({ ...prev, fps: Math.min(60, measuredFps) }));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      animId = requestAnimationFrame(calculateFps);
    };
    animId = requestAnimationFrame(calculateFps);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animId);
    };
  }, []);

  return telemetry;
}`
      },
      {
        id: 'src/hooks/useRaycaster.ts',
        name: 'useRaycaster.ts',
        path: 'src/hooks/useRaycaster.ts',
        type: 'hook',
        extension: 'ts',
        sizeBytes: 2840,
        metrics: { loc: 78, complexity: 5, maintainability: 89, importsCount: 3, exportsCount: 1, depth: 2 },
        dependencies: ['src/types.ts', 'src/utils/math3d.ts'],
        exports: ['useRaycaster'],
        summary: 'GPU-accelerated mouse cursor raycasting hook with bounding-sphere optimizations and hover debouncing.',
        codePreview: `import { useMemo, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GraphNode } from '../types';

/**
 * High-performance GPU raycaster hook for 3D star node picking.
 * Uses spatial bounding hierarchy and sub-pixel hover thresholds.
 */
export function useRaycaster(
  camera: THREE.Camera | null,
  scene: THREE.Scene | null,
  nodes: GraphNode[]
) {
  const raycaster = useMemo(() => {
    const rc = new THREE.Raycaster();
    rc.params.Points = { threshold: 4.5 };
    rc.params.Line = { threshold: 2.0 };
    return rc;
  }, []);

  const mousePosition = useRef(new THREE.Vector2(-1000, -1000));

  const updatePointer = useCallback((event: MouseEvent, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    mousePosition.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mousePosition.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }, []);

  const getIntersectedNode = useCallback(
    (mesh: THREE.InstancedMesh | null): { node: GraphNode | null; instanceId: number | null } => {
      if (!camera || !mesh) return { node: null, instanceId: null };

      raycaster.setFromCamera(mousePosition.current, camera);
      const intersections = raycaster.intersectObject(mesh);

      if (intersections.length > 0 && intersections[0].instanceId !== undefined) {
        const idx = intersections[0].instanceId;
        return { node: nodes[idx] || null, instanceId: idx };
      }

      return { node: null, instanceId: null };
    },
    [camera, nodes, raycaster]
  );

  return {
    raycaster,
    mousePosition,
    updatePointer,
    getIntersectedNode,
  };
}`
      },
      {
        id: 'src/store/graphStore.ts',
        name: 'graphStore.ts',
        path: 'src/store/graphStore.ts',
        type: 'state',
        extension: 'ts',
        sizeBytes: 5400,
        metrics: { loc: 142, complexity: 4, maintainability: 94, importsCount: 2, exportsCount: 1, depth: 3 },
        dependencies: ['src/types.ts'],
        exports: ['useGraphStore'],
        summary: 'Global state manager for active node selection, filter states, camera positions, layout algorithms, and search indices.',
        codePreview: `import { create } from 'zustand';
import { RepositoryData, GraphNode, GraphEdge, LayoutMode, NodeType } from '../types';
import { SAMPLE_REPOSITORIES } from '../data/repositories';

interface GraphState {
  // Active Repository State
  activeRepo: RepositoryData;
  allRepos: RepositoryData[];
  
  // Selection & Hover State
  selectedNode: GraphNode | null;
  hoveredNode: GraphNode | null;
  selectedEdge: GraphEdge | null;

  // Viewport & Layout Config
  layoutMode: LayoutMode;
  autoRotate: boolean;
  selectedTypes: Set<NodeType>;
  
  // UI Dialog Controls
  isSearchOpen: boolean;
  isAddProjectOpen: boolean;
  isCodeModalOpen: boolean;

  // Actions & Mutations
  setActiveRepo: (repo: RepositoryData) => void;
  selectNode: (node: GraphNode | null) => void;
  setHoveredNode: (node: GraphNode | null) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleAutoRotate: () => void;
  toggleTypeFilter: (type: NodeType) => void;
  setSearchOpen: (open: boolean) => void;
  setAddProjectOpen: (open: boolean) => void;
  setCodeModalOpen: (open: boolean) => void;
  resetFilters: () => void;
}

const ALL_NODE_TYPES: NodeType[] = [
  'component', 'hook', 'api', 'state', 'util', 'style', 'config', 'test'
];

export const useGraphStore = create<GraphState>((set, get) => ({
  activeRepo: SAMPLE_REPOSITORIES[0],
  allRepos: SAMPLE_REPOSITORIES,
  selectedNode: null,
  hoveredNode: null,
  selectedEdge: null,
  layoutMode: 'force-cloud',
  autoRotate: false,
  selectedTypes: new Set(ALL_NODE_TYPES),
  isSearchOpen: false,
  isAddProjectOpen: false,
  isCodeModalOpen: false,

  setActiveRepo: (repo) => set({ activeRepo: repo, selectedNode: null, hoveredNode: null }),
  selectNode: (node) => set({ selectedNode: node }),
  setHoveredNode: (node) => set({ hoveredNode: node }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  
  toggleTypeFilter: (type) =>
    set((state) => {
      const next = new Set(state.selectedTypes);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return { selectedTypes: next };
    }),

  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setAddProjectOpen: (open) => set({ isAddProjectOpen: open }),
  setCodeModalOpen: (open) => set({ isCodeModalOpen: open }),
  resetFilters: () => set({ selectedTypes: new Set(ALL_NODE_TYPES) }),
}));`
      },
      {
        id: 'src/api/geminiClient.ts',
        name: 'geminiClient.ts',
        path: 'src/api/geminiClient.ts',
        type: 'api',
        extension: 'ts',
        sizeBytes: 3120,
        metrics: { loc: 88, complexity: 3, maintainability: 95, importsCount: 1, exportsCount: 2, depth: 3 },
        dependencies: ['src/types.ts'],
        exports: ['analyzeCodeNode', 'askNodeQuestion'],
        summary: 'Client proxy invoking backend Gemini API endpoints for deep semantic code summaries and conversational reasoning.',
        codePreview: `import { GraphNode } from '../types';

export interface AnalysisResponse {
  summary: string;
  thinking?: string;
}

export interface ChatResponse {
  reply: string;
  thinking?: string;
}

/**
 * Sends a structured AST node payload to the backend Gemini AI engine.
 * Receives deep code intelligence, architectural insights, and complexity metrics.
 */
export async function analyzeCodeNode(node: GraphNode, repoName: string): Promise<AnalysisResponse> {
  try {
    const res = await fetch('/api/gemini/analyze-node', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node, repoName }),
    });

    if (!res.ok) {
      throw new Error(\`Analysis server returned status \${res.status}\`);
    }

    return await res.json();
  } catch (error) {
    console.warn('Backend AI analysis unavailable, using local AST fallback:', error);
    return {
      summary: \`[AST Analysis] \${node.name} (\${node.type}) handles \${node.metrics.loc} lines with \${node.dependencies.length} direct dependencies.\`,
      thinking: 'Local AST engine generated fallback summary.',
    };
  }
}

/**
 * Sends a conversational query about a specific node to the AI Code Copilot.
 */
export async function askNodeQuestion(
  node: GraphNode,
  repoName: string,
  message: string,
  highThinking = false
): Promise<ChatResponse> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node, repoName, message, highThinking }),
    });

    if (!res.ok) {
      throw new Error(\`Chat server returned status \${res.status}\`);
    }

    return await res.json();
  } catch (error) {
    return {
      reply: \`Direct telemetry for \${node.name}: Cyclomatic complexity is \${node.metrics.complexity}/10. Maintainability index is \${node.metrics.maintainability}%.\`,
      thinking: 'Local fallback response engaged.',
    };
  }
}`
      },
      {
        id: 'src/utils/math3d.ts',
        name: 'math3d.ts',
        path: 'src/utils/math3d.ts',
        type: 'util',
        extension: 'ts',
        sizeBytes: 4100,
        metrics: { loc: 110, complexity: 5, maintainability: 91, importsCount: 1, exportsCount: 5, depth: 4 },
        dependencies: ['src/types.ts'],
        exports: ['calculateForceLayout', 'sphereLayout', 'orbitalLayout', 'dampenVelocity', 'screenToWorld'],
        summary: 'High-performance 3D vector math, Barnes-Hut repulsion calculations, and golden-spiral spherical coordinate generators.',
        codePreview: `import { GraphNode } from '../types';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Distributes nodes evenly along a 3D unit sphere using the Fibonacci Golden Spiral.
 */
export function sphereLayout(nodes: GraphNode[], radius = 180): void {
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle ~2.3999 rad

  nodes.forEach((node, i) => {
    const y = 1 - (i / Math.max(1, nodes.length - 1)) * 2; // Range: 1 to -1
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;

    node.x = Math.cos(theta) * radiusAtY * radius;
    node.y = y * radius;
    node.z = Math.sin(theta) * radiusAtY * radius;
  });
}

/**
 * Arranges nodes into layered concentric orbital rings grouped by module archetype.
 */
export function orbitalLayout(nodes: GraphNode[], baseRadius = 60, step = 45): void {
  const groups: Record<string, GraphNode[]> = {};
  nodes.forEach((n) => {
    if (!groups[n.type]) groups[n.type] = [];
    groups[n.type].push(n);
  });

  let ringIndex = 0;
  Object.keys(groups).forEach((typeKey) => {
    const ringNodes = groups[typeKey];
    const ringRadius = baseRadius + ringIndex * step;
    const ringAngleStep = (Math.PI * 2) / ringNodes.length;

    ringNodes.forEach((node, idx) => {
      const angle = idx * ringAngleStep;
      node.x = Math.cos(angle) * ringRadius;
      node.y = (Math.sin(angle * 2) * ringRadius * 0.25);
      node.z = Math.sin(angle) * ringRadius;
    });

    ringIndex++;
  });
}

/**
 * Calculates Euclidean distance between two 3D vectors.
 */
export function distance3D(v1: Vector3D, v2: Vector3D): number {
  const dx = v1.x - v2.x;
  const dy = v1.y - v2.y;
  const dz = v1.z - v2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}`
      },
      {
        id: 'src/utils/astParser.ts',
        name: 'astParser.ts',
        path: 'src/utils/astParser.ts',
        type: 'util',
        extension: 'ts',
        sizeBytes: 6800,
        metrics: { loc: 195, complexity: 7, maintainability: 86, importsCount: 3, exportsCount: 2, depth: 3 },
        dependencies: ['src/types.ts'],
        exports: ['extractImportsAndExports', 'calculateCyclomaticComplexity'],
        summary: 'TypeScript AST scanner computing cyclomatic complexity score, dependency edges, and exported symbol contracts.',
        codePreview: `export interface ParsedASTMetadata {
  imports: string[];
  exports: string[];
  cyclomaticComplexity: number;
  loc: number;
  hasJSX: boolean;
}

/**
 * Lightweight browser-safe AST regular-expression scanner
 * extracting dependency links and structural metrics.
 */
export function parseSourceCodeAST(code: string): ParsedASTMetadata {
  const lines = code.split('\\n');
  const loc = lines.filter((l) => l.trim().length > 0).length;

  // 1. Extract import statements
  const importRegex = /import(?:\\s+.*\\s+from)?\\s+['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let importMatch;
  while ((importMatch = importRegex.exec(code)) !== null) {
    imports.push(importMatch[1]);
  }

  // 2. Extract export symbols
  const exportRegex = /export\\s+(?:const|function|class|interface|type|default)\\s+([a-zA-Z0-9_$]+)/g;
  const exports: string[] = [];
  let exportMatch;
  while ((exportMatch = exportRegex.exec(code)) !== null) {
    exports.push(exportMatch[1]);
  }

  // 3. Compute Cyclomatic Complexity
  const decisionKeywords = ['if', 'else', 'for', 'while', 'case', 'catch', '&&', '||', '?'];
  let complexity = 1;
  for (const kw of decisionKeywords) {
    const regex = new RegExp(\`\\\\b\${kw}\\\\b\`, 'g');
    const matches = code.match(regex);
    if (matches) complexity += matches.length;
  }

  return {
    imports,
    exports,
    cyclomaticComplexity: Math.min(10, complexity),
    loc,
    hasJSX: code.includes('<') && code.includes('/>'),
  };
}`
      },
      {
        id: 'src/styles/glass.css',
        name: 'glass.css',
        path: 'src/styles/glass.css',
        type: 'style',
        extension: 'css',
        sizeBytes: 1540,
        metrics: { loc: 48, complexity: 1, maintainability: 98, importsCount: 0, exportsCount: 0, depth: 4 },
        dependencies: [],
        exports: [],
        summary: 'Micro-border glassmorphism tokens, specular blur matrices, and dark slate contrast scales.',
        codePreview: `/* ==========================================================================
   Glassmorphism HUD Tokens & Cyberpunk Theme Primitives
   ========================================================================== */

:root {
  --glass-bg: rgba(12, 14, 20, 0.75);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-glow: rgba(56, 189, 248, 0.25);
  --glass-blur: 24px;
}

.glass-panel {
  background-color: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.glass-pill {
  background-color: rgba(6, 8, 12, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

/* Custom Scrollbar for IDE Code Views */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}`
      },
      {
        id: 'tsconfig.json',
        name: 'tsconfig.json',
        path: 'tsconfig.json',
        type: 'config',
        extension: 'json',
        sizeBytes: 890,
        metrics: { loc: 32, complexity: 1, maintainability: 100, importsCount: 0, exportsCount: 0, depth: 5 },
        dependencies: [],
        exports: [],
        summary: 'Strict TypeScript compiler configuration with ES2022 target and path aliases.',
        codePreview: `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "server.ts"]
}`
      },
      {
        id: 'src/tests/graph.test.ts',
        name: 'graph.test.ts',
        path: 'src/tests/graph.test.ts',
        type: 'test',
        extension: 'ts',
        sizeBytes: 2400,
        metrics: { loc: 72, complexity: 2, maintainability: 97, importsCount: 2, exportsCount: 0, depth: 3 },
        dependencies: ['src/utils/math3d.ts'],
        exports: [],
        summary: 'Unit test suite verifying 3D sphere layout uniformity, force damping, and collision resolution.',
        codePreview: `import { describe, it, expect } from 'vitest';
import { sphereLayout, orbitalLayout, distance3D } from '../utils/math3d';
import { GraphNode } from '../types';

describe('math3d Layout & Vector Engine', () => {
  const createMockNodes = (count: number): GraphNode[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: \`node-\${i}\`,
      name: \`Node\${i}.tsx\`,
      path: \`src/node\${i}.tsx\`,
      type: 'component',
      extension: 'tsx',
      sizeBytes: 1024,
      metrics: { loc: 40, complexity: 2, maintainability: 90, importsCount: 1, exportsCount: 1, depth: 2 },
      dependencies: [],
      exports: ['default'],
      summary: 'Mock test node',
      codePreview: 'export const Mock = () => null;'
    }));
  };

  it('generates spherical coordinates with uniform radii', () => {
    const nodes = createMockNodes(40);
    const radius = 150;
    sphereLayout(nodes, radius);

    nodes.forEach((node) => {
      expect(node.x).toBeDefined();
      expect(node.y).toBeDefined();
      expect(node.z).toBeDefined();

      const dist = distance3D({ x: node.x!, y: node.y!, z: node.z! }, { x: 0, y: 0, z: 0 });
      expect(Math.abs(dist - radius)).toBeLessThan(1.0);
    });
  });

  it('distributes nodes along orbital plane rings', () => {
    const nodes = createMockNodes(20);
    orbitalLayout(nodes, 100, 50);

    nodes.forEach((node) => {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.z)).toBe(true);
    });
  });
});`
      }
    ],
    edges: [
      { id: 'e1', source: 'src/components/GraphCanvas.tsx', target: 'src/components/HUDHeader.tsx', type: 'import', weight: 1 },
      { id: 'e2', source: 'src/components/GraphCanvas.tsx', target: 'src/store/graphStore.ts', type: 'import', weight: 3 },
      { id: 'e3', source: 'src/components/GraphCanvas.tsx', target: 'src/utils/math3d.ts', type: 'import', weight: 2 },
      { id: 'e4', source: 'src/components/GraphCanvas.tsx', target: 'src/hooks/useRaycaster.ts', type: 'import', weight: 2 },
      { id: 'e5', source: 'src/components/HUDHeader.tsx', target: 'src/hooks/useRepoStatus.ts', type: 'import', weight: 1 },
      { id: 'e6', source: 'src/components/FloatingControls.tsx', target: 'src/store/graphStore.ts', type: 'import', weight: 2 },
      { id: 'e7', source: 'src/components/AIPanel.tsx', target: 'src/api/geminiClient.ts', type: 'import', weight: 3 },
      { id: 'e8', source: 'src/components/AIPanel.tsx', target: 'src/store/graphStore.ts', type: 'import', weight: 2 },
      { id: 'e9', source: 'src/hooks/useRaycaster.ts', target: 'src/utils/math3d.ts', type: 'import', weight: 1 },
      { id: 'e10', source: 'src/tests/graph.test.ts', target: 'src/utils/math3d.ts', type: 'import', weight: 1 },
    ]
  },
  {
    id: 'repo-vercel-nextjs',
    name: 'vercel/next.js',
    owner: 'vercel',
    branch: 'canary',
    commit: '9c4b18e',
    stars: 121000,
    language: 'TypeScript',
    nodeCount: 1420,
    edgeCount: 3840,
    status: 'Complete',
    timestamp: 'Just now',
    nodes: [],
    edges: []
  },
  {
    id: 'repo-astral-uv',
    name: 'astral-sh/uv',
    owner: 'astral-sh',
    branch: 'main',
    commit: '4e1a8f0',
    stars: 48900,
    language: 'Rust / TypeScript',
    nodeCount: 528,
    edgeCount: 1190,
    status: 'Complete',
    timestamp: '10 min ago',
    nodes: [],
    edges: []
  }
];

// Helper to generate comprehensive, full, realistic source code for any module
function generateFullSourceCodeForNode(name: string, path: string, type: NodeType, repoName: string, loc: number, complexity: number): string {
  const componentName = name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '');

  if (type === 'component') {
    return `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Layers, Activity, AlertCircle, ArrowRight } from 'lucide-react';

export interface ${componentName}Props {
  id?: string;
  title?: string;
  isActive?: boolean;
  onAction?: (payload: { timestamp: number; value: string }) => void;
  className?: string;
}

/**
 * ${componentName} - Core UI Component for ${repoName}
 * Implements high-performance reactive rendering with optimized memoization.
 *
 * @complexity ${complexity}/10
 * @loc ${loc}
 */
export const ${componentName}: React.FC<${componentName}Props> = ({
  id = '${path}',
  title = '${name}',
  isActive = true,
  onAction,
  className = '',
}) => {
  const [dataCount, setDataCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ id: string; time: number }>>([]);

  // Compute derived state with memoization
  const metrics = useMemo(() => {
    return {
      throughput: (dataCount * 1.42).toFixed(1),
      loadFactor: Math.min(100, Math.round(dataCount * 3.5)),
      status: isActive ? 'HEALTHY' : 'STANDBY',
    };
  }, [dataCount, isActive]);

  // Execute component event handler
  const handleTrigger = useCallback(() => {
    setIsProcessing(true);
    const newEntry = { id: \`entry-\${Date.now()}\`, time: Date.now() };

    setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
    setDataCount((prev) => prev + 1);

    if (onAction) {
      onAction({ timestamp: Date.now(), value: \`Triggered \${title}\` });
    }

    setTimeout(() => setIsProcessing(false), 300);
  }, [onAction, title]);

  useEffect(() => {
    // Initial mount telemetry sync
    console.debug(\`[${componentName}] Initialized on path: ${path}\`);
    return () => {
      // Cleanup lifecycle bindings
    };
  }, []);

  return (
    <div className={\`p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl \${className}\`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
          {metrics.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
          <span className="text-white/40 block text-[10px]">THROUGHPUT</span>
          <span className="text-emerald-400 font-bold text-sm">{metrics.throughput} ops/s</span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
          <span className="text-white/40 block text-[10px]">LOAD FACTOR</span>
          <span className="text-blue-400 font-bold text-sm">{metrics.loadFactor}%</span>
        </div>
      </div>

      <button
        onClick={handleTrigger}
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-xs font-mono text-blue-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
      >
        <Sparkles size={13} />
        <span>{isProcessing ? 'Processing AST...' : 'Execute Action'}</span>
      </button>
    </div>
  );
};

export default ${componentName};`;
  }

  if (type === 'hook') {
    return `import { useState, useEffect, useRef, useCallback } from 'react';

export interface Use${componentName}Options {
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  initialThreshold?: number;
}

export interface Use${componentName}Return {
  data: Float64Array | null;
  isLoading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom React hook for ${name}
 * Provides non-blocking execution pipelines and memory-safe garbage collection.
 */
export function use${componentName}(options: Use${componentName}Options = {}): Use${componentName}Return {
  const { autoRefresh = true, refreshIntervalMs = 5000, initialThreshold = 0.5 } = options;

  const [data, setData] = useState<Float64Array | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      // Allocate high-speed buffer for mathematical coordinates
      const buffer = new Float64Array(${Math.max(16, loc * 2)});
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.sin(i * 0.42) * initialThreshold;
      }

      await new Promise((resolve) => setTimeout(resolve, 80));
      setData(buffer);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialThreshold]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    execute();

    if (autoRefresh) {
      const timer = setInterval(execute, refreshIntervalMs);
      return () => {
        clearInterval(timer);
        abortControllerRef.current?.abort();
      };
    }
  }, [execute, autoRefresh, refreshIntervalMs]);

  return { data, isLoading, error, execute, reset };
}`;
  }

  if (type === 'api') {
    return `import { GraphNode } from '../types';

export interface APIPayload {
  requestId: string;
  sourcePath: string;
  timestamp: number;
  params: Record<string, unknown>;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data: T;
  executionTimeMs: number;
  timestamp: string;
}

/**
 * Service Client for ${name}
 * Provides authenticated, retried network transports with exponential backoff.
 */
export class ${componentName}Service {
  private static baseURL = '/api/v1/${name.replace(/\.[^/.]+$/, '')}';
  private static timeout = 8000;

  /**
   * Dispatches data query with automatic timeout abort triggers.
   */
  public static async query<T>(payload: APIPayload): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const start = performance.now();
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Node': '${path}',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(\`Network error with status \${response.status}\`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data as T,
        executionTimeMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timer);
      console.warn(\`[${componentName}] Service request failed:\`, error);
      throw error;
    }
  }
}`;
  }

  if (type === 'state') {
    return `import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface ${componentName}State {
  isInitialized: boolean;
  activeItem: string | null;
  items: Map<string, { id: string; timestamp: number; payload: any }>;
  version: number;
  
  // Actions
  initialize: () => void;
  setActiveItem: (id: string | null) => void;
  addItem: (id: string, payload: any) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

/**
 * Zustand Reactive State Store for ${name}
 */
export const use${componentName}Store = create<${componentName}State>()(
  subscribeWithSelector((set, get) => ({
    isInitialized: false,
    activeItem: null,
    items: new Map(),
    version: 1,

    initialize: () => {
      set({ isInitialized: true, version: get().version + 1 });
    },

    setActiveItem: (id) => {
      set({ activeItem: id });
    },

    addItem: (id, payload) => {
      const nextMap = new Map(get().items);
      nextMap.set(id, { id, timestamp: Date.now(), payload });
      set({ items: nextMap, version: get().version + 1 });
    },

    removeItem: (id) => {
      const nextMap = new Map(get().items);
      nextMap.delete(id);
      set({ items: nextMap, version: get().version + 1 });
    },

    clear: () => {
      set({ items: new Map(), activeItem: null, version: get().version + 1 });
    },
  }))
);`;
  }

  // Default fallback for utils/styles/configs
  return `/**
 * ${name}
 * Architectural module for ${repoName} (${path})
 *
 * @metrics Complexity: ${complexity}/10 | LOC: ${loc}
 */

export interface ${componentName}Config {
  debugMode: boolean;
  bufferCapacity: number;
  precision: number;
}

export const DEFAULT_CONFIG: ${componentName}Config = {
  debugMode: false,
  bufferCapacity: ${loc * 8},
  precision: 4,
};

/**
 * Executes high-throughput processing pipeline.
 */
export function process${componentName}(input: unknown, config: Partial<${componentName}Config> = {}): {
  success: boolean;
  output: unknown;
  diagnostics: { elapsedMs: number; memoryFootprint: string };
} {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = performance.now();

  // Computational logic
  const result = typeof input === 'object' && input !== null ? { ...input, indexed: true } : input;
  const elapsedMs = performance.now() - startTime;

  return {
    success: true,
    output: result,
    diagnostics: {
      elapsedMs: +elapsedMs.toFixed(mergedConfig.precision),
      memoryFootprint: \`\${(mergedConfig.bufferCapacity / 1024).toFixed(2)} KB\`,
    },
  };
}

export default process${componentName};`;
}

// Helper to expand repository nodes dynamically to populate 50+ rich interconnected nodes for 3D exploration
export function generateFullRepositoryGraph(baseRepo: RepositoryData): RepositoryData {
  if (baseRepo.nodes.length > 20) return baseRepo;

  const moduleNames = [
    { prefix: 'src/components/canvas', names: ['StarfieldBloom.tsx', 'NodeInstancedMesh.tsx', 'EdgeCurvedLines.tsx', 'CameraOrbitRig.tsx', 'TooltipPortal.tsx', 'ParticleEmitter.tsx', 'GlowHaloShader.tsx', 'VignettePostPass.tsx'], type: 'component' as NodeType },
    { prefix: 'src/components/hud', names: ['TelemetryGauge.tsx', 'BreadcrumbPath.tsx', 'CommandPalette.tsx', 'MetricsBadge.tsx', 'FilterPillGroup.tsx', 'TimeTravelSlider.tsx', 'ExportButton.tsx'], type: 'component' as NodeType },
    { prefix: 'src/hooks', names: ['useKeyboardShortcuts.ts', 'useForceSimulation.ts', 'use3DCameraSpring.ts', 'useNodeHover.ts', 'useWindowSize.ts', 'useLocalStorageState.ts', 'useCodeSyntax.ts'], type: 'hook' as NodeType },
    { prefix: 'src/api', names: ['githubCrawler.ts', 'repoIndexer.ts', 'semanticSearch.ts', 'geminiStreaming.ts', 'treeSitterBridge.ts'], type: 'api' as NodeType },
    { prefix: 'src/store', names: ['selectionSlice.ts', 'cameraSlice.ts', 'filterSlice.ts', 'telemetrySlice.ts', 'undoRedoStack.ts'], type: 'state' as NodeType },
    { prefix: 'src/utils', names: ['colorScales.ts', 'forceEngine.ts', 'bezierCurve.ts', 'formatBytes.ts', 'codeTokenizer.ts', 'exportGexf.ts', 'spatialHashGrid.ts'], type: 'util' as NodeType },
    { prefix: 'src/styles', names: ['themeTokens.css', 'cyberGlow.css', 'animations.css', 'gridOverlay.css'], type: 'style' as NodeType },
    { prefix: 'src/tests', names: ['forceEngine.test.ts', 'astParser.test.ts', 'raycast.test.ts', 'geminiBridge.test.ts'], type: 'test' as NodeType },
    { prefix: '', names: ['vite.config.ts', 'tailwind.config.js', 'eslint.config.js', 'package.json'], type: 'config' as NodeType }
  ];

  const fullNodes: GraphNode[] = [...baseRepo.nodes];
  const fullEdges: GraphEdge[] = [...baseRepo.edges];

  moduleNames.forEach((mod) => {
    mod.names.forEach((name) => {
      const fullPath = mod.prefix ? `${mod.prefix}/${name}` : name;
      if (fullNodes.find(n => n.id === fullPath)) return;

      const loc = 35 + Math.floor(Math.random() * 85);
      const complexity = 1 + Math.floor(Math.random() * 9);
      const maintainability = 75 + Math.floor(Math.random() * 23);
      const sizeBytes = loc * 42 + Math.floor(Math.random() * 1200);

      fullNodes.push({
        id: fullPath,
        name: name,
        path: fullPath,
        type: mod.type,
        extension: name.split('.').pop() || 'ts',
        sizeBytes,
        metrics: {
          loc,
          complexity,
          maintainability,
          importsCount: 2 + Math.floor(Math.random() * 6),
          exportsCount: 1 + Math.floor(Math.random() * 3),
          depth: fullPath.split('/').length
        },
        dependencies: [],
        exports: [name.replace(/\.[^/.]+$/, ''), 'default'],
        summary: `Architectural module implementing ${name.replace(/\.[^/.]+$/, '')} logic with high-performance memory pipelines and isolated reactive event loops.`,
        codePreview: generateFullSourceCodeForNode(name, fullPath, mod.type, baseRepo.name, loc, complexity)
      });
    });
  });

  // Generate sensible structural dependency edges
  for (let i = 0; i < fullNodes.length; i++) {
    const sourceNode = fullNodes[i];
    // Connect to 2-5 other nodes
    const connectCount = 2 + (i % 4);
    for (let c = 0; c < connectCount; c++) {
      const targetIndex = (i * 3 + c * 7 + 1) % fullNodes.length;
      if (targetIndex !== i) {
        const targetNode = fullNodes[targetIndex];
        const edgeId = `edge-${sourceNode.id}-${targetNode.id}`;
        if (!fullEdges.find(e => e.id === edgeId)) {
          fullEdges.push({
            id: edgeId,
            source: sourceNode.id,
            target: targetNode.id,
            type: c % 3 === 0 ? 'dynamic-import' : 'import',
            weight: 1 + (c % 3)
          });
          sourceNode.dependencies.push(targetNode.id);
        }
      }
    }
  }

  return {
    ...baseRepo,
    nodes: fullNodes,
    edges: fullEdges,
    nodeCount: fullNodes.length,
    edgeCount: fullEdges.length
  };
}
