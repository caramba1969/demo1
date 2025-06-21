'use client';

import { FC } from "react";
import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { Plus, Layers } from "lucide-react";
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

interface SidebarProps {
  factories: Factory[];
  activeFactoryId?: string;
  onAddFactory: () => void;
  onSelectFactory: (id: string) => void;
  onDeleteFactory: (id: string) => void;
  onReorderFactories: (factories: Factory[]) => void;
  onEditFactory?: (id: string) => void;
}

export const Sidebar: FC<SidebarProps> = ({ 
  factories,
  activeFactoryId,
  onAddFactory,
  onSelectFactory,
  onDeleteFactory,
  onReorderFactories,
  onEditFactory
}) => {
  const { data: session, status } = useSession();
  
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
      
      onReorderFactories(reorderedFactories);
    }
  };

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
          <>
            {factories.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-medium text-slate-300">Factories</h3>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                    {factories.length}
                  </span>
                </div>
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={factories.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {factories.map((factory) => (
                        <FactoryNavigationCard
                          key={factory.id}
                          factory={factory}
                          isActive={factory.id === activeFactoryId}
                          onSelect={onSelectFactory}
                          onDelete={onDeleteFactory}
                          onEdit={onEditFactory}
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
