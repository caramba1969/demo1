'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';
import type { FlowFactoryData, FlowEdgeData, ProductionLineData } from './flowTypes';

const STORAGE_KEY = 'flow-node-positions';
const CANVAS_FACTORIES_KEY = 'flow-canvas-factories';
const SIZES_KEY = 'flow-node-sizes';

function getStoredPositions(): Record<string, { x: number; y: number }> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function getStoredSizes(): Record<string, { width: number; height: number }> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(SIZES_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePositions(nodes: Node[]) {
  if (typeof window === 'undefined') return;
  const positions: Record<string, { x: number; y: number }> = {};
  for (const n of nodes) {
    positions[n.id] = { x: n.position.x, y: n.position.y };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

function saveSizes(nodes: Node[]) {
  if (typeof window === 'undefined') return;
  const sizes: Record<string, { width: number; height: number }> = {};
  for (const n of nodes) {
    const w = n.measured?.width ?? (n.style?.width as number | undefined);
    const h = n.measured?.height ?? (n.style?.height as number | undefined);
    if (w && h) sizes[n.id] = { width: w, height: h };
  }
  localStorage.setItem(SIZES_KEY, JSON.stringify(sizes));
}

function getCanvasFactoryIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(CANVAS_FACTORIES_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveCanvasFactoryIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CANVAS_FACTORIES_KEY, JSON.stringify([...ids]));
}

interface RawFactory {
  _id: string;
  name: string;
  locationId?: { _id: string; name: string; color?: string; icon?: string } | null;
  order?: number;
  tasks?: unknown[];
  notes?: unknown[];
}

interface RawImport {
  _id: string;
  sourceFactoryId: { _id: string; name: string } | null;
  targetFactoryId: string;
  itemClassName: string;
  itemName: string;
  requiredAmount: number;
  sourceProductionLineId?: string | null;
  targetProductionLineId?: string | null;
}

export function useFlowData() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowFactoryData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<FlowEdgeData>>([]);
  const [allFactories, setAllFactories] = useState<RawFactory[]>([]);
  const [canvasFactoryIds, setCanvasFactoryIds] = useState<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced position save
  const debouncedSave = useCallback((updatedNodes: Node[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      savePositions(updatedNodes);
      saveSizes(updatedNodes);
    }, 500);
  }, []);

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      setNodes(current => {
        debouncedSave(current);
        return current;
      });
    },
    [onNodesChange, setNodes, debouncedSave]
  );

  const loadProductionLines = useCallback(async (factoryId: string): Promise<ProductionLineData[]> => {
    try {
      const res = await fetch(`/api/factories/${factoryId}/production-lines`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.productionLines || []).map((pl: {
        _id: string;
        itemClassName: string;
        itemName?: string;
        recipeClassName: string;
        recipeName?: string;
        targetQuantityPerMinute: number;
        actualQuantityPerMinute?: number;
        buildingCount?: number;
        buildingType?: string;
        powerConsumption?: number;
        active?: boolean;
        recipe?: {
          name?: string;
          time?: number;
          ingredients?: Array<{ item: string; amount: number; name: string }>;
          products?: Array<{ item: string; amount: number; name: string }>;
        };
      }) => ({
        _id: pl._id,
        itemClassName: pl.itemClassName,
        itemName: pl.itemName || pl.itemClassName,
        recipeClassName: pl.recipeClassName,
        recipeName: pl.recipe?.name || pl.recipeName,
        targetQuantityPerMinute: pl.targetQuantityPerMinute,
        actualQuantityPerMinute: pl.actualQuantityPerMinute,
        buildingCount: pl.buildingCount,
        buildingType: pl.buildingType,
        powerConsumption: pl.powerConsumption,
        active: pl.active !== false,
        recipeTime: pl.recipe?.time,
        ingredients: pl.recipe?.ingredients || [],
        products: pl.recipe?.products || [],
      }));
    } catch {
      return [];
    }
  }, []);

  const loadAll = useCallback(async () => {
    const factoriesRes = await fetch('/api/factories');
    if (!factoriesRes.ok) return;
    const rawFactories: RawFactory[] = await factoriesRes.json();

    setAllFactories(rawFactories);

    const storedPositions = getStoredPositions();
    const storedSizes = getStoredSizes();
    const canvasIds = getCanvasFactoryIds();
    setCanvasFactoryIds(canvasIds);

    // Only create nodes for factories explicitly placed on the canvas
    const canvasFactories = rawFactories.filter(f => canvasIds.has(f._id));

    // Build nodes using stored positions
    const newNodes: Node<FlowFactoryData>[] = canvasFactories.map((f) => {
      const stored = storedPositions[f._id];
      const size = storedSizes[f._id];
      return {
        id: f._id,
        type: 'factoryNode',
        position: stored ?? { x: 100, y: 100 },
        data: {
          factoryId: f._id,
          name: f.name,
          locationId: f.locationId ?? null,
          productionLines: [],
          isLoadingLines: true,
        },
        style: { width: size?.width ?? 360, height: size?.height ?? undefined },
      };
    });

    setNodes(newNodes);

    // Load production lines for canvas factories only
    const linesResults = await Promise.all(
      canvasFactories.map(f => loadProductionLines(f._id))
    );
    setNodes(current =>
      current.map((node, i) => ({
        ...node,
        data: {
          ...node.data,
          productionLines: linesResults[i] ?? [],
          isLoadingLines: false,
        },
      }))
    );

    // Load imports → edges (only for canvas factories)
    const canvasIdSet = new Set(canvasFactories.map(f => f._id));
    const allEdges: Edge<FlowEdgeData>[] = [];
    await Promise.all(
      canvasFactories.map(async (f) => {
        try {
          const res = await fetch(`/api/factories/${f._id}/imports`);
          if (!res.ok) return;
          const data = await res.json();
          const imports: RawImport[] = data.imports || [];
          for (const imp of imports) {
            if (!imp.sourceFactoryId) continue;
            // Only show edges where both source and target are on canvas
            if (!canvasIdSet.has(imp.sourceFactoryId._id)) continue;
            const edge: Edge<FlowEdgeData> = {
              id: `edge-${imp._id}`,
              source: imp.sourceFactoryId._id,
              target: f._id,
              type: 'animatedFlow',
              data: {
                itemName: imp.itemName,
                amount: imp.requiredAmount,
                itemClassName: imp.itemClassName,
              },
            };
            if (imp.sourceProductionLineId) {
              edge.sourceHandle = `pl-out-${imp.sourceFactoryId._id}-${imp.sourceProductionLineId}-${imp.itemClassName}`;
            }
            if (imp.targetProductionLineId) {
              edge.targetHandle = `pl-in-${f._id}-${imp.targetProductionLineId}-${imp.itemClassName}`;
            }
            allEdges.push(edge);
          }
        } catch {
          // skip
        }
      })
    );
    setEdges(allEdges);
  }, [setNodes, setEdges, loadProductionLines]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const createFactory = useCallback(
    async (name: string, position: { x: number; y: number }) => {
      const res = await fetch('/api/factories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return null;
      const factory: RawFactory = await res.json();

      // Track on canvas
      setCanvasFactoryIds(prev => {
        const next = new Set(prev);
        next.add(factory._id);
        saveCanvasFactoryIds(next);
        return next;
      });

      // Add to allFactories
      setAllFactories(prev => [...prev, factory]);

      const newNode: Node<FlowFactoryData> = {
        id: factory._id,
        type: 'factoryNode',
        position,
        data: {
          factoryId: factory._id,
          name: factory.name,
          locationId: factory.locationId ?? null,
          productionLines: [],
          isLoadingLines: false,
        },
        style: { width: 360 },
      };
      setNodes(nodes => [...nodes, newNode]);
      return factory._id;
    },
    [setNodes]
  );

  const refreshFactory = useCallback(
    async (factoryId: string) => {
      const lines = await loadProductionLines(factoryId);
      setNodes(current =>
        current.map(n =>
          n.id === factoryId
            ? { ...n, data: { ...n.data, productionLines: lines, isLoadingLines: false } }
            : n
        )
      );
    },
    [loadProductionLines, setNodes]
  );

  const addFactoryToCanvas = useCallback(
    async (factoryId: string, position: { x: number; y: number }) => {
      // Check if already on canvas
      if (nodes.some(n => n.id === factoryId)) return;

      const factory = allFactories.find(f => f._id === factoryId);
      if (!factory) return;

      // Track on canvas
      setCanvasFactoryIds(prev => {
        const next = new Set(prev);
        next.add(factoryId);
        saveCanvasFactoryIds(next);
        return next;
      });

      const newNode: Node<FlowFactoryData> = {
        id: factory._id,
        type: 'factoryNode',
        position,
        data: {
          factoryId: factory._id,
          name: factory.name,
          locationId: factory.locationId ?? null,
          productionLines: [],
          isLoadingLines: true,
        },
        style: { width: 360 },
      };
      setNodes(current => [...current, newNode]);

      // Load production lines
      const lines = await loadProductionLines(factoryId);
      setNodes(current =>
        current.map(n =>
          n.id === factoryId
            ? { ...n, data: { ...n.data, productionLines: lines, isLoadingLines: false } }
            : n
        )
      );
    },
    [nodes, allFactories, setNodes, loadProductionLines]
  );

  const removeFactoryFromCanvas = useCallback(
    (factoryId: string) => {
      setCanvasFactoryIds(prev => {
        const next = new Set(prev);
        next.delete(factoryId);
        saveCanvasFactoryIds(next);
        return next;
      });
      setNodes(current => current.filter(n => n.id !== factoryId));
      setEdges(current =>
        current.filter(e => e.source !== factoryId && e.target !== factoryId)
      );
    },
    [setNodes, setEdges]
  );

  const deleteFactory = useCallback(
    async (factoryId: string) => {
      const res = await fetch('/api/factories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: factoryId }),
      });
      if (!res.ok) return false;
      setCanvasFactoryIds(prev => {
        const next = new Set(prev);
        next.delete(factoryId);
        saveCanvasFactoryIds(next);
        return next;
      });
      setAllFactories(prev => prev.filter(f => f._id !== factoryId));
      setNodes(current => current.filter(n => n.id !== factoryId));
      setEdges(current =>
        current.filter(e => e.source !== factoryId && e.target !== factoryId)
      );
      return true;
    },
    [setNodes, setEdges]
  );

  const addImportEdge = useCallback(
    (edge: Edge<FlowEdgeData>) => {
      setEdges(current => [...current.filter(e => e.id !== edge.id), edge]);
    },
    [setEdges]
  );

  return {
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange,
    createFactory,
    refreshFactory,
    deleteFactory,
    addImportEdge,
    addFactoryToCanvas,
    removeFactoryFromCanvas,
    allFactories,
    canvasFactoryIds,
    reload: loadAll,
  };
}
