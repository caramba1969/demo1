'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ErrorNotification } from '@/components/ui/error-notification';
import { useErrorHandler, UserError, handleFetchError } from '@/lib/errors';

export default function MigratePage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UserError | null>(null);
  const { handleError } = useErrorHandler();

  const handleMigrate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/admin/migrate-factories', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const userError = await handleFetchError(response);
        setError(userError);
        return;
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      const userError = handleError(err);
      setError(userError);
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

      {error && (
        <div className="mb-6">
          <ErrorNotification 
            error={error} 
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {result && (
        <div className="p-4 rounded bg-green-100 border border-green-200">
          <h3 className="font-bold mb-2 text-green-800">Migration Complete:</h3>
          <pre className="text-sm overflow-auto text-green-700">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
