'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function MigratePage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleMigrate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/migrate-factories', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to migrate' });
    }
    setLoading(false);
  };

  if (!session) {
    return <div className="p-8">Please sign in first</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Fix Factory User Assignment</h1>
        <div className="bg-slate-100 p-4 rounded mb-4">
        <p><strong>Current User:</strong> {session.user?.email}</p>
        <p><strong>User ID:</strong> {(session.user as any)?.id}</p>
      </div>

      <Button 
        onClick={handleMigrate} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Migrating...' : 'Assign All Factories to My Account'}
      </Button>

      {result && (
        <div className={`p-4 rounded ${result.error ? 'bg-red-100' : 'bg-green-100'}`}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
