import { GraphNode, GraphEdge, RepositoryData, NodeType } from '../types';

// Ignore common non-source directories and assets
const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  'coverage',
  '.cache',
  '.turbo',
  '.vscode',
  '.idea',
  'vendor'
]);

const SUPPORTED_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'vue', 'svelte',
  'json', 'css', 'scss', 'less',
  'py', 'go', 'rs', 'java', 'c', 'cpp', 'h',
  'sql', 'graphql', 'gql', 'html', 'md'
]);

// Determine archetype from file path and extension
export function classifyNodeType(filePath: string): NodeType {
  const lower = filePath.toLowerCase();
  const filename = lower.split('/').pop() || lower;

  if (lower.includes('.test.') || lower.includes('.spec.') || lower.includes('/__tests__/') || lower.includes('/tests/')) {
    return 'test';
  }
  if (lower.includes('/hooks/') || lower.includes('/hook/') || filename.startsWith('use') && (lower.endsWith('.ts') || lower.endsWith('.js'))) {
    return 'hook';
  }
  if (lower.includes('/api/') || lower.includes('/server/') || lower.includes('/routes/') || lower.includes('/controllers/') || lower.includes('/endpoints/')) {
    return 'api';
  }
  if (lower.includes('/store/') || lower.includes('/context/') || lower.includes('/state/') || lower.includes('/redux/') || lower.includes('/zustand/') || lower.includes('/atoms/')) {
    return 'state';
  }
  if (lower.includes('/styles/') || lower.includes('/theme/') || lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.less')) {
    return 'style';
  }
  if (
    filename.includes('config') ||
    filename.includes('vite.') ||
    filename.includes('webpack.') ||
    filename.includes('tailwind.') ||
    filename.includes('tsconfig') ||
    filename.includes('package.json') ||
    filename.includes('.env')
  ) {
    return 'config';
  }
  if (lower.includes('/utils/') || lower.includes('/lib/') || lower.includes('/helpers/') || lower.includes('/services/')) {
    return 'util';
  }
  if (
    lower.includes('/components/') ||
    lower.includes('/views/') ||
    lower.includes('/pages/') ||
    lower.endsWith('.tsx') ||
    lower.endsWith('.jsx') ||
    lower.endsWith('.vue') ||
    lower.endsWith('.svelte')
  ) {
    return 'component';
  }

  return 'util';
}

// Calculate approximate cyclomatic complexity and maintainability index
export function calculateCodeMetrics(code: string, path: string) {
  const lines = code.split('\n');
  const loc = Math.max(1, lines.filter(l => l.trim().length > 0 && !l.trim().startsWith('//')).length);

  // Measure control flow branches for complexity
  const branches = (code.match(/\b(if|else if|for|while|switch|case|catch|\?|&&|\|\|)\b/g) || []).length;
  const complexity = Math.min(10, Math.max(1, Math.round(1 + (branches / (loc || 1)) * 12)));

  // Maintainability index estimate (0-100)
  const maintainability = Math.max(20, Math.min(99, Math.round(100 - complexity * 5 - (loc > 300 ? 15 : loc > 150 ? 8 : 0))));

  const depth = path.split('/').filter(Boolean).length;

  return { loc, complexity, maintainability, depth };
}

// Extract import specifiers from code
export function extractImportsAndExports(code: string) {
  const imports: string[] = [];
  const exports: string[] = [];

  // ES imports: import ... from '...'
  const esImportRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = esImportRegex.exec(code)) !== null) {
    if (match[1] && !imports.includes(match[1])) {
      imports.push(match[1]);
    }
  }

  // CommonJS requires: require('...')
  const cjsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = cjsRequireRegex.exec(code)) !== null) {
    if (match[1] && !imports.includes(match[1])) {
      imports.push(match[1]);
    }
  }

  // Dynamic imports: import('...')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(code)) !== null) {
    if (match[1] && !imports.includes(match[1])) {
      imports.push(match[1]);
    }
  }

  // Named exports: export const/function/class ...
  const namedExportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class|type|interface|enum)\s+([a-zA-Z0-9_$]+)/g;
  while ((match = namedExportRegex.exec(code)) !== null) {
    if (match[1] && !exports.includes(match[1])) {
      exports.push(match[1]);
    }
  }
  if (code.includes('export default')) {
    if (!exports.includes('default')) exports.push('default');
  }

  return { imports, exports };
}

