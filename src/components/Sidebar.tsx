'use client';

import { FC, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { Plus, Layers, Filter, FilterX } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import FactoryNavigationCard from './FactoryNavigationCard';

interface Factory {
  id: string;
  name: string;
  order?: number;
  tasks: Array<{ id: string; text: string; completed: boolean; createdAt: string }>;
  notes: Array<{ id: string; text: string; createdAt: string }>;
}

interface FactoryStatus {
  isSatisfied: boolean;
  missingCount: number;
}

interface SidebarProps {
  factories: Factory[];
  activeFactoryId?: string;
  onAddFactory: () => void;
  onSelectFactory: (id: string) => void;
  onDeleteFactory: (id: string) => void;
  onReorderFactories: (factories: Factory[]) => void;
  onEditFactory?: (id: string) => void;
  factoryStatuses?: Map<string, FactoryStatus>;
}

export const Sidebar: FC<SidebarProps> = ({ 
  factories,
  activeFactoryId,
  onAddFactory,
  onSelectFactory,
  onDeleteFactory,
  onReorderFactories,
  onEditFactory,
  factoryStatuses
}) => {
  const { data: session, status } = useSession();
  const [showOnlyUnsatisfied, setShowOnlyUnsatisfied] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = factories.findIndex(f => f.id === active.id);
      const newIndex = factories.findIndex(f => f.id === over.id);
      
      const reorderedFactories = arrayMove(factories, oldIndex, newIndex).map((factory, index) => ({
        ...factory,
        order: index
      }));
      
      onReorderFactories(reorderedFactories);    }
  };

  // Filter factories based on satisfaction status if filter is active
  const filteredFactories = showOnlyUnsatisfied && factoryStatuses
    ? factories.filter(factory => {
        const status = factoryStatuses.get(factory.id);
        return status && !status.isSatisfied;
      })
    : factories;

  const hasUnsatisfiedFactories = factoryStatuses && 
    Array.from(factoryStatuses.values()).some(s => !s.isSatisfied);

  return (
    <aside className="fixed left-0 top-12 w-64 h-[calc(100vh-3rem)] bg-neutral-950 border-r border-neutral-800 flex flex-col gap-2 p-3 z-40 overflow-y-auto">
      {/* Add Factory Button - Only show for authenticated users */}
      {session && (
        <div className="flex flex-col gap-2 mb-4">
          <Button
            variant="default"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            aria-label="Add Factory"
            onClick={onAddFactory}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Factory
          </Button>
        </div>
      )}

      {/* Factories Navigation */}
      <div className="flex-1">
        {session ? (
          <>            {factories.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-medium text-slate-300">Factories</h3>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                    {factories.length}
                  </span>                  {factoryStatuses && factoryStatuses.size > 0 && (() => {
                    const satisfiedCount = Array.from(factoryStatuses.values()).filter(s => s.isSatisfied).length;
                    const totalTracked = factoryStatuses.size;
                    const unsatisfiedCount = totalTracked - satisfiedCount;
                    return (
                      <span 
                        className={`text-xs px-2 py-1 rounded cursor-help ${
                          satisfiedCount === totalTracked 
                            ? 'text-green-400 bg-green-900/20' 
                            : 'text-orange-400 bg-orange-900/20'
                        }`}
                        title={unsatisfiedCount > 0 
                          ? `${unsatisfiedCount} factories need attention`
                          : 'All factories satisfied'                        }
                      >
                        {satisfiedCount}/{totalTracked} ✓
                      </span>
                    );
                  })()}
                </div>
                
                {/* Filter Controls */}
                {hasUnsatisfiedFactories && (
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOnlyUnsatisfied(!showOnlyUnsatisfied)}
                      className={`text-xs h-6 px-2 ${
                        showOnlyUnsatisfied 
                          ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' 
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      {showOnlyUnsatisfied ? (
                        <>
                          <FilterX className="w-3 h-3 mr-1" />
                          Show All
                        </>
                      ) : (
                        <>
                          <Filter className="w-3 h-3 mr-1" />
                          Show Issues Only
                        </>
                      )}
                    </Button>
                    {showOnlyUnsatisfied && (
                      <span className="text-xs text-slate-500">
                        {filteredFactories.length} of {factories.length}
                      </span>
                    )}
                  </div>
                )}
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >                  <SortableContext
                    items={filteredFactories.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >                    <div className="flex flex-col gap-2">
                      {filteredFactories.map((factory) => (
                        <FactoryNavigationCard
                          key={factory.id}
                          factory={factory}
                          isActive={factory.id === activeFactoryId}
                          onSelect={onSelectFactory}
                          onDelete={onDeleteFactory}
                          onEdit={onEditFactory}
                          status={factoryStatuses?.get(factory.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}            
            {factories.length === 0 && (
              <div className="text-center text-slate-500 text-sm mt-8">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No factories yet</p>
                <p className="text-xs mt-1">Click "Add Factory" to get started</p>
              </div>
            )}
            
            {factories.length > 0 && filteredFactories.length === 0 && showOnlyUnsatisfied && (
              <div className="text-center text-slate-500 text-sm mt-8">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>All factories satisfied!</p>
                <p className="text-xs mt-1">No issues found</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-slate-500 text-sm mt-8">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Sign in to view factories</p>
            <p className="text-xs mt-1">Your factories will appear here</p>
          </div>
        )}
      </div>
    </aside>
  );
};
