"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { FactorySection } from "../components/FactorySection";

interface Factory {
  id: string; 
  name: string;
  order?: number;
  tasks: Array<{ id: string; text: string; completed: boolean; createdAt: string }>;
  notes: Array<{ id: string; text: string; createdAt: string }>;
}

export default function Home() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [activeFactoryId, setActiveFactoryId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing factories on component mount
  useEffect(() => {
    const loadFactories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/factories");
        
        if (!response.ok) {
          throw new Error("Failed to load factories");
        }
        
        const factoriesData = await response.json();
        const sortedFactories = factoriesData.map((factory: { 
          _id: string; 
          name: string;
          order?: number;
          tasks?: Array<{ id: string; text: string; completed: boolean; createdAt: string }>;
          notes?: Array<{ id: string; text: string; createdAt: string }>;
        }) => ({
          id: factory._id,
          name: factory.name,
          order: factory.order || 0,
          tasks: factory.tasks || [],
          notes: factory.notes || []
        }));
        
        setFactories(sortedFactories);
        
        // Set the first factory as active if none is selected
        if (sortedFactories.length > 0 && !activeFactoryId) {
          setActiveFactoryId(sortedFactories[0].id);
        }
      } catch (err) {
        console.error("Error loading factories:", err);
        setError("Failed to load factories");
      } finally {
        setIsLoading(false);
      }
    };

    loadFactories();
  }, []);

  async function handleAddFactory() {
    const name = "A new factory";
    try {
      const res = await fetch("/api/factories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create factory");
      const factory = await res.json();
      const newFactory = { 
        id: factory._id, 
        name: factory.name,
        order: factory.order || 0,
        tasks: factory.tasks || [],
        notes: factory.notes || []
      };
      setFactories(f => [...f, newFactory]);
      
      // Set the new factory as active
      setActiveFactoryId(newFactory.id);
    } catch (err) {
      console.error("Error creating factory:", err);
      setError("Failed to create factory");
    }
  }

  const handleSelectFactory = (id: string) => {
    setActiveFactoryId(id);
  };

  const handleReorderFactories = async (reorderedFactories: Factory[]) => {
    // Optimistically update the UI
    setFactories(reorderedFactories);
    
    try {
      const response = await fetch("/api/factories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          factories: reorderedFactories.map(f => ({ id: f.id, order: f.order }))
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to reorder factories");
      }
    } catch (err) {
      console.error("Error reordering factories:", err);
      setError("Failed to reorder factories");
      // Reload factories to get the correct order
      window.location.reload();
    }
  };

  const handleFactoryNameChange = (id: string, newName: string) => {
    setFactories(factories => 
      factories.map(factory => 
        factory.id === id ? { ...factory, name: newName } : factory
      )
    );
  };

  const handleFactoryDelete = async (id: string) => {
    try {
      const response = await fetch("/api/factories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete factory");
      }
      
      setFactories(factories => factories.filter(factory => factory.id !== id));
      
      // If the deleted factory was active, select the first remaining factory
      if (activeFactoryId === id) {
        const remainingFactories = factories.filter(factory => factory.id !== id);
        setActiveFactoryId(remainingFactories.length > 0 ? remainingFactories[0].id : undefined);
      }
    } catch (err) {
      console.error("Error deleting factory:", err);
      setError("Failed to delete factory");
    }
  };

  return (
    <>
      <Sidebar 
        factories={factories}
        activeFactoryId={activeFactoryId}
        onAddFactory={handleAddFactory}
        onSelectFactory={handleSelectFactory}
        onDeleteFactory={handleFactoryDelete}
        onReorderFactories={handleReorderFactories}
      />
      <main className="ml-64 flex-1 overflow-y-auto h-[calc(100vh-3rem)]">
        <div className="flex flex-col items-center p-4 md:p-8">
          {isLoading ? (
            <div className="text-neutral-400 mt-16 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
              Loading factories...
            </div>
          ) : error ? (
            <div className="text-red-400 mt-16">
              {error}
              <button 
                onClick={() => window.location.reload()} 
                className="ml-2 text-blue-400 hover:text-blue-300 underline"
              >
                Retry
              </button>
            </div>
          ) : factories.length === 0 ? (
            <div className="text-neutral-400 mt-16">No factories yet. Click &quot;Add Factory&quot; to get started.</div>
          ) : activeFactoryId ? (
            (() => {
              const activeFactory = factories.find(f => f.id === activeFactoryId);
              return activeFactory ? (
                <FactorySection 
                  key={activeFactory.id} 
                  id={activeFactory.id}
                  initialName={activeFactory.name} 
                  initialTasks={activeFactory.tasks}
                  initialNotes={activeFactory.notes}
                  onNameChange={handleFactoryNameChange}
                  onDelete={handleFactoryDelete}
                />
              ) : (
                <div className="text-neutral-400 mt-16">Factory not found.</div>
              );
            })()
          ) : (
            <div className="text-neutral-400 mt-16">Select a factory from the sidebar to get started.</div>
          )}
        </div>
      </main>
    </>
  );
}
