'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, NodeResizer, useUpdateNodeInternals, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import { useDroppable } from '@dnd-kit/core';
import { Factory, Zap, Building2, Plus, Trash2, Loader2, ChevronDown, ChevronUp, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EnhancedItemRecipeSelector from '@/components/EnhancedItemRecipeSelector';
import type { FlowFactoryData, ProductionLineData } from './flowTypes';

export interface FactoryNodeData extends FlowFactoryData {
  onDelete?: (factoryId: string) => void;
  onRemoveFromCanvas?: (factoryId: string) => void;
  onAddProductionLine?: (factoryId: string, payload: {
    itemClassName: string;
    recipeClassName: string;
    targetQuantityPerMinute: number;
    isExtraction: boolean;
  }) => void;
  onDeleteProductionLine?: (factoryId: string, lineId: string) => void;
  connectingItemClass?: string | null;
  connectingHandleType?: 'source' | 'target' | null;
}

export type FactoryNodeType = Node<FactoryNodeData, 'factoryNode'>;

/** Calculate items/min for a recipe ingredient or product */
function calcRatePerMinute(amount: number, recipeTime: number | undefined, buildingCount: number): number {
  const time = recipeTime || 1;
  return (amount / time) * 60 * buildingCount;
}

/** Format rate compactly: 1200000 → 1.2M, 45000 → 45K, 180 → 180 */
function formatRate(rate: number): string {
  if (rate >= 1_000_000) return `${(rate / 1_000_000).toFixed(1)}M`;
  if (rate >= 10_000) return `${(rate / 1_000).toFixed(0)}K`;
  if (rate >= 1_000) return `${(rate / 1_000).toFixed(1)}K`;
  return rate.toFixed(0);
}

export default function FactoryNode({ id, data, selected }: NodeProps<FactoryNodeType>) {
  const [expanded, setExpanded] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();
  const { updateNode, getNode } = useReactFlow();

  // When collapsed, clear the stored pixel height so React Flow remeasures from CSS
  // (manually resized nodes store an explicit height in style that prevents h-fit from working)
  useEffect(() => {
    if (!expanded) {
      const node = getNode(id);
      const currentWidth = (node?.style?.width as number | undefined) ?? 360;
      updateNode(id, { style: { width: currentWidth } });
    }
    const timer = setTimeout(() => {
      updateNodeInternals(id);
    }, 0);
    return () => clearTimeout(timer);
  }, [expanded, id, updateNodeInternals, updateNode, getNode]);

  const { setNodeRef, isOver } = useDroppable({
    id: `factory-drop-${data.factoryId}`,
    data: { factoryId: data.factoryId },
  });

  // Keep a ref to the latest data so callbacks never close over stale data
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const handleSelectionComplete = useCallback(
    (selectionData: {
      item: { className: string };
      recipe?: { className: string };
      extraction?: unknown;
      targetQuantityPerMinute: number;
      isExtraction: boolean;
    }) => {
      dataRef.current.onAddProductionLine?.(dataRef.current.factoryId, {
        itemClassName: selectionData.item.className,
        recipeClassName: selectionData.isExtraction ? 'EXTRACTION' : (selectionData.recipe?.className ?? ''),
        targetQuantityPerMinute: selectionData.targetQuantityPerMinute,
        isExtraction: selectionData.isExtraction,
      });
      setShowAddDialog(false);
    },
    [] // stable — reads from ref at call time
  );

  const locationColor = data.locationId?.color ?? '#f97316';
  const totalBuildings = data.productionLines.reduce((s, pl) => s + (pl.buildingCount ?? 0), 0);
  const totalPower = data.productionLines.reduce((s, pl) => s + (pl.powerConsumption ?? 0), 0);
  const activeLines = data.productionLines.filter(pl => pl.active);

  return (
    <>

      <div
        className={`bg-neutral-900 rounded-lg border-2 transition-colors ${
          selected ? 'border-orange-400' : 'border-neutral-700'
        } shadow-lg w-full ${expanded ? 'h-full' : 'h-fit'} flex flex-col overflow-visible`}
      >
        <NodeResizer
          minWidth={320}
          minHeight={120}
          isVisible={selected}
          lineClassName="!border-orange-400/50"
          handleClassName="!w-2.5 !h-2.5 !bg-orange-400 !border-2 !border-neutral-900 !rounded-sm"
        />
        {/* Orange accent bar */}
        <div className="h-1" style={{ background: locationColor }} />

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800">
          <Factory className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span className="text-white font-semibold text-sm flex-1 truncate">{data.name}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-neutral-400 hover:text-white transition-colors p-0.5"
              title={expanded ? 'Collapse' : 'Expand'}
              aria-label={expanded ? 'Collapse factory' : 'Expand factory'}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => data.onRemoveFromCanvas?.(data.factoryId)}
              className="text-neutral-500 hover:text-orange-400 transition-colors p-0.5"
              title="Remove from canvas"
              aria-label="Remove factory from canvas"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-neutral-500 hover:text-red-400 transition-colors p-0.5"
              title="Delete factory"
              aria-label="Delete factory"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Location badge */}
        {data.locationId && (
          <div className="px-3 py-1 bg-neutral-850">
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: `${locationColor}20`, color: locationColor }}
            >
              {data.locationId.name}
            </span>
          </div>
        )}

        {/* Stats bar */}
        {data.productionLines.length > 0 && (
          <div className="flex items-center gap-3 px-3 py-1.5 border-t border-neutral-800 bg-neutral-900/50">
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <Building2 className="w-3 h-3" />
              {totalBuildings} bldgs
            </span>
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <Zap className="w-3 h-3" />
              {totalPower.toFixed(0)} MW
            </span>
            <span className="text-xs text-neutral-500 ml-auto">
              {activeLines.length}/{data.productionLines.length} active
            </span>
          </div>
        )}

        {/* Production lines */}
        {expanded && (
          <div className="border-t border-neutral-800 flex-1 flex flex-col min-h-0">
            {data.isLoadingLines ? (
              <div className="flex items-center gap-2 px-3 py-3 text-neutral-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </div>
            ) : data.productionLines.length === 0 ? (
              <p className="px-3 py-3 text-xs text-neutral-600 italic">No production lines yet</p>
            ) : (
              <div
                className="overflow-y-auto flex-1 min-h-0 scrollbar-none -mx-4 px-4 pt-1 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflowX: 'visible' }}
              >
                <div className="divide-y divide-neutral-800">
                  {data.productionLines.map(pl => (
                    <ProductionLineRow
                    key={pl._id}
                    pl={pl}
                    factoryId={data.factoryId}
                    connectingItemClass={data.connectingItemClass}
                    connectingHandleType={data.connectingHandleType}
                    onDelete={dataRef.current.onDeleteProductionLine}
                  />
                ))}                </div>              </div>
            )}

            {/* Drop zone */}
            <div
              ref={setNodeRef}
              className={`flex items-center justify-center gap-2 px-3 py-2 border-t border-dashed transition-colors cursor-pointer ${
                isOver
                  ? 'border-orange-400 bg-orange-500/10 text-orange-400'
                  : 'border-neutral-700 text-neutral-600 hover:text-neutral-400 hover:border-neutral-500'
              }`}
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-xs">
                {isOver ? 'Drop to add production line' : 'Drop here or click to add'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add production line dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add Production Line — {data.name}</DialogTitle>
          </DialogHeader>
          <EnhancedItemRecipeSelector
            onSelectionComplete={handleSelectionComplete}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete &ldquo;{data.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              This will permanently delete the factory and all its production lines. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-600 text-neutral-200 hover:bg-neutral-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => data.onDelete?.(data.factoryId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Individual production line showing inputs (left) and outputs (right) */
function ProductionLineRow({ pl, factoryId, connectingItemClass, connectingHandleType, onDelete }: {
  pl: ProductionLineData;
  factoryId: string;
  connectingItemClass?: string | null;
  connectingHandleType?: 'source' | 'target' | null;
  onDelete?: (factoryId: string, lineId: string) => void;
}) {
  const buildings = pl.buildingCount ?? 1;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
    <div className={`relative py-2 text-xs group/plrow ${pl.active ? '' : 'opacity-40'}`}>
      {/* Recipe name header */}
      <div className="flex items-center gap-1.5 px-3 mb-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: pl.active ? '#22c55e' : '#6b7280' }}
        />
        <span className="text-neutral-200 font-medium truncate flex-1">{pl.recipeName || pl.itemName}</span>
        <span className="text-neutral-500">{buildings}×</span>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="ml-1 opacity-0 group-hover/plrow:opacity-100 transition-opacity text-neutral-600 hover:text-red-400 p-0.5"
          title="Delete production line"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Inputs and outputs */}
      <div className="flex gap-1 px-2">
        {/* Inputs (ingredients) — left side */}
        <div className="flex-1 space-y-0.5 min-w-0">
          {pl.ingredients.length > 0 ? (
            pl.ingredients.map((ing, i) => {
              const rate = calcRatePerMinute(ing.amount, pl.recipeTime, buildings);
              // Highlight when dragging from a source handle with the same item
              const isCompatible = connectingHandleType === 'source' && connectingItemClass === ing.item;
              return (
                <div key={`in-${i}`} className={`group/handle relative flex items-center gap-1 pl-1 pr-1 py-0.5 rounded-sm transition-colors ${isCompatible ? 'bg-blue-500/20 ring-1 ring-blue-400/50' : 'bg-blue-500/5 hover:bg-blue-500/10'}`}>
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={`pl-in-${factoryId}-${pl._id}-${ing.item}`}
                    className={`!absolute !w-3.5 !h-3.5 !border-2 !border-neutral-900 !rounded-full !top-1/2 !-translate-y-1/2 !-left-2.5 !transition-all hover:!scale-150 hover:!shadow-[0_0_6px_rgba(59,130,246,0.6)] group-hover/handle:!scale-125 group-hover/handle:!shadow-[0_0_4px_rgba(59,130,246,0.4)] ${isCompatible ? '!bg-blue-400 !scale-150 animate-pulse !border-blue-300' : '!bg-blue-500'}`}
                  />
                  <span className="text-blue-300 truncate flex-1" title={ing.name}>{ing.name}</span>
                  <span className="text-blue-400/70 font-mono text-[10px] flex-shrink-0">{formatRate(rate)}/m</span>
                </div>
              );
            })
          ) : (
            <div className="px-2 py-0.5 text-neutral-600 italic">No inputs</div>
          )}
        </div>

        {/* Arrow separator */}
        <div className="flex items-center px-0.5 text-neutral-600">→</div>

        {/* Outputs (products) — right side */}
        <div className="flex-1 space-y-0.5 min-w-0">
          {pl.products.map((prod, i) => {
            const rate = calcRatePerMinute(prod.amount, pl.recipeTime, buildings);
            // Highlight when dragging from a target handle with the same item
            const isCompatible = connectingHandleType === 'target' && connectingItemClass === prod.item;
            return (
              <div key={`out-${i}`} className={`group/handle relative flex items-center gap-1 pl-1 pr-1 py-0.5 rounded-sm transition-colors ${isCompatible ? 'bg-orange-500/20 ring-1 ring-orange-400/50' : 'bg-orange-500/5 hover:bg-orange-500/10'}`}>
                <span className="text-orange-300 truncate flex-1" title={prod.name}>{prod.name}</span>
                <span className="text-orange-400/70 font-mono text-[10px] flex-shrink-0">{formatRate(rate)}/m</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`pl-out-${factoryId}-${pl._id}-${prod.item}`}
                  className={`!absolute !w-3.5 !h-3.5 !border-2 !border-neutral-900 !rounded-full !top-1/2 !-translate-y-1/2 !-right-2.5 !transition-all hover:!scale-150 hover:!shadow-[0_0_6px_rgba(249,115,22,0.6)] group-hover/handle:!scale-125 group-hover/handle:!shadow-[0_0_4px_rgba(249,115,22,0.4)] ${isCompatible ? '!bg-orange-300 !scale-150 animate-pulse !border-orange-200' : '!bg-orange-400'}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent className="bg-neutral-900 border-neutral-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete &ldquo;{pl.recipeName || pl.itemName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            This will permanently remove this production line. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-neutral-800 border-neutral-600 text-neutral-200 hover:bg-neutral-700 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => { onDelete?.(factoryId, pl._id); setShowDeleteConfirm(false); }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
