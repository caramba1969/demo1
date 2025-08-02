'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorNotification } from '@/components/ui/error-notification';
import { getUserFriendlyError, UserError } from '@/lib/errors';

export default function ErrorDemoPage() {
  const [error, setError] = useState<UserError | null>(null);

  const simulateNetworkError = () => {
    const networkError = new TypeError('Failed to fetch');
    setError(getUserFriendlyError(networkError));
  };

  const simulateAuthError = () => {
    const authError = { status: 401, message: 'Unauthorized access' };
    setError(getUserFriendlyError(authError));
  };

  const simulateValidationError = () => {
    const validationError = { status: 400, message: 'Please check your input and make sure all required fields are filled correctly.' };
    setError(getUserFriendlyError(validationError));
  };

  const simulateServerError = () => {
    const serverError = { status: 500, message: 'Internal server error' };
    setError(getUserFriendlyError(serverError));
  };

  const simulateFactoryError = () => {
    const factoryError = { message: 'Factory not found or access denied' };
    setError(getUserFriendlyError(factoryError));
  };

  const simulateRecipeError = () => {
    const recipeError = { message: 'Recipe does not produce the specified item' };
    setError(getUserFriendlyError(recipeError));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User-Friendly Error Messages Demo</h1>
      
      <div className="mb-8">
        <p className="text-gray-300 mb-4">
          This demo shows how common errors are now displayed with user-friendly messages instead of technical error codes.
        </p>
      </div>

      {error && (
        <div className="mb-8">
          <ErrorNotification 
            error={error} 
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Button 
          onClick={simulateNetworkError}
          className="bg-red-600 hover:bg-red-700"
        >
          Network Error
        </Button>

        <Button 
          onClick={simulateAuthError}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          Auth Error
        </Button>

        <Button 
          onClick={simulateValidationError}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Validation Error
        </Button>

        <Button 
          onClick={simulateServerError}
          className="bg-red-800 hover:bg-red-900"
        >
          Server Error
        </Button>

        <Button 
          onClick={simulateFactoryError}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Factory Error
        </Button>

        <Button 
          onClick={simulateRecipeError}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Recipe Error
        </Button>
      </div>

      <div className="bg-neutral-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Before vs After</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-red-400 mb-2">❌ Before (Technical)</h3>
            <div className="bg-red-900/20 p-3 rounded text-sm font-mono text-red-300">
              Error: TypeError: Failed to fetch<br />
              Status: 401 Unauthorized<br />
              console.error('Error occurred')
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-green-400 mb-2">✅ After (User-Friendly)</h3>
            <div className="bg-green-900/20 p-3 rounded text-sm text-green-300">
              "Unable to connect to the server. Please check your internet connection and try again."<br />
              <br />
              "Please sign in to continue."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}