// Resolves relative import path (e.g. '../utils/math' from 'src/components/Graph.tsx') to node IDs
export function resolveDependencyId(sourcePath: string, importSpecifier: string, allNodeIds: string[]): string | null {
  if (!importSpecifier.startsWith('.')) {
    // Check if matching node path ends with importSpecifier
    const bareMatch = allNodeIds.find(id => id.includes(importSpecifier) || id.endsWith(`/${importSpecifier}`) || id === importSpecifier);
    return bareMatch || null;
  }

  const sourceParts = sourcePath.split('/');
  sourceParts.pop(); // Remove file name, keep directory

  const importParts = importSpecifier.split('/');
  for (const part of importParts) {
    if (part === '.') continue;
    if (part === '..') {
      if (sourceParts.length > 0) sourceParts.pop();
    } else {
      sourceParts.push(part);
    }
  }

  const targetBasePath = sourceParts.join('/');

  // Try exact match or with extensions (.ts, .tsx, .js, .jsx, /index.ts, etc.)
  const exact = allNodeIds.find(id => {
    const withoutExt = id.replace(/\.[^/.]+$/, '');
    return (
      id === targetBasePath ||
      withoutExt === targetBasePath ||
      id === `${targetBasePath}/index.ts` ||
      id === `${targetBasePath}/index.tsx` ||
      id === `${targetBasePath}/index.js`
    );
  });

  return exact || null;
}

export interface ParsedFileItem {
  file: File;
  relativePath: string;
  content: string;
}

