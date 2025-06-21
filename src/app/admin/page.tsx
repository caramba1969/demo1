'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function AdminPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    itemsImported?: number;
    recipesImported?: number;
  } | null>(null);

  const handleImportData = async () => {
    try {
      setImporting(true);
      setImportResult(null);

      const response = await fetch('/api/admin/import-data', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message,
          itemsImported: result.itemsImported,
          recipesImported: result.recipesImported,
        });
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Import failed',
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Network error during import',
      });
    } finally {
      setImporting(false);
    }
  };  // Empty functions for sidebar - admin doesn't manage factories
  const handleAddFactory = () => {
    // Could redirect to main page or show message
  };

  const handleSelectFactory = (id: string) => {
    // Admin doesn't select factories
  };

  const handleDeleteFactory = (id: string) => {
    // Admin doesn't delete factories
  };

  const handleReorderFactories = (factories: any[]) => {
    // Admin doesn't reorder factories
  };

  return (
    <>
      <Sidebar 
        factories={[]}
        onAddFactory={handleAddFactory}
        onSelectFactory={handleSelectFactory}
        onDeleteFactory={handleDeleteFactory}
        onReorderFactories={handleReorderFactories}
      />
      <main className="ml-64 flex-1 overflow-y-auto h-[calc(100vh-3rem)]">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 min-h-full">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
              <div className="flex items-center gap-3 mb-8">
                <Upload className="w-8 h-8 text-orange-400" />
                <h1 className="text-3xl font-bold text-white">Factory Planner Admin</h1>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Import Satisfactory Data</h2>
                  <p className="text-slate-300 mb-6">
                    Import items and recipes from the Satisfactory game data into the database.
                    This will populate the item and recipe databases needed for production planning.
                  </p>

                  <Button
                    onClick={handleImportData}
                    disabled={importing}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing Data...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Satisfactory Data
                      </>
                    )}
                  </Button>

                  {importResult && (
                    <div className={`mt-6 p-4 rounded-lg border ${
                      importResult.success 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {importResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        <p className={`font-medium ${
                          importResult.success ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {importResult.success ? 'Import Successful' : 'Import Failed'}
                        </p>
                      </div>
                      <p className="text-slate-300">{importResult.message}</p>
                      {importResult.success && importResult.itemsImported && importResult.recipesImported && (
                        <div className="mt-2 text-sm text-slate-400">
                          <p>Items imported: {importResult.itemsImported}</p>
                          <p>Recipes imported: {importResult.recipesImported}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Database Status</h2>
                  <p className="text-slate-300">
                    After importing the data, you'll be able to:
                  </p>
                  <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
                    <li>Select items from the Satisfactory database</li>
                    <li>Choose recipes for production planning</li>
                    <li>Calculate production requirements and building counts</li>
                    <li>Plan complex factory layouts with dependencies</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
