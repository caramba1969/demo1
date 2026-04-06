'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle, Loader2, FileJson } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function AdminPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    itemsImported?: number;
    recipesImported?: number;
  } | null>(null);

  // --- File upload converter state ---
  const [convertFile, setConvertFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [convertResult, setConvertResult] = useState<{
    success: boolean;
    message: string;
    itemsImported?: number;
    recipesImported?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      setConvertFile(file);
      setConvertResult(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setConvertFile(file);
      setConvertResult(null);
    }
  };

  const handleConvertAndImport = async () => {
    if (!convertFile) return;
    try {
      setConverting(true);
      setConvertResult(null);

      const formData = new FormData();
      formData.append('file', convertFile);

      const response = await fetch('/api/admin/convert-and-import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setConvertResult({
          success: true,
          message: result.message,
          itemsImported: result.itemsImported,
          recipesImported: result.recipesImported,
        });
      } else {
        setConvertResult({
          success: false,
          message: result.error || 'Conversion failed',
        });
      }
    } catch (error) {
      setConvertResult({ success: false, message: 'Network error during conversion' });
    } finally {
      setConverting(false);
    }
  };

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

                {/* ---- Raw Game Data Converter ---- */}
                <div className="bg-slate-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Convert Raw Game Data
                  </h2>
                  <p className="text-slate-300 mb-6">
                    Upload a raw Satisfactory game export (<code className="text-orange-300">en-GB.json</code> or <code className="text-orange-300">Docs.json</code>)
                    and it will be converted and imported in one step. Supports UTF-16 encoded files exported directly from the game.
                  </p>

                  {/* Drop zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
                      isDragging
                        ? 'border-orange-400 bg-orange-500/10'
                        : convertFile
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {convertFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileJson className="w-8 h-8 text-green-400" />
                        <p className="text-green-400 font-medium">{convertFile.name}</p>
                        <p className="text-slate-400 text-sm">
                          {(convertFile.size / 1024 / 1024).toFixed(1)} MB — click to change
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileJson className="w-8 h-8 text-slate-400" />
                        <p className="text-slate-300">Drag &amp; drop your <code className="text-orange-300">en-GB.json</code> here</p>
                        <p className="text-slate-500 text-sm">or click to browse</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleConvertAndImport}
                    disabled={!convertFile || converting}
                    className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                  >
                    {converting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting &amp; Importing…
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Convert &amp; Import
                      </>
                    )}
                  </Button>

                  {convertResult && (
                    <div className={`mt-6 p-4 rounded-lg border ${
                      convertResult.success
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {convertResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        <p className={`font-medium ${convertResult.success ? 'text-green-400' : 'text-red-400'}`}>
                          {convertResult.success ? 'Import Successful' : 'Conversion Failed'}
                        </p>
                      </div>
                      <p className="text-slate-300">{convertResult.message}</p>
                      {convertResult.success && (
                        <div className="mt-2 text-sm text-slate-400">
                          <p>Items imported: {convertResult.itemsImported}</p>
                          <p>Recipes imported: {convertResult.recipesImported}</p>
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
