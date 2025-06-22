"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "../components/Sidebar";
import { FactorySection } from "../components/FactorySection";
import { DismissibleNotification } from "@/components/ui/dismissible-notification";

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

export default function Home() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [activeFactoryId, setActiveFactoryId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false);
  const [factoryStatuses, setFactoryStatuses] = useState<Map<string, FactoryStatus>>(new Map());
  const { data: session, status } = useSession();

  // Check localStorage for welcome notification preference
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('factoryplanner-welcome-dismissed');
    setShowWelcomeNotification(!hasSeenWelcome && !!session);
  }, [session]);
  // Load existing factories on component mount - only if authenticated
  useEffect(() => {
    if (status === "loading") return; // Don't load until we know auth status
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
        
        // Set the first factory as active if none is selected
        if (sortedFactories.length > 0 && !activeFactoryId) {
          setActiveFactoryId(sortedFactories[0].id);
        }
      } catch (err) {
        console.error("Error loading factories:", err);
        setError("Failed to load factories");
      } finally {
        setIsLoading(false);
      }    };

    loadFactories();
  }, [status]); // Re-run when authentication status changes
  async function handleAddFactory() {
    // Check if user is authenticated
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
      
      // Clean up factory status
      setFactoryStatuses(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      
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
  const handleWelcomeDismiss = () => {
    setShowWelcomeNotification(false);
    localStorage.setItem('factoryplanner-welcome-dismissed', 'true');
  };

  const handleFactoryStatusChange = (id: string, status: FactoryStatus) => {
    setFactoryStatuses(prev => new Map(prev.set(id, status)));
  };

  return (
    <>      <Sidebar 
        factories={factories}
        activeFactoryId={activeFactoryId}
        onAddFactory={handleAddFactory}
        onSelectFactory={handleSelectFactory}
        onDeleteFactory={handleFactoryDelete}
        onReorderFactories={handleReorderFactories}
        factoryStatuses={factoryStatuses}
      /><main className="ml-64 flex-1 overflow-y-auto h-[calc(100vh-3rem)]">        <div className="flex flex-col items-center p-4 md:p-8">
          {/* Welcome notification for authenticated users */}
          {session && showWelcomeNotification && (
            <div className="w-full max-w-4xl mb-6">              <DismissibleNotification
                autoDismissMs={30000} // 30 seconds
                className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg"
                onDismiss={handleWelcomeDismiss}
              >
                <div className="flex items-center gap-3">
                  {session.user?.image && (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || "User"} 
                      className="w-12 h-12 rounded-full border-2 border-orange-500"
                    />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-100">
                      Welcome back, {session.user?.name?.split(' ')[0] || 'Engineer'}! 🏭
                    </h2>
                    <p className="text-sm text-neutral-400">
                      Ready to optimize your Satisfactory factories? Let's build something amazing!
                    </p>
                  </div>
                </div>
              </DismissibleNotification>
            </div>
          )}
          
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
            <div className="text-center mt-16">
              <div className="text-neutral-400 mb-4">
                {session ? 
                  "No factories yet. Click \"Add Factory\" to get started!" :
                  "Sign in to start planning your Satisfactory factories."
                }
              </div>
              {!session && (
                <a href="/auth/signin">
                  <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                    Sign In to Get Started
                  </button>
                </a>
              )}
            </div>
          ) : activeFactoryId ? (
            (() => {
              const activeFactory = factories.find(f => f.id === activeFactoryId);
              return activeFactory ? (                <FactorySection 
                  key={activeFactory.id} 
                  id={activeFactory.id}
                  initialName={activeFactory.name} 
                  initialTasks={activeFactory.tasks}
                  initialNotes={activeFactory.notes}
                  onNameChange={handleFactoryNameChange}
                  onDelete={handleFactoryDelete}
                  onStatusChange={handleFactoryStatusChange}
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
