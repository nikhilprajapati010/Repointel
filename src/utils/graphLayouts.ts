import { GraphNode, GraphEdge, LayoutMode, NodeType } from '../types';

// Helper to ensure safe finite number
function safeNum(val: unknown, fallback = 0): number {
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

// Compute 3D node positions for various sci-fi architectural layouts
export function applyLayoutPositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
  mode: LayoutMode
): void {
  const count = nodes.length;
  if (count === 0) return;

  switch (mode) {
    case 'sphere': {
      // Fibonacci Golden Spiral Sphere
      const radius = 220;
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle

      nodes.forEach((node, i) => {
        const yNorm = count > 1 ? 1 - (i / (count - 1)) * 2 : 0;
        const clampedY = Math.max(-1, Math.min(1, yNorm));
        const radiusAtY = Math.sqrt(Math.max(0, 1 - clampedY * clampedY));
        const theta = phi * i;

        const targetX = Math.cos(theta) * radiusAtY * radius;
        const targetY = clampedY * radius * 0.9;
        const targetZ = Math.sin(theta) * radiusAtY * radius;

        node.x = safeNum(targetX, 0);
        node.y = safeNum(targetY, 0);
        node.z = safeNum(targetZ, 0);
      });
      break;
    }

    case 'cluster-type': {
      // Group by Archetype into distinct celestial orbital centers
      const typeGroups: Record<NodeType, GraphNode[]> = {
        component: [],
        hook: [],
        api: [],
        state: [],
        util: [],
        style: [],
        config: [],
        test: [],
      };

      nodes.forEach((node) => {
        if (typeGroups[node.type]) {
          typeGroups[node.type].push(node);
        } else {
          typeGroups.component.push(node);
        }
      });

      const types = (Object.keys(typeGroups) as NodeType[]).filter(
        (t) => typeGroups[t].length > 0
      );
      const clusterRadius = 260;

      types.forEach((type, typeIdx) => {
        const angle = types.length > 0 ? (typeIdx / types.length) * Math.PI * 2 : 0;
        const clusterCenterX = Math.cos(angle) * clusterRadius;
        const clusterCenterY = Math.sin(typeIdx * 1.3) * 60;
        const clusterCenterZ = Math.sin(angle) * clusterRadius;

        const group = typeGroups[type];
        group.forEach((node, i) => {
          const subAngle = group.length > 0 ? (i / group.length) * Math.PI * 2 : 0;
          const subDist = 35 + (i % 3) * 20;
          const tx = clusterCenterX + Math.cos(subAngle) * subDist;
          const ty = clusterCenterY + ((i % 5) - 2) * 16;
          const tz = clusterCenterZ + Math.sin(subAngle) * subDist;

          node.x = safeNum(tx, 0);
          node.y = safeNum(ty, 0);
          node.z = safeNum(tz, 0);
        });
      });
      break;
    }

    case 'radial-orbital': {
      // Concentric planetary rings by architectural depth/type
      nodes.forEach((node, i) => {
        const ringLevel = node.type === 'config' ? 1 
          : node.type === 'util' || node.type === 'state' ? 2 
          : node.type === 'api' || node.type === 'hook' ? 3 
          : node.type === 'component' ? 4 
          : 5;
        
        const ringRadius = 60 + ringLevel * 65;
        const angle = (i * 1.61803398875) * Math.PI * 2;
        const heightJitter = Math.sin(i * 0.7) * 45;

        const tx = Math.cos(angle) * ringRadius;
        const ty = heightJitter;
        const tz = Math.sin(angle) * ringRadius;

        node.x = safeNum(tx, 0);
        node.y = safeNum(ty, 0);
        node.z = safeNum(tz, 0);
      });
      break;
    }

    case 'force-cloud':
    default: {
      // 3D Force-directed constellation layout
      // Initial positioning with deterministic harmonic spherical dispersion
      const phi = Math.PI * (3 - Math.sqrt(5));
      nodes.forEach((node, i) => {
        const yNorm = count > 1 ? 1 - (i / (count - 1)) * 2 : 0;
        const clampedY = Math.max(-1, Math.min(1, yNorm));
        const rAtY = Math.sqrt(Math.max(0, 1 - clampedY * clampedY));
        const theta = phi * i;
        const baseRadius = 160 + (i % 5) * 20;

        node.x = safeNum(Math.cos(theta) * rAtY * baseRadius, (i % 7 - 3) * 30);
        node.y = safeNum(clampedY * baseRadius * 0.8, (i % 5 - 2) * 20);
        node.z = safeNum(Math.sin(theta) * rAtY * baseRadius, Math.sin(i) * 30);
      });

      // Quick force relaxation iterations with damped velocities and clamped displacement
      const maxDisplacement = 12;
      for (let iter = 0; iter < 10; iter++) {
        // Node-to-node repulsion
        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            const na = nodes[i];
            const nb = nodes[j];
            const ax = safeNum(na.x, 0);
            const ay = safeNum(na.y, 0);
            const az = safeNum(na.z, 0);
            const bx = safeNum(nb.x, 0);
            const by = safeNum(nb.y, 0);
            const bz = safeNum(nb.z, 0);

            const dx = bx - ax;
            const dy = by - ay;
            const dz = bz - az;
            const distSq = dx * dx + dy * dy + dz * dz + 1.0;
            const dist = Math.sqrt(distSq);

            if (dist < 160 && dist > 0.5) {
              const rawForce = (160 - dist) / (dist * 40);
              const force = Math.min(maxDisplacement / dist, rawForce);
              const fx = dx * force;
              const fy = dy * force;
              const fz = dz * force;

              na.x = safeNum(ax - fx, ax);
              na.y = safeNum(ay - fy, ay);
              na.z = safeNum(az - fz, az);
              nb.x = safeNum(bx + fx, bx);
              nb.y = safeNum(by + fy, by);
              nb.z = safeNum(bz + fz, bz);
            }
          }
        }

        // Edge attraction
        edges.forEach((edge) => {
          const na = nodes.find(n => n.id === edge.source);
          const nb = nodes.find(n => n.id === edge.target);
          if (na && nb) {
            const ax = safeNum(na.x, 0);
            const ay = safeNum(na.y, 0);
            const az = safeNum(na.z, 0);
            const bx = safeNum(nb.x, 0);
            const by = safeNum(nb.y, 0);
            const bz = safeNum(nb.z, 0);

            const dx = bx - ax;
            const dy = by - ay;
            const dz = bz - az;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz + 1.0);
            const targetDist = 80;
            const delta = dist - targetDist;
            const rawForce = delta * 0.015;
            const force = Math.max(-maxDisplacement / dist, Math.min(maxDisplacement / dist, rawForce));

            const fx = dx * force;
            const fy = dy * force;
            const fz = dz * force;

            na.x = safeNum(ax + fx, ax);
            na.y = safeNum(ay + fy, ay);
            na.z = safeNum(az + fz, az);
            nb.x = safeNum(bx - fx, bx);
            nb.y = safeNum(by - fy, by);
            nb.z = safeNum(bz - fz, bz);
          }
        });
      }
      break;
    }
  }

  // Final sanity sweep guaranteeing strictly finite, clamped coordinates
  nodes.forEach((n, idx) => {
    n.x = safeNum(n.x, (idx % 7 - 3) * 35);
    n.y = safeNum(n.y, (idx % 5 - 2) * 25);
    n.z = safeNum(n.z, Math.sin(idx) * 50);
  });
}
