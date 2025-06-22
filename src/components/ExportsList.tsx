'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Factory, Truck, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Export {
  _id: string;
  sourceFactoryId: string;
  targetFactoryId: {
    _id: string;
    name: string;
  };
  itemClassName: string;
  itemName: string;
  requiredAmount: number;
  createdAt: string;
}

interface ExportsListProps {
  factoryId: string;
  refreshTrigger?: number;
}

export default function ExportsList({ factoryId, refreshTrigger }: ExportsListProps) {
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadExports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/factories/${factoryId}/exports`);
      
      if (response.ok) {
        const data = await response.json();
        setExports(data.exports || []);
        setLastRefresh(new Date());
      } else {
        console.error('Failed to load exports');
        setExports([]);
      }
    } catch (error) {
      console.error('Error loading exports:', error);
      setExports([]);
    } finally {
      setLoading(false);
    }
  };

  // Load exports on mount and when refresh trigger changes
  useEffect(() => {
    loadExports();
  }, [factoryId, refreshTrigger]);

  // Group exports by target factory and item
  const groupedExports = exports.reduce((acc, exp) => {
    const factoryKey = exp.targetFactoryId._id;
    const itemKey = exp.itemClassName;
    
    if (!acc[factoryKey]) {
      acc[factoryKey] = {
        factoryName: exp.targetFactoryId.name,
        items: {}
      };
    }
    
    if (!acc[factoryKey].items[itemKey]) {
      acc[factoryKey].items[itemKey] = {
        itemName: exp.itemName,
        totalAmount: 0
      };
    }
    
    acc[factoryKey].items[itemKey].totalAmount += exp.requiredAmount;
    
    return acc;
  }, {} as Record<string, { factoryName: string; items: Record<string, { itemName: string; totalAmount: number }> }>);

  const totalExports = exports.reduce((sum, exp) => sum + exp.requiredAmount, 0);

  if (exports.length === 0) {
    return (
      <div className="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Factory Exports</h3>
          </div>
          <Button
            onClick={loadExports}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-neutral-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="text-center py-8">
          <Truck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">This factory is not currently exporting to any other factories</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Factory Exports</h3>
          <span className="text-sm text-neutral-400">
            ({Object.keys(groupedExports).length} {Object.keys(groupedExports).length === 1 ? 'factory' : 'factories'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            Updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            onClick={loadExports}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-neutral-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedExports).map(([factoryId, factoryData]) => (
          <div key={factoryId} className="bg-neutral-900 rounded-lg p-4 border border-neutral-600">
            <div className="flex items-center gap-3 mb-3">
              <Factory className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium">{factoryData.factoryName}</span>
              <ArrowRight className="w-4 h-4 text-neutral-500" />
              <span className="text-blue-400 text-sm">Receiving items</span>
            </div>
            
            <div className="space-y-2 ml-7">
              {Object.entries(factoryData.items).map(([itemClassName, itemData]) => (
                <div key={itemClassName} className="flex items-center justify-between">
                  <span className="text-neutral-300 text-sm">{itemData.itemName}</span>
                  <span className="text-blue-400 font-mono text-sm">
                    {itemData.totalAmount.toFixed(1)}/min
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-600">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">Total Export Rate:</span>
          <span className="text-blue-400 font-mono font-medium">
            {totalExports.toFixed(1)} items/min
          </span>
        </div>
      </div>
    </div>
  );
}
