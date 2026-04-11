'use client';

import React, { useCallback } from 'react';
import { Factory, GripVertical, Settings, Trash2, AlertTriangle, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FactoryStatus {
  isSatisfied: boolean;
  missingCount: number;
}

interface FactoryNavigationCardProps {
  factory: {
    id: string;
    name: string;
    order?: number;
  };
  isActive?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  status?: FactoryStatus;
  isOnCanvas?: boolean;
  draggableToCanvas?: boolean;
}

export default function FactoryNavigationCard({
  factory,
  isActive = false,
  onSelect,
  onDelete,
  onEdit,
  status,
  isOnCanvas,
  draggableToCanvas = false,
}: FactoryNavigationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: factory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${factory.name}"?`)) {
      onDelete(factory.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(factory.id);
  };

  const handleSelect = () => {
    onSelect(factory.id);
  };

  // HTML5 drag for dragging factory onto the flow canvas
  const handleNativeDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!draggableToCanvas || isOnCanvas) return;
      e.dataTransfer.setData('application/factory-id', factory.id);
      e.dataTransfer.effectAllowed = 'copy';
    },
    [factory.id, draggableToCanvas, isOnCanvas]
  );

  return (    <div
      ref={setNodeRef}
      style={style}
      draggable={draggableToCanvas && !isOnCanvas}
      onDragStart={handleNativeDragStart}
      className={`
        group relative bg-slate-800 rounded-lg p-3 cursor-pointer
        transition-all duration-200 hover:border-slate-600 hover:bg-slate-750
        ${isActive ? 'border border-blue-500 bg-blue-900/20' : status && !status.isSatisfied ? 'border border-red-500/30' : 'border border-slate-700'}
        ${isDragging ? 'opacity-50 z-50' : ''}
        ${draggableToCanvas && !isOnCanvas ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
      onClick={handleSelect}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-slate-500" />
      </div>      {/* Content */}
      <div className="flex items-center gap-3 ml-2">
        {/* Factory Icon with Status */}
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center relative
          ${isActive ? 'bg-blue-500/20' : 'bg-orange-500/20'}
        `}>
          <Factory className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-orange-400'}`} />
          
          {/* Status Indicator */}
          {status && (
            <div className={`
              absolute -top-1 -right-1 w-3 h-3 rounded-full border border-slate-800
              ${status.isSatisfied ? 'bg-green-500' : 'bg-red-500'}
            `} 
            title={status.isSatisfied ? 'All dependencies satisfied' : `${status.missingCount} missing ingredients`}
            />
          )}
        </div>

        {/* Factory Name and Status */}
        <div className="flex-1 min-w-0">          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white truncate" title={factory.name}>
              {factory.name}
            </h4>
            {status && !status.isSatisfied && (
              <div title={`${status.missingCount} missing ingredients`}>
                <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {status && (
              <span className={`text-xs px-1 rounded ${
                status.isSatisfied 
                  ? 'text-green-400 bg-green-900/20' 
                  : 'text-red-400 bg-red-900/20'
              }`}>
                {status.isSatisfied ? '✓' : `${status.missingCount} missing`}
              </span>
            )}
            {draggableToCanvas && (
              isOnCanvas ? (
                <span className="text-xs px-1 rounded text-orange-400 bg-orange-900/20 flex items-center gap-0.5">
                  <LayoutGrid className="w-2.5 h-2.5" />
                  on canvas
                </span>
              ) : (
                <span className="text-xs px-1 rounded text-slate-500 bg-slate-700/50">
                  drag to canvas
                </span>
              )
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-6 w-6 p-0 hover:bg-slate-700"
              title="Edit Factory"
            >
              <Settings className="w-3 h-3 text-slate-400" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400"
            title="Delete Factory"
          >
            <Trash2 className="w-3 h-3 text-slate-400" />
          </Button>
        </div>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 rounded-l-lg" />
      )}
    </div>
  );
}
