'use client';

import { useDraggable } from '@dnd-kit/core';
import { Package, Wrench } from 'lucide-react';
import type { PaletteItem } from './flowTypes';

interface PaletteItemCardProps {
  item: PaletteItem;
  isDragOverlay?: boolean;
}

export default function PaletteItemCard({ item, isDragOverlay = false }: PaletteItemCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}-${item.itemClassName}-${item.recipeClassName ?? ''}`,
    data: { paletteItem: item },
  });

  const style = isDragOverlay
    ? { opacity: 1, transform: 'scale(1.05)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }
    : { opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-neutral-800 border border-neutral-700 hover:border-orange-500/50 hover:bg-neutral-750 cursor-grab active:cursor-grabbing transition-colors select-none"
    >
      <div className="flex-shrink-0 w-6 h-6 rounded bg-neutral-700 flex items-center justify-center">
        {item.type === 'recipe' ? (
          <Wrench className="w-3.5 h-3.5 text-orange-400" />
        ) : (
          <Package className="w-3.5 h-3.5 text-blue-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-200 truncate leading-tight">{item.name}</p>
        {item.description && (
          <p className="text-xs text-neutral-500 truncate leading-tight">{item.description}</p>
        )}
      </div>
    </div>
  );
}