// Convert uploaded directory files into a full 3D RepositoryData structure
export async function parseProjectFilesToGraph(
  files: File[],
  projectName: string,
  onProgress?: (processed: number, total: number, currentFile: string) => void
): Promise<RepositoryData> {
  const filteredFiles = files.filter(file => {
    const path = file.webkitRelativePath || file.name;
    const parts = path.split('/');
    // Check ignored folders
    const isIgnored = parts.some(p => IGNORED_DIRECTORIES.has(p) || p.startsWith('.'));
    if (isIgnored) return false;

    const ext = path.split('.').pop()?.toLowerCase() || '';
    return SUPPORTED_EXTENSIONS.has(ext);
  });

  const total = filteredFiles.length;
  const nodes: GraphNode[] = [];
  const rawImportsMap = new Map<string, string[]>();

  // Process files concurrently with batching
  for (let i = 0; i < total; i++) {
    const file = filteredFiles[i];
    let relativePath = file.webkitRelativePath || file.name;
    
    // Normalize path by stripping root directory name if webkitRelativePath starts with folder name
    const parts = relativePath.split('/');
    if (parts.length > 1) {
      // Remove the top folder wrapper name so paths start cleanly (e.g. src/App.tsx)
      parts.shift();
      relativePath = parts.join('/');
    }

    if (onProgress) {
      onProgress(i + 1, total, relativePath);
    }

    let content = '';
    try {
      // Read first 120KB of code for performance and memory
      const slice = file.slice(0, 120 * 1024);
      content = await slice.text();
    } catch {
      content = '// Could not read file content';
    }

    const filename = relativePath.split('/').pop() || relativePath;
    const ext = filename.split('.').pop() || 'ts';
    const type = classifyNodeType(relativePath);
    const metrics = calculateCodeMetrics(content, relativePath);
    const { imports, exports } = extractImportsAndExports(content);

    rawImportsMap.set(relativePath, imports);

    const summary = generateModuleSummary(filename, type, metrics.loc, exports);

    nodes.push({
      id: relativePath,
      name: filename,
      path: relativePath,
      type,
      extension: ext,
      sizeBytes: file.size || content.length,
      metrics: {
        ...metrics,
        importsCount: imports.length,
        exportsCount: Math.max(1, exports.length)
      },
      dependencies: [],
      exports: exports.length > 0 ? exports : ['default'],
      summary,
      codePreview: content.slice(0, 4000)
    });
  }

  // Link dependency edges across all nodes
  const allNodeIds = nodes.map(n => n.id);
  const edges: GraphEdge[] = [];
  let edgeCounter = 0;

  nodes.forEach(sourceNode => {
    const rawImports = rawImportsMap.get(sourceNode.id) || [];
    rawImports.forEach(imp => {
      const targetId = resolveDependencyId(sourceNode.id, imp, allNodeIds);
      if (targetId && targetId !== sourceNode.id) {
        if (!sourceNode.dependencies.includes(targetId)) {
          sourceNode.dependencies.push(targetId);
        }
        const edgeId = `edge-${sourceNode.id}->${targetId}-${edgeCounter++}`;
        if (!edges.some(e => e.source === sourceNode.id && e.target === targetId)) {
          edges.push({
            id: edgeId,
            source: sourceNode.id,
            target: targetId,
            type: imp.startsWith('.') ? 'import' : 'dependency',
            weight: 1
          });
        }
      }
    });
  });

  // If few or no edges found (e.g. flat directory), establish structural parent-directory connectivity
  if (edges.length < Math.floor(nodes.length / 2) && nodes.length > 1) {
    for (let i = 0; i < nodes.length; i++) {
      const source = nodes[i];
      const targetIdx = (i + 1) % nodes.length;
      const target = nodes[targetIdx];
      if (source.id !== target.id) {
        const edgeId = `edge-struct-${source.id}->${target.id}`;
        if (!edges.some(e => e.source === source.id && e.target === target.id)) {
          edges.push({
            id: edgeId,
            source: source.id,
            target: target.id,
            type: 'dependency',
            weight: 1
          });
          source.dependencies.push(target.id);
        }
      }
    }
  }

  const cleanRepoName = projectName.trim() || 'Custom Project';

  return {
    id: `project-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: cleanRepoName,
    owner: 'local',
    branch: 'main',
    commit: Math.random().toString(36).substring(2, 9),
    stars: 1,
    language: detectDominantLanguage(nodes),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    status: 'Complete',
    timestamp: 'Just now',
    nodes,
    edges
  };
}

function detectDominantLanguage(nodes: GraphNode[]): string {
  const counts: Record<string, number> = {};
  nodes.forEach(n => {
    const ext = n.extension.toLowerCase();
    counts[ext] = (counts[ext] || 0) + 1;
  });

  if ((counts['ts'] || 0) + (counts['tsx'] || 0) > (counts['js'] || 0) + (counts['jsx'] || 0)) {
    return 'TypeScript';
  }
  if ((counts['py'] || 0) > 0) return 'Python';
  if ((counts['go'] || 0) > 0) return 'Go';
  if ((counts['rs'] || 0) > 0) return 'Rust';
  return 'JavaScript';
}

function generateModuleSummary(filename: string, type: NodeType, loc: number, exports: string[]): string {
  const exportsStr = exports.slice(0, 3).join(', ');
  switch (type) {
    case 'component':
      return `React UI component (${loc} LOC) responsible for visual layout rendering, event bindings, and child view composition (${exportsStr || 'default'}).`;
    case 'hook':
      return `Custom stateful hook (${loc} LOC) orchestrating reactive side-effects, cache synchronization, and lifecycle primitives.`;
    case 'api':
      return `Backend or client API service route (${loc} LOC) handling async requests, token authorization, and payload validation.`;
    case 'state':
      return `Global state module (${loc} LOC) maintaining central reactive stores, action dispatchers, and state subscriptions.`;
    case 'util':
      return `Pure utility module (${loc} LOC) providing mathematical computations, data transformations, and shared helpers.`;
    case 'style':
      return `Style stylesheet providing theme tokens, animations, responsive rules, and custom visual effects.`;
    case 'config':
      return `Configuration manifest defining build targets, environment properties, and compiler plugins.`;
    case 'test':
      return `Unit and integration test suite asserting code behavior, edge cases, and runtime assertions.`;
    default:
      return `Source module (${loc} LOC) within application architecture.`;
  }
}
