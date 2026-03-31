'use client';

import { useCallback, useRef, useState } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { PaletteItem } from './flowTypes';

interface UseProductionLineDropOptions {
  onAddProductionLine: (
    factoryId: string,
    payload: {
      itemClassName: string;
      recipeClassName: string;
      targetQuantityPerMinute: number;
      isExtraction: boolean;
    }
  ) => Promise<void>;
}

export function useProductionLineDrop({ onAddProductionLine }: UseProductionLineDropOptions) {
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState(false);
  const pendingDropRef = useRef<{
    factoryId: string;
    paletteItem: PaletteItem;
  } | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{
    factoryId: string;
    paletteItem: PaletteItem;
    mode: 'pick-recipe' | 'pick-quantity';
  } | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.data.current?.paletteItem) {
      setIsDraggingFromPalette(true);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDraggingFromPalette(false);

      const paletteItem = event.active.data.current?.paletteItem as PaletteItem | undefined;
      if (!paletteItem) return;

      const overId = event.over?.id as string | undefined;
      if (!overId?.startsWith('factory-drop-')) return;

      const factoryId = overId.replace('factory-drop-', '');

      if (paletteItem.type === 'item') {
        // Need to pick a recipe first
        setPendingDrop({ factoryId, paletteItem, mode: 'pick-recipe' });
      } else {
        // Recipe already known — just need quantity
        setPendingDrop({ factoryId, paletteItem, mode: 'pick-quantity' });
      }

      pendingDropRef.current = { factoryId, paletteItem };
    },
    []
  );

  const confirmDrop = useCallback(
    async (recipeClassName: string, targetQuantity: number, isExtraction: boolean) => {
      if (!pendingDrop) return;
      await onAddProductionLine(pendingDrop.factoryId, {
        itemClassName: pendingDrop.paletteItem.itemClassName,
        recipeClassName,
        targetQuantityPerMinute: targetQuantity,
        isExtraction,
      });
      setPendingDrop(null);
    },
    [pendingDrop, onAddProductionLine]
  );

  const cancelDrop = useCallback(() => {
    setPendingDrop(null);
  }, []);

  return {
    isDraggingFromPalette,
    pendingDrop,
    handleDragStart,
    handleDragEnd,
    confirmDrop,
    cancelDrop,
  };
}
