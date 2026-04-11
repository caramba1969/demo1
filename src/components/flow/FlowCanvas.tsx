'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useUpdateNodeInternals,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
  type Connection,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Factory, Plus } from 'lucide-react';
import EnhancedItemRecipeSelector from '@/components/EnhancedItemRecipeSelector';
import PalettePanel from './PalettePanel';
import PaletteItemCard from './PaletteItemCard';
import FactoryNode from './FactoryNode';
import ConnectionEdge from './ConnectionEdge';
import ConnectionDialog from './ConnectionDialog';
import type { useFlowData } from './useFlowData';
import { useProductionLineDrop } from './useProductionLineDrop';
import type { PaletteItem, FlowEdgeData, FlowFactoryData } from './flowTypes';

type FlowEdgeType = Edge<FlowEdgeData>;

const nodeTypes: NodeTypes = { factoryNode: FactoryNode };
const edgeTypes: EdgeTypes = { animatedFlow: ConnectionEdge };

/**
 * Rendered inside <ReactFlow> so it has access to React Flow context.
 * Calls updateNodeInternals whenever the set of node IDs changes, with a 50ms
 * delay to let Handle components finish mounting and register with React Flow's
 * internal handle registry before edges are routed.
 */
function EdgeInitSync({ nodeIds }: { nodeIds: string[] }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const prevKey = useRef('');

  useEffect(() => {
    const key = nodeIds.join(',');
    if (key === prevKey.current || nodeIds.length === 0) return;
    prevKey.current = key;
    const timer = setTimeout(() => updateNodeInternals(nodeIds), 50);
    return () => clearTimeout(timer);
  }, [nodeIds, updateNodeInternals]);

  return null;
}

/**
 * Panel on the right side of the canvas listing all factories.
 * Factories already on the canvas are shown greyed out.
 * Others can be dragged onto the canvas via HTML5 drag (application/factory-id).
 */
