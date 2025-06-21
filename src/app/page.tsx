"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { FactorySection } from "../components/FactorySection";
export default function Home() {
  const [factories, setFactories] = useState<{ 
    id: string; 
    name: string;
    tasks: Array<{ id: string; text: string; completed: boolean; createdAt: string }>;
    notes: Array<{ id: string; text: string; createdAt: string }>;
  }[]>([]);
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
        setFactories(factoriesData.map((factory: { 
          _id: string; 
          name: string;
          tasks?: Array<{ id: string; text: string; completed: boolean; createdAt: string }>;
          notes?: Array<{ id: string; text: string; createdAt: string }>;
        }) => ({
          id: factory._id,
          name: factory.name,
          tasks: factory.tasks || [],
          notes: factory.notes || []
        })));
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
      setFactories(f => [...f, { 
        id: factory._id, 
        name: factory.name,
        tasks: factory.tasks || [],
        notes: factory.notes || []
      }]);
    } catch (err) {
      console.error("Error creating factory:", err);
      setError("Failed to create factory");
    }
  }

  const handleFactoryNameChange = (id: string, newName: string) => {
    setFactories(factories => 
      factories.map(factory => 
        factory.id === id ? { ...factory, name: newName } : factory
      )
    );
  };

  const handleFactoryDelete = (id: string) => {
    setFactories(factories => factories.filter(factory => factory.id !== id));
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar onAddFactory={handleAddFactory} />
      <main className="flex-1 flex flex-col items-center p-4 md:p-8">
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
        ) : (
          factories.map(f => (
            <FactorySection 
              key={f.id} 
              id={f.id}
              initialName={f.name} 
              initialTasks={f.tasks}
              initialNotes={f.notes}
              onNameChange={handleFactoryNameChange}
              onDelete={handleFactoryDelete}
            />
          ))
        )}
      </main>
    </div>
  );
}
