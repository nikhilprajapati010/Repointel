import React, { useState } from 'react';
import { ChevronDown, GitBranch, CheckCircle2, Sparkles, FolderPlus } from 'lucide-react';
import { RepositoryData } from '../types';

interface HUDHeaderProps {
  currentRepo: RepositoryData;
  repositories: RepositoryData[];
  onSelectRepo: (repo: RepositoryData) => void;
  onOpenAddProject: () => void;
  nodeCount: number;
  totalNodeCount?: number;
  statusText?: string;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  currentRepo,
  repositories,
  onSelectRepo,
  onOpenAddProject,
  nodeCount,
  totalNodeCount,
  statusText = 'Scan Complete',
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const total = totalNodeCount ?? currentRepo.nodeCount;
  const isFiltered = totalNodeCount !== undefined && nodeCount !== total;

  return (
    <header className="fixed top-6 left-6 z-20 flex items-center gap-3">
      {/* Main floating glass HUD pill */}
      <div 
        id="hud-header-pill"
        className="relative flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-2xl text-[#e4e4e7] hover:border-white/20 transition-all duration-300 select-none group"
      >
        {/* Brand identity badge */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-blue-400 font-mono">
            RepoIntel
          </span>
        </div>

        <div className="w-[1px] h-3 bg-white/20" />

        {/* Repository selector & branch indicator */}
        <div className="flex items-center gap-2">
          <button
            id="hud-repo-switcher-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <span>{currentRepo.name}</span>
            <ChevronDown 
              size={12} 
              className={`text-white/40 group-hover:text-white/80 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          <span className="text-[10px] font-mono text-white/40 flex items-center gap-1">
            <GitBranch size={10} className="text-white/40" />
            {currentRepo.branch}
          </span>
        </div>

        <div className="w-[1px] h-3 bg-white/20" />

        {/* Status telemetry readout */}
        <div className={`text-[10px] font-mono uppercase tracking-tighter ${isFiltered ? 'text-amber-400 font-semibold' : 'text-emerald-400'}`}>
          {isFiltered ? (
            <span>Filtered • {nodeCount} of {total} Nodes</span>
          ) : (
            <span>{statusText} • {total.toLocaleString()} Nodes</span>
          )}
        </div>

        {/* Add Project Action Button inside pill */}
        <div className="w-[1px] h-3 bg-white/20" />
        <button
          id="hud-add-project-btn"
          onClick={onOpenAddProject}
          title="Add Project Folder or GitHub Repo"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] font-medium transition-all cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.2)]"
        >
          <FolderPlus size={12} />
          <span>Add Folder</span>
        </button>

        {/* Floating repository selector dropdown */}
        {dropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-30 cursor-default" 
              onClick={() => setDropdownOpen(false)} 
            />
            <div 
              id="hud-repo-dropdown"
              className="absolute top-full left-0 mt-2.5 w-80 p-2 rounded-2xl bg-[#09090b]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/10 mb-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                  Indexed Projects
                </span>
                <span className="text-[9px] font-mono text-blue-400">
                  {repositories.length} Loaded
                </span>
              </div>

              {/* Prominent Add Project Action Button in dropdown */}
              <button
                id="dropdown-add-project-btn"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenAddProject();
                }}
                className="w-full mb-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                <FolderPlus size={14} />
                <span>+ Add Project Folder / Repo</span>
              </button>

              <div className="space-y-0.5 max-h-60 overflow-y-auto">
                {repositories.map((repo) => {
                  const isSelected = repo.id === currentRepo.id;
                  return (
                    <button
                      key={repo.id}
                      onClick={() => {
                        onSelectRepo(repo);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-mono text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-500/15 text-blue-300 font-medium border border-blue-500/30' 
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="font-semibold text-white/95 truncate">{repo.name}</span>
                        <span className="text-[10px] text-white/40">{repo.language} • {repo.nodeCount} nodes</span>
                      </div>
                      {isSelected && <CheckCircle2 size={13} className="text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 pt-2 border-t border-white/10 px-2.5 py-1 flex items-center gap-2 text-[10px] font-mono text-white/40">
                <Sparkles size={11} className="text-blue-400" />
                <span>3D AST Neural Graph Online</span>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
