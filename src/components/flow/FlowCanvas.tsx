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
import { useFlowData } from './useFlowData';
import { useProductionLineDrop } from './useProductionLineDrop';
import type { PaletteItem, FlowEdgeData } from './flowTypes';

type FlowEdgeType = Edge<FlowEdgeData>;

const nodeTypes: NodeTypes = { factoryNode: FactoryNode };
const edgeTypes: EdgeTypes = { animatedFlow: ConnectionEdge };

export default function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, createFactory, refreshFactory, deleteFactory } =
    useFlowData();

  const rfInstanceRef = useRef<{
    screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number };
    flowToScreenPosition: (pos: { x: number; y: number }) => { x: number; y: number };
  } | null>(null);

  // New factory popover state
  const [newFactoryPos, setNewFactoryPos] = useState<{ x: number; y: number } | null>(null);
  const [newFactoryName, setNewFactoryName] = useState('New Factory');
  const [creatingFactory, setCreatingFactory] = useState(false);

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

  // Inject callbacks into node data
  const enrichedNodes = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onDelete: deleteFactory,
      onAddProductionLine: handleAddProductionLine,
    },
  }));

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

      <div className="relative w-full h-full" onDoubleClick={handleCanvasDoubleClick}>
        <PalettePanel />

        <ReactFlow
          nodes={enrichedNodes as Node[]}
          edges={edges as Edge[]}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange as Parameters<typeof ReactFlow>[0]['onNodesChange']}
          onEdgesChange={onEdgesChange as Parameters<typeof ReactFlow>[0]['onEdgesChange']}
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