function FactoryListPanel({
  allFactories,
  canvasFactoryIds,
  onCreateClick,
}: {
  allFactories: Array<{ _id: string; name: string }>;
  canvasFactoryIds: Set<string>;
  onCreateClick: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute right-0 top-0 z-10 h-full flex flex-row-reverse pointer-events-none">
      <div
        className={`pointer-events-auto flex flex-col bg-neutral-950/95 border-l border-neutral-800 backdrop-blur-sm transition-all duration-200 ${
          collapsed ? 'w-0 overflow-hidden' : 'w-52'
        }`}
      >
        {!collapsed && (
          <>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800 flex-shrink-0">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Factories</span>
              <button
                onClick={onCreateClick}
                className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                title="Create new factory"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {allFactories.length === 0 && (
                <p className="text-xs text-neutral-600 italic text-center py-4">No factories yet</p>
              )}
              {allFactories.map(f => {
                const onCanvas = canvasFactoryIds.has(f._id);
                return (
                  <div
                    key={f._id}
                    draggable={!onCanvas}
                    onDragStart={e => {
                      e.dataTransfer.setData('application/factory-id', f._id);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      onCanvas
                        ? 'text-neutral-600 cursor-default'
                        : 'text-neutral-300 cursor-grab hover:bg-neutral-800 hover:text-white active:cursor-grabbing'
                    }`}
                    title={onCanvas ? 'Already on canvas' : 'Drag to canvas'}
                  >
                    <Factory className={`w-3.5 h-3.5 flex-shrink-0 ${onCanvas ? 'text-neutral-700' : 'text-orange-400'}`} />
                    <span className="truncate">{f.name}</span>
                    {onCanvas && <span className="ml-auto text-[10px] text-neutral-700">on canvas</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {/* Toggle tab */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="pointer-events-auto self-start mt-3 -mr-px bg-neutral-950/95 border border-neutral-800 rounded-l px-1 py-2 text-neutral-500 hover:text-neutral-300 transition-colors"
        title={collapsed ? 'Show factories' : 'Hide factories'}
      >
        <Factory className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * Custom DndKit sensor that ignores pointerdown events originating on
 * React Flow handles, so connection-dragging is not intercepted by DndKit.
 */
class FlowAwarePointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: React.PointerEvent): boolean => {
        const target = nativeEvent.target as HTMLElement;
        if (
          target.classList.contains('react-flow__handle') ||
          !!target.closest('.react-flow__handle')
        ) {
          return false;
        }
        return true;
      },
    },
  ];
}

interface PendingConnection {
  sourceFactoryId: string;
  sourceProductionLineId: string;
  targetFactoryId: string;
  targetProductionLineId: string;
  itemName: string;
  itemClassName: string;
  suggestedAmount: number;
  sourceFactoryName: string;
  targetFactoryName: string;
}

interface FlowCanvasProps {
  flowData: ReturnType<typeof useFlowData>;
}

export default function FlowCanvas({ flowData }: FlowCanvasProps) {
  const {
    nodes, edges, onNodesChange, onEdgesChange,
    createFactory, refreshFactory, deleteFactory, addImportEdge,
    addFactoryToCanvas, removeFactoryFromCanvas, allFactories, canvasFactoryIds,
  } = flowData;

  const rfInstanceRef = useRef<{
    screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number };
    flowToScreenPosition: (pos: { x: number; y: number }) => { x: number; y: number };
  } | null>(null);

  // New factory popover state
  const [newFactoryPos, setNewFactoryPos] = useState<{ x: number; y: number } | null>(null);
  const [newFactoryName, setNewFactoryName] = useState('New Factory');
  const [creatingFactory, setCreatingFactory] = useState(false);

  // Pending edge connection state
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);

  // Track active connection drag for handle highlighting
  const [connectingItemClass, setConnectingItemClass] = useState<string | null>(null);
  const [connectingHandleType, setConnectingHandleType] = useState<'source' | 'target' | null>(null);

  // Add production line API call
  const handleAddProductionLine = useCallback(
    async (
      factoryId: string,
      payload: {
        itemClassName: string;
        recipeClassName: string;
        targetQuantityPerMinute: number;
        isExtraction: boolean;
      }
    ) => {
      const body: Record<string, unknown> = {
        itemClassName: payload.itemClassName,
        recipeClassName: payload.recipeClassName,
        targetQuantityPerMinute: payload.targetQuantityPerMinute,
      };
      if (payload.isExtraction) {
        body.isExtraction = true;
      }
      const res = await fetch(`/api/factories/${factoryId}/production-lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) await refreshFactory(factoryId);
    },
    [refreshFactory]
  );

  const { isDraggingFromPalette, pendingDrop, handleDragStart, handleDragEnd, confirmDrop, cancelDrop } =
    useProductionLineDrop({ onAddProductionLine: handleAddProductionLine });

  const handleDeleteProductionLine = useCallback(
    async (factoryId: string, lineId: string) => {
      const res = await fetch(`/api/factories/${factoryId}/production-lines/${lineId}`, {
        method: 'DELETE',
      });
      if (res.ok) await refreshFactory(factoryId);
    },
    [refreshFactory]
  );

  // Active drag item (for overlay)
  const [activeDragItem, setActiveDragItem] = useState<PaletteItem | null>(null);

  const sensors = useSensors(
    useSensor(FlowAwarePointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  // Double-click on empty canvas → create factory
  const handleCanvasDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      // Only trigger on the pane itself, not nodes/edges
      const target = event.target as HTMLElement;
      if (!target.classList.contains('react-flow__pane') && !target.closest('.react-flow__background')) return;
      if (!rfInstanceRef.current) return;
      const pos = rfInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setNewFactoryPos(pos);
      setNewFactoryName('New Factory');
    },
    []
  );

  // "New" button in factory list panel → open create popover at canvas center
  const handleCreateFromSidebar = useCallback(() => {
    if (!rfInstanceRef.current) return;
    const canvasEl = document.querySelector('.react-flow__renderer') as HTMLElement | null;
    const rect = canvasEl?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const pos = rfInstanceRef.current.screenToFlowPosition({ x: cx, y: cy });
    setNewFactoryPos(pos);
    setNewFactoryName('New Factory');
  }, []);

  const handleCreateFactory = useCallback(async () => {
    if (!newFactoryPos) return;
    setCreatingFactory(true);
    await createFactory(newFactoryName.trim() || 'New Factory', newFactoryPos);
    setCreatingFactory(false);
    setNewFactoryPos(null);
  }, [createFactory, newFactoryName, newFactoryPos]);

  // Handle new connection drag
  const handleConnect = useCallback(
    (connection: Connection) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      if (!source || !target || !sourceHandle || !targetHandle) return;
      if (!sourceHandle.startsWith('pl-out-') || !targetHandle.startsWith('pl-in-')) return;
      if (source === target) return;

      // Handle format: pl-out-{factoryId}-{plId}-{itemClassName}
      const sourceParts = sourceHandle.split('-');
      const targetParts = targetHandle.split('-');
      const sourcePLId = sourceParts[3];
      const targetPLId = targetParts[3];
      const sourceItemClass = sourceParts.slice(4).join('-');
      const targetItemClass = targetParts.slice(4).join('-');
      if (sourceItemClass !== targetItemClass) return;

      const sourceNode = nodes.find(n => n.id === source);
      const targetNode = nodes.find(n => n.id === target);
      if (!sourceNode || !targetNode) return;

      const sourcePL = (sourceNode.data as FlowFactoryData).productionLines.find(
        pl => pl._id === sourcePLId
      );
      if (!sourcePL) return;

      // Find the matching product in source production line for the rate
      const sourceProduct = sourcePL.products.find(p => p.item === sourceItemClass);
      const rate = sourceProduct
        ? (sourceProduct.amount / (sourcePL.recipeTime || 1)) * 60 * (sourcePL.buildingCount ?? 1)
        : sourcePL.actualQuantityPerMinute ?? sourcePL.targetQuantityPerMinute;

      setPendingConnection({
        sourceFactoryId: source,
        sourceProductionLineId: sourcePLId,
        targetFactoryId: target,
        targetProductionLineId: targetPLId,
        itemName: sourceProduct?.name ?? sourcePL.itemName,
        itemClassName: sourceItemClass,
        suggestedAmount: rate,
        sourceFactoryName: (sourceNode.data as FlowFactoryData).name,
        targetFactoryName: (targetNode.data as FlowFactoryData).name,
      });
    },
    [nodes]
  );

  const handleConnectStart = useCallback(
    (_event: MouseEvent | TouchEvent, params: { nodeId?: string | null; handleId?: string | null; handleType?: 'source' | 'target' | null }) => {
      const handleId = params.handleId;
      if (!handleId) return;
      // Extract item class from handle: pl-out-{fId}-{plId}-{itemClass} or pl-in-...
      const parts = handleId.split('-');
      const itemClass = parts.slice(4).join('-');
      if (itemClass) {
        setConnectingItemClass(itemClass);
        setConnectingHandleType(params.handleType === 'source' ? 'source' : 'target');
      }
    },
    []
  );

  const handleConnectEnd = useCallback(() => {
    setConnectingItemClass(null);
    setConnectingHandleType(null);
  }, []);

  const handleConfirmConnection = useCallback(
    async (requiredAmount: number) => {
      if (!pendingConnection) return;
      const {
        sourceFactoryId, sourceProductionLineId,
        targetFactoryId, targetProductionLineId,
        itemClassName, itemName,
      } = pendingConnection;

      const res = await fetch(`/api/factories/${targetFactoryId}/imports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFactoryId,
          itemClassName,
          requiredAmount,
          sourceProductionLineId,
          targetProductionLineId,
        }),
      });

      if (!res.ok) throw new Error('Failed to create import');

      const { import: imp } = await res.json();

      addImportEdge({
        id: `edge-${imp._id}`,
        source: sourceFactoryId,
        target: targetFactoryId,
        sourceHandle: `pl-out-${sourceFactoryId}-${sourceProductionLineId}-${itemClassName}`,
        targetHandle: `pl-in-${targetFactoryId}-${targetProductionLineId}-${itemClassName}`,
        type: 'animatedFlow',
        data: {
          itemName,
          amount: requiredAmount,
          itemClassName,
          importId: imp._id,
          targetFactoryId,
          sourceProductionLineId,
          targetProductionLineId,
        },
      } as FlowEdgeType);

      setPendingConnection(null);
    },
    [pendingConnection, addImportEdge]
  );

  // Inject callbacks into node data
  const enrichedNodes = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onDelete: deleteFactory,
      onRemoveFromCanvas: removeFactoryFromCanvas,
      onAddProductionLine: handleAddProductionLine,
      onDeleteProductionLine: handleDeleteProductionLine,
      connectingItemClass,
      connectingHandleType,
    },
  }));

  // Build set of valid handle IDs from current nodes
  const validHandleIds = new Set<string>();
  for (const node of enrichedNodes) {
    const factoryData = node.data as FlowFactoryData;
    for (const pl of factoryData.productionLines) {
      for (const ing of pl.ingredients) {
        validHandleIds.add(`pl-in-${factoryData.factoryId}-${pl._id}-${ing.item}`);
      }
      for (const prod of pl.products) {
        validHandleIds.add(`pl-out-${factoryData.factoryId}-${pl._id}-${prod.item}`);
      }
    }
  }

  // Filter out orphaned edges whose handles no longer exist
  const validEdges = edges.filter(e => {
    if (e.sourceHandle && !validHandleIds.has(e.sourceHandle)) return false;
    if (e.targetHandle && !validHandleIds.has(e.targetHandle)) return false;
    return true;
  });

  // HTML5 drag-over for sidebar factory drops
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/factory-id')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const factoryId = e.dataTransfer.getData('application/factory-id');
      if (!factoryId || !rfInstanceRef.current) return;
      const position = rfInstanceRef.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      addFactoryToCanvas(factoryId, position);
    },
    [addFactoryToCanvas]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={e => {
        handleDragStart(e);
        setActiveDragItem(e.active.data.current?.paletteItem ?? null);
      }}
      onDragEnd={e => {
        handleDragEnd(e);
        setActiveDragItem(null);
      }}
    >
      <DragOverlay dropAnimation={null}>
        {activeDragItem && <PaletteItemCard item={activeDragItem} isDragOverlay />}
      </DragOverlay>

      <div
        className={`relative w-full h-full ${isDraggingOver ? 'ring-2 ring-inset ring-orange-400/50' : ''}`}
        onDoubleClick={handleCanvasDoubleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <PalettePanel />
        <FactoryListPanel
          allFactories={allFactories}
          canvasFactoryIds={canvasFactoryIds}
          onCreateClick={handleCreateFromSidebar}
        />

        {/* Drop overlay hint */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <div className="bg-orange-500/10 border-2 border-dashed border-orange-400/40 rounded-2xl px-8 py-4">
              <p className="text-orange-400 text-lg font-medium">Drop factory here</p>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={enrichedNodes as Node[]}
          edges={validEdges as Edge[]}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange as Parameters<typeof ReactFlow>[0]['onNodesChange']}
          onEdgesChange={onEdgesChange as Parameters<typeof ReactFlow>[0]['onEdgesChange']}
          onConnect={handleConnect}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          isValidConnection={(c) => {
            if (c.source === c.target) return false;
            if (!c.sourceHandle?.startsWith('pl-out-') || !c.targetHandle?.startsWith('pl-in-')) return false;
            const sourceItemClass = c.sourceHandle.split('-').slice(4).join('-');
            const targetItemClass = c.targetHandle.split('-').slice(4).join('-');
            if (sourceItemClass !== targetItemClass) return false;
            // Prevent duplicate connections between the same handles
            const alreadyConnected = validEdges.some(
              e => e.sourceHandle === c.sourceHandle && e.targetHandle === c.targetHandle
            );
            return !alreadyConnected;
          }}
          nodesDraggable={!isDraggingFromPalette}
          panOnDrag={!isDraggingFromPalette}
          snapToGrid
          snapGrid={[20, 20]}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={2}
          onInit={inst => { rfInstanceRef.current = inst; }}
          className="flow-canvas"
          nodeOrigin={[0.5, 0.5]}
          deleteKeyCode={null}
          connectionLineStyle={{ stroke: '#f97316', strokeWidth: 2, strokeDasharray: '6 3' }}
          connectionLineType={ConnectionLineType.Bezier}
          doubleClickZoom={false}
        >
          <EdgeInitSync nodeIds={enrichedNodes.map(n => n.id)} />
          <Background variant={BackgroundVariant.Dots} color="#262626" gap={24} size={1.5} />
          <Controls className="[&>button]:bg-neutral-900 [&>button]:border-neutral-700 [&>button]:text-neutral-300 [&>button:hover]:bg-neutral-800" />
          <MiniMap
            nodeColor="#f97316"
            maskColor="rgba(10,10,10,0.7)"
            className="bg-neutral-950 border border-neutral-800 rounded"
          />
        </ReactFlow>

        {/* Double-click: create factory popover */}
        {newFactoryPos && rfInstanceRef.current && (() => {
          const screen = rfInstanceRef.current!.flowToScreenPosition(newFactoryPos);
          return (
            <div
              className="absolute z-20 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl p-3 w-56"
              style={{ left: screen.x - 112, top: screen.y - 8 }}
            >
              <p className="text-xs text-neutral-400 mb-2">New factory name</p>
              <Input
                autoFocus
                value={newFactoryName}
                onChange={e => setNewFactoryName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateFactory();
                  if (e.key === 'Escape') setNewFactoryPos(null);
                }}
                className="h-7 text-sm bg-neutral-800 border-neutral-600 text-white mb-2"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateFactory}
                  disabled={creatingFactory}
                  className="flex-1 h-7 text-xs bg-orange-600 hover:bg-orange-700"
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewFactoryPos(null)}
                  className="h-7 text-xs text-neutral-400"
                >
                  Cancel
                </Button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Connection dialog — set amount when dragging edge between production lines */}
      {pendingConnection && (
        <ConnectionDialog
          open
          onClose={() => setPendingConnection(null)}
          onConfirm={handleConfirmConnection}
          sourceFactoryName={pendingConnection.sourceFactoryName}
          targetFactoryName={pendingConnection.targetFactoryName}
          itemName={pendingConnection.itemName}
          suggestedAmount={pendingConnection.suggestedAmount}
        />
      )}

      {/* Pending drop dialog — pick recipe / quantity */}
      {pendingDrop && (
        <Dialog open onOpenChange={open => { if (!open) cancelDrop(); }}>
          <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                Add Production Line — {pendingDrop.paletteItem.name}
              </DialogTitle>
            </DialogHeader>
            <EnhancedItemRecipeSelector
              onSelectionComplete={data => {
                confirmDrop(
                  data.isExtraction ? 'EXTRACTION' : (data.recipe?.className ?? ''),
                  data.targetQuantityPerMinute,
                  data.isExtraction
                );
              }}
              filterByItemClass={pendingDrop.paletteItem.type === 'item' ? pendingDrop.paletteItem.itemClassName : undefined}
              initialItemClass={pendingDrop.paletteItem.type === 'item' ? pendingDrop.paletteItem.itemClassName : undefined}
            />
          </DialogContent>
        </Dialog>
      )}
    </DndContext>
  );
}
