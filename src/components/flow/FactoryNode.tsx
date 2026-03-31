'use client';

import { useState, useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { useDroppable } from '@dnd-kit/core';
import { Factory, Zap, Building2, Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnhancedItemRecipeSelector from '@/components/EnhancedItemRecipeSelector';
import type { FlowFactoryData } from './flowTypes';

export interface FactoryNodeData extends FlowFactoryData {
  onDelete?: (factoryId: string) => void;
  onAddProductionLine?: (factoryId: string, payload: {
    itemClassName: string;
    recipeClassName: string;
    targetQuantityPerMinute: number;
    isExtraction: boolean;
  }) => void;
}

export type FactoryNodeType = Node<FactoryNodeData, 'factoryNode'>;

export default function FactoryNode({ data, selected }: NodeProps<FactoryNodeType>) {
  const [expanded, setExpanded] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `factory-drop-${data.factoryId}`,
    data: { factoryId: data.factoryId },
  });

  const handleSelectionComplete = useCallback(
    (selectionData: {
      item: { className: string };
      recipe?: { className: string };
      extraction?: unknown;
      targetQuantityPerMinute: number;
      isExtraction: boolean;
    }) => {
      data.onAddProductionLine?.(data.factoryId, {
        itemClassName: selectionData.item.className,
        recipeClassName: selectionData.isExtraction ? 'EXTRACTION' : (selectionData.recipe?.className ?? ''),
        targetQuantityPerMinute: selectionData.targetQuantityPerMinute,
        isExtraction: selectionData.isExtraction,
      });
      setShowAddDialog(false);
    },
    [data]
  );

  const locationColor = data.locationId?.color ?? '#f97316';
  const totalBuildings = data.productionLines.reduce((s, pl) => s + (pl.buildingCount ?? 0), 0);
  const totalPower = data.productionLines.reduce((s, pl) => s + (pl.powerConsumption ?? 0), 0);
  const activeLines = data.productionLines.filter(pl => pl.active);

  return (
    <>
      {/* Target handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-400 border-2 border-neutral-900"
      />

      <div
        className={`bg-neutral-900 rounded-lg border-2 transition-colors ${
          selected ? 'border-orange-400' : 'border-neutral-700'
        } shadow-lg overflow-hidden`}
        style={{ width: 280 }}
      >
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
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => data.onDelete?.(data.factoryId)}
              className="text-neutral-500 hover:text-red-400 transition-colors p-0.5"
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
          <div className="border-t border-neutral-800">
            {data.isLoadingLines ? (
              <div className="flex items-center gap-2 px-3 py-3 text-neutral-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </div>
            ) : data.productionLines.length === 0 ? (
              <p className="px-3 py-3 text-xs text-neutral-600 italic">No production lines yet</p>
            ) : (
              <div className="divide-y divide-neutral-800 max-h-48 overflow-y-auto">
                {data.productionLines.map(pl => (
                  <div
                    key={pl._id}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs ${
                      pl.active ? '' : 'opacity-40'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: pl.active ? '#22c55e' : '#6b7280' }}
                    />
                    <span className="text-neutral-300 flex-1 truncate">{pl.itemName}</span>
                    <span className="text-neutral-500 flex-shrink-0">
                      {pl.buildingCount ?? 0}×
                    </span>
                    <span className="text-orange-400 font-mono flex-shrink-0">
                      {(pl.actualQuantityPerMinute ?? pl.targetQuantityPerMinute).toFixed(0)}/m
                    </span>
                  </div>
                ))}
              </div>
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

      {/* Source handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-400 border-2 border-neutral-900"
      />

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
    </>
  );
}
