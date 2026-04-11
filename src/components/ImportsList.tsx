'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, X, Factory, Package, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRate } from '@/lib/utils';

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
  refreshTrigger?: number; // Add a trigger to force refresh
}

interface CapacityInfo {
  produced: number;       // total production in source factory
  allocatedElsewhere: number; // sum of other exports of same item
  max: number;            // produced - allocatedElsewhere
}

export default function ImportsList({ factoryId, onImportDeleted, refreshTrigger }: ImportsListProps) {
  const [imports, setImports] = useState<FactoryImport[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [capacity, setCapacity] = useState<CapacityInfo | null>(null);
  const [capacityLoading, setCapacityLoading] = useState(false);  // Load imports for this factory
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

  useEffect(() => {
    if (factoryId) {
      loadImports();
    }
  }, [factoryId, refreshTrigger]); // Add refreshTrigger to dependencies

  const startEdit = async (importItem: FactoryImport) => {
    setEditingId(importItem._id);
    setEditAmount(importItem.requiredAmount.toString());
    setCapacity(null);
    setCapacityLoading(true);

    try {
      const [linesRes, exportsRes] = await Promise.all([
        fetch(`/api/factories/${importItem.sourceFactoryId._id}/production-lines`),
        fetch(`/api/factories/${importItem.sourceFactoryId._id}/exports?itemClassName=${importItem.itemClassName}`),
      ]);

      let produced = 0;
      if (linesRes.ok) {
        const linesData = await linesRes.json();
        const line = (linesData.productionLines || []).find(
          (l: { itemClassName: string; targetQuantityPerMinute: number }) =>
            l.itemClassName === importItem.itemClassName
        );
        produced = line?.targetQuantityPerMinute ?? 0;
      }

      let allocatedElsewhere = 0;
      if (exportsRes.ok) {
        const exportsData = await exportsRes.json();
        allocatedElsewhere = (exportsData.exports || [])
          .filter((e: { _id: string; requiredAmount: number }) => e._id !== importItem._id)
          .reduce((sum: number, e: { requiredAmount: number }) => sum + e.requiredAmount, 0);
      }

      setCapacity({
        produced,
        allocatedElsewhere,
        max: Math.max(0, produced - allocatedElsewhere),
      });
    } catch {
      // capacity info is optional, don't block editing
    } finally {
      setCapacityLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
    setCapacity(null);
  };

  const handleSaveEdit = async (importId: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/factories/${factoryId}/imports`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId, requiredAmount: amount }),
      });

      if (!response.ok) throw new Error('Failed to update import');

      setImports(prev =>
        prev.map(imp => imp._id === importId ? { ...imp, requiredAmount: amount } : imp)
      );
      setEditingId(null);
    } catch (error) {
      console.error('Error updating import:', error);
      alert('Failed to update import. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Factory className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {importItem.itemClassName.replace(/^Desc_/, '').replace(/_C$/, '').replace(/_/g, ' ')}
                  </span>
                  {editingId === importItem._id ? (
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          max={capacity?.max ?? undefined}
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(importItem._id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className={`w-24 px-2 py-0.5 text-xs bg-slate-700 border rounded text-white focus:outline-none focus:border-orange-400 ${
                            capacity && parseFloat(editAmount) > capacity.max
                              ? 'border-red-500'
                              : 'border-slate-500'
                          }`}
                          autoFocus
                        />
                        <span className="text-xs text-slate-400">/min</span>
                      </div>
                      {capacityLoading && (
                        <span className="text-xs text-slate-500">Loading capacity...</span>
                      )}
                      {capacity && !capacityLoading && (
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Produces:</span>
                            <span className="text-green-400 font-medium">{formatRate(capacity.produced)}/min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Allocated elsewhere:</span>
                            <span className="text-yellow-400 font-medium">{formatRate(capacity.allocatedElsewhere)}/min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Available:</span>
                            <span className={`font-medium ${capacity.max <= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                              {formatRate(capacity.max)}/min
                            </span>
                          </div>
                          {capacity.produced === 0 && (
                            <span className="text-orange-400">⚠ No production line found for this item</span>
                          )}
                          {parseFloat(editAmount) > capacity.max && capacity.max > 0 && (
                            <span className="text-red-400">⚠ Exceeds available capacity</span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {formatRate(importItem.requiredAmount)}/min
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  From: {importItem.sourceFactoryId.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {editingId === importItem._id ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-400 hover:text-green-300 hover:bg-green-900/30"
                    onClick={() => handleSaveEdit(importItem._id)}
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-slate-300"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-blue-300 hover:bg-blue-900/30"
                    onClick={() => startEdit(importItem)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
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
                </>
              )}
            </div>
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
