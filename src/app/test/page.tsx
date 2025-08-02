'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ErrorNotification } from '@/components/ui/error-notification';
import { useErrorHandler, UserError, handleFetchError } from '@/lib/errors';

export default function TestPage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UserError | null>(null);
  const { handleError } = useErrorHandler();

  const testFactoryCreation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/test/factory-creation', {
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

  const testRealFactoryCreation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/factories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Real Test Factory' })
      });
      
      if (!response.ok) {
        const userError = await handleFetchError(response);
        setError(userError);
        return;
      }
      
      const data = await response.json();
      setResult({ type: 'real', ...data });
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
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Factory Creation Test</h1>
      
      <div className="bg-slate-100 p-4 rounded mb-4">
        <p><strong>Current User:</strong> {session.user?.email}</p>
        <p><strong>User ID:</strong> {(session.user as any)?.id}</p>
      </div>

      <div className="space-x-4 mb-6">
        <Button 
          onClick={testFactoryCreation} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Testing...' : 'Test Factory Creation Logic'}
        </Button>

        <Button 
          onClick={testRealFactoryCreation} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? 'Creating...' : 'Create Real Factory'}
        </Button>
      </div>

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
          <h3 className="font-bold mb-2 text-green-800">Success:</h3>
          <pre className="text-sm overflow-auto text-green-700">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
