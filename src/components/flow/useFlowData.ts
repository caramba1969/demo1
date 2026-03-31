'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';
import type { FlowFactoryData, FlowEdgeData, ProductionLineData } from './flowTypes';

const STORAGE_KEY = 'flow-node-positions';
const COLS = 4;
const COL_WIDTH = 340;
const ROW_HEIGHT = 320;
const GRID_OFFSET_X = 60;
const GRID_OFFSET_Y = 60;

function getStoredPositions(): Record<string, { x: number; y: number }> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
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
}

export function useFlowData() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowFactoryData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<FlowEdgeData>>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced position save
  const debouncedSave = useCallback((updatedNodes: Node[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => savePositions(updatedNodes), 500);
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
      }) => ({
        _id: pl._id,
        itemClassName: pl.itemClassName,
        itemName: pl.itemName || pl.itemClassName,
        recipeClassName: pl.recipeClassName,
        recipeName: pl.recipeName,
        targetQuantityPerMinute: pl.targetQuantityPerMinute,
        actualQuantityPerMinute: pl.actualQuantityPerMinute,
        buildingCount: pl.buildingCount,
        buildingType: pl.buildingType,
        powerConsumption: pl.powerConsumption,
        active: pl.active !== false,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadAll = useCallback(async () => {
    const factoriesRes = await fetch('/api/factories');
    if (!factoriesRes.ok) return;
    const rawFactories: RawFactory[] = await factoriesRes.json();

    const storedPositions = getStoredPositions();

    // Build nodes (auto grid layout, override with stored positions)
    const newNodes: Node<FlowFactoryData>[] = rawFactories.map((f, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const defaultX = GRID_OFFSET_X + col * COL_WIDTH;
      const defaultY = GRID_OFFSET_Y + row * ROW_HEIGHT;
      const stored = storedPositions[f._id];

      return {
        id: f._id,
        type: 'factoryNode',
        position: stored ?? { x: defaultX, y: defaultY },
        data: {
          factoryId: f._id,
          name: f.name,
          locationId: f.locationId ?? null,
          productionLines: [],
          isLoadingLines: true,
        },
        style: { width: 280 },
      };
    });

    setNodes(newNodes);

    // Load production lines for all factories
    const linesResults = await Promise.all(
      rawFactories.map(f => loadProductionLines(f._id))
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

    // Load imports → edges
    const allEdges: Edge<FlowEdgeData>[] = [];
    await Promise.all(
      rawFactories.map(async (f) => {
        try {
          const res = await fetch(`/api/factories/${f._id}/imports`);
          if (!res.ok) return;
          const data = await res.json();
          const imports: RawImport[] = data.imports || [];
          for (const imp of imports) {
            if (!imp.sourceFactoryId) continue;
            allEdges.push({
              id: `edge-${imp._id}`,
              source: imp.sourceFactoryId._id,
              target: f._id,
              type: 'animatedFlow',
              data: {
                itemName: imp.itemName,
                amount: imp.requiredAmount,
                itemClassName: imp.itemClassName,
              },
            });
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
        style: { width: 280 },
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

  const deleteFactory = useCallback(
    async (factoryId: string) => {
      const res = await fetch('/api/factories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: factoryId }),
      });
      if (!res.ok) return false;
      setNodes(current => current.filter(n => n.id !== factoryId));
      setEdges(current =>
        current.filter(e => e.source !== factoryId && e.target !== factoryId)
      );
      return true;
    },
    [setNodes, setEdges]
  );

  return {
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange,
    createFactory,
    refreshFactory,
    deleteFactory,
    reload: loadAll,
  };
}
