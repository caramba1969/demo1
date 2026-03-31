'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/Sidebar';
import FlowCanvas from '@/components/flow/FlowCanvas';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Factory {
  id: string;
  name: string;
  order?: number;
  tasks: Array<{ id: string; text: string; completed: boolean; createdAt: string }>;
  notes: Array<{ id: string; text: string; createdAt: string }>;
}

export default function FlowPage() {
  const { data: session, status } = useSession();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { setIsLoading(false); return; }

    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/factories');
        if (!res.ok) throw new Error('Failed to load factories');
        const data = await res.json();
        setFactories(
          data.map((f: { _id: string; name: string; order?: number; tasks?: Factory['tasks']; notes?: Factory['notes'] }) => ({
            id: f._id,
            name: f.name,
            order: f.order ?? 0,
            tasks: f.tasks ?? [],
            notes: f.notes ?? [],
          }))
        );
      } catch {
        setError('Failed to load factories');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [status]);

  const handleAddFactory = async () => {
    if (status !== 'authenticated') return;
    const res = await fetch('/api/factories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Factory' }),
    });
    if (!res.ok) return;
    const factory = await res.json();
    setFactories(f => [...f, { id: factory._id, name: factory.name, order: factory.order ?? 0, tasks: [], notes: [] }]);
  };

  const handleDeleteFactory = async (id: string) => {
    await fetch('/api/factories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setFactories(f => f.filter(x => x.id !== id));
  };

  const handleReorderFactories = async (reordered: Factory[]) => {
    setFactories(reordered);
    await fetch('/api/factories/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factories: reordered.map(f => ({ id: f.id, order: f.order })) }),
    });
  };

  return (
    <>
      <Sidebar
        factories={factories}
        onAddFactory={handleAddFactory}
        onSelectFactory={() => {}}
        onDeleteFactory={handleDeleteFactory}
        onReorderFactories={handleReorderFactories}
      />

      <main className="ml-64 flex-1 overflow-hidden h-[calc(100vh-3rem)]">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-3 border-b border-neutral-800 bg-neutral-900 flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">Visual Flow Editor</h1>
            <span className="text-neutral-500 text-sm">Double-click the canvas to create a factory · Drag from the palette to add production lines</span>
          </div>

          {/* Canvas area */}
          <div className="flex-1 overflow-hidden bg-neutral-950">
            {status === 'loading' || isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-400" />
                  <p className="text-neutral-400">Loading…</p>
                </div>
              </div>
            ) : status === 'unauthenticated' ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
                  <h2 className="text-xl font-semibold text-neutral-300 mb-2">Sign In Required</h2>
                  <p className="text-neutral-400">Please sign in to use the flow editor.</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <h2 className="text-xl font-semibold text-neutral-300 mb-2">Error</h2>
                  <p className="text-neutral-400">{error}</p>
                </div>
              </div>
            ) : (
              <FlowCanvas />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
