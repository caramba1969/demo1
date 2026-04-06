'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
  type Connection,
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
import EnhancedItemRecipeSelector from '@/components/EnhancedItemRecipeSelector';
import PalettePanel from './PalettePanel';
import PaletteItemCard from './PaletteItemCard';
import FactoryNode, { type FactoryNodeType } from './FactoryNode';
import ConnectionEdge from './ConnectionEdge';
import ConnectionDialog from './ConnectionDialog';
import type { useFlowData } from './useFlowData';
import { useProductionLineDrop } from './useProductionLineDrop';
import type { PaletteItem, FlowEdgeData, FlowFactoryData } from './flowTypes';

type FlowEdgeType = Edge<FlowEdgeData>;

const nodeTypes: NodeTypes = { factoryNode: FactoryNode };
const edgeTypes: EdgeTypes = { animatedFlow: ConnectionEdge };

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
    addFactoryToCanvas, removeFactoryFromCanvas,
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

  // Active drag item (for overlay)
  const [activeDragItem, setActiveDragItem] = useState<PaletteItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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
      connectingItemClass,
      connectingHandleType,
    },
  }));

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
          edges={edges as Edge[]}
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
            // Handle format: pl-out-{factoryId}-{plId}-{itemClassName}
            const sourceItemClass = c.sourceHandle.split('-').slice(4).join('-');
            const targetItemClass = c.targetHandle.split('-').slice(4).join('-');
            return sourceItemClass === targetItemClass;
          }}
          panOnDrag={!isDraggingFromPalette}
          nodesDraggable={!isDraggingFromPalette}
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
        >
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
            />
          </DialogContent>
        </Dialog>
      )}
    </DndContext>
  );
}
