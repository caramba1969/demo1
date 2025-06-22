'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import FactoryDependencyGraph from '@/components/FactoryDependencyGraph';
import { Sidebar } from '@/components/Sidebar';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Factory {
  id: string;
  name: string;
  order?: number;
  tasks: Array<{ id: string; text: string; completed: boolean; createdAt: string }>;
  notes: Array<{ id: string; text: string; createdAt: string }>;
}

export default function GraphPage() {
  const { data: session, status } = useSession();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load factories for the sidebar
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setIsLoading(false);
      return;
    }

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
      } catch (err) {
        console.error("Error loading factories:", err);
        setError("Failed to load factories");
      } finally {
        setIsLoading(false);
      }
    };

    loadFactories();
  }, [status]);

  const handleAddFactory = async () => {
    if (status !== "authenticated") {
      setError("You must be logged in to add factories");
      return;
    }

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
    } catch (err) {
      console.error("Error creating factory:", err);
      setError("Failed to create factory");
    }
  };

  const handleDeleteFactory = async (id: string) => {
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
    } catch (err) {
      console.error("Error deleting factory:", err);
      setError("Failed to delete factory");
    }
  };

  const handleReorderFactories = async (reorderedFactories: Factory[]) => {
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
      window.location.reload();
    }
  };

  return (
    <>
      <Sidebar 
        factories={factories}
        onAddFactory={handleAddFactory}
        onSelectFactory={() => {}} // No selection needed for graph page
        onDeleteFactory={handleDeleteFactory}
        onReorderFactories={handleReorderFactories}
      />
      
      <main className="ml-64 flex-1 overflow-hidden h-[calc(100vh-3rem)]">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-slate-700 bg-slate-900">
            <h1 className="text-2xl font-bold text-white mb-2">Factory Dependency Graph</h1>
            <p className="text-slate-400">
              Visualize the import/export relationships between your factories
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {status === "loading" || isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-400" />
                  <p className="text-slate-400">Loading factories...</p>
                </div>
              </div>
            ) : status === "unauthenticated" ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h2 className="text-xl font-semibold text-slate-300 mb-2">Sign In Required</h2>
                  <p className="text-slate-400">
                    Please sign in to view your factory dependency graph.
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <h2 className="text-xl font-semibold text-slate-300 mb-2">Error</h2>
                  <p className="text-slate-400">{error}</p>
                </div>
              </div>
            ) : factories.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h2 className="text-xl font-semibold text-slate-300 mb-2">No Factories</h2>
                  <p className="text-slate-400">
                    Create some factories to see their dependency relationships.
                  </p>
                </div>
              </div>
            ) : (
              <FactoryDependencyGraph factories={factories} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
