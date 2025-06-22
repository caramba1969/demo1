'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, X, Factory, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FactoryImport {
  _id: string;
  itemClassName: string;
  requiredAmount: number;
  sourceFactoryId: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface ImportsListProps {
  factoryId: string;
  onImportDeleted?: () => void;
}

export default function ImportsList({ factoryId, onImportDeleted }: ImportsListProps) {
  const [imports, setImports] = useState<FactoryImport[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load imports for this factory
  useEffect(() => {
    const loadImports = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/factories/${factoryId}/imports`);
        if (!response.ok) throw new Error('Failed to fetch imports');
        
        const data = await response.json();
        setImports(data.imports || []);
      } catch (error) {
        console.error('Error loading imports:', error);
      } finally {
        setLoading(false);
      }
    };

    if (factoryId) {
      loadImports();
    }
  }, [factoryId]);

  // Delete an import
  const handleDeleteImport = async (importId: string) => {
    try {
      setDeleting(importId);
      
      const response = await fetch(`/api/factories/${factoryId}/imports?importId=${importId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete import');

      // Remove from local state
      setImports(prev => prev.filter(imp => imp._id !== importId));
      
      // Notify parent component
      if (onImportDeleted) {
        onImportDeleted();
      }

    } catch (error) {
      console.error('Error deleting import:', error);
      alert('Failed to delete import. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Package className="w-4 h-4 animate-pulse" />
          <span>Loading imports...</span>
        </div>
      </div>
    );
  }

  if (imports.length === 0) {
    return null; // Don't show anything if no imports
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <ExternalLink className="w-4 h-4 text-blue-400" />
        <h3 className="font-medium text-white">Factory Imports</h3>
        <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
          {imports.length}
        </span>
      </div>

      <div className="space-y-3">
        {imports.map((importItem) => (
          <div
            key={importItem._id}
            className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-600 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Factory className="w-4 h-4 text-blue-400" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {importItem.itemClassName.replace(/^Desc_/, '').replace(/_C$/, '').replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-400">
                    {importItem.requiredAmount.toFixed(1)}/min
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  From: {importItem.sourceFactoryId.name}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
              onClick={() => handleDeleteImport(importItem._id)}
              disabled={deleting === importItem._id}
            >
              {deleting === importItem._id ? (
                <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          These ingredients are imported from other factories and consumed by this factory's production lines.
        </p>
      </div>
    </div>
  );
}
