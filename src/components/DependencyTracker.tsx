'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, ArrowRight, Factory, Search, ExternalLink, RefreshCw, Clock, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Ingredient {
  item: string;
  amount: number;
  name?: string;
}

interface Recipe {
  name: string;
  time: number;
  ingredients: Ingredient[];
  products: Array<{ item: string; amount: number; name?: string }>;
}

interface ProductionLine {
  _id: string;
  itemClassName: string;
  recipe?: Recipe;
  targetQuantityPerMinute: number;
}

interface Factory {
  _id: string;
  name: string;
  productionLines?: ProductionLine[];
}

interface MissingIngredient {
  item: string;
  name: string;
  requiredAmount: number;
  availableInFactories: Array<{
    factoryId: string;
    factoryName: string;
    productionRate: number;
  }>;
}

interface DependencyTrackerProps {
  currentFactoryId: string;
  productionLines: ProductionLine[];
  onAddProductionLine?: (ingredient: string) => void;
  onImportFromFactory?: (ingredient: string, factoryId: string) => void;
  autoRefreshInterval?: number; // Optional auto-refresh interval in milliseconds
  refreshTrigger?: number; // Trigger dependency analysis when this changes
}

export default function DependencyTracker({
  currentFactoryId,
  productionLines,
  onAddProductionLine,
  onImportFromFactory,
  autoRefreshInterval = 30000, // Default 30 seconds
  refreshTrigger
}: DependencyTrackerProps) {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<MissingIngredient[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);  const [importing, setImporting] = useState<string | null>(null); // Track which import is in progress
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

  // Handle import from factory
  const handleImportFromFactory = async (ingredient: string, factoryId: string, requiredAmount: number) => {
    try {
      setImporting(`${ingredient}-${factoryId}`);
      
      const response = await fetch(`/api/factories/${currentFactoryId}/imports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceFactoryId: factoryId,
          itemClassName: ingredient,
          requiredAmount
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create import');
      }      const data = await response.json();
      
      // Reload imports to update the analysis
      await loadImports();
      
      // Trigger a full refresh to update all data
      await refreshDependencies();
      
      // Show success message (you could also use a toast notification)
      alert('Import created successfully! This factory will now consume this ingredient from the selected factory.');
      
      // Call the parent callback if provided
      if (onImportFromFactory) {
        onImportFromFactory(ingredient, factoryId);
      }

    } catch (error) {
      console.error('Error creating import:', error);
      alert('Failed to create import. Please try again.');
    } finally {
      setImporting(null);
    }
  };
  // Load existing imports for this factory
  const loadImports = async () => {
    try {
      const response = await fetch(`/api/factories/${currentFactoryId}/imports`);
      if (response.ok) {
        const data = await response.json();
        setImports(data.imports || []);
      } else {
        setImports([]);
      }
    } catch (error) {
      console.error('Error loading imports:', error);
      setImports([]);
    }
  };

  // Comprehensive refresh function
  const refreshDependencies = async () => {
    try {
      setLoading(true);
      
      // Load factories and imports in parallel
      const [factoriesResponse] = await Promise.all([
        fetch('/api/factories'),
        loadImports()
      ]);
      
      if (!factoriesResponse.ok) throw new Error('Failed to fetch factories');
      const factoriesData = await factoriesResponse.json();
      
      // Ensure factoriesData is an array
      const validFactoriesData = Array.isArray(factoriesData) ? factoriesData : [];
      
      // Load production lines for each factory
      const factoriesWithProductionLines = await Promise.all(
        validFactoriesData.map(async (factory: Factory) => {
          try {
            const prodLinesResponse = await fetch(`/api/factories/${factory._id}/production-lines`);
            
            if (prodLinesResponse.ok) {
              const prodLinesData = await prodLinesResponse.json();
              
              // Handle nested structure: extract the actual array from the response
              let productionLines;
              if (Array.isArray(prodLinesData)) {
                productionLines = prodLinesData;
              } else if (prodLinesData && Array.isArray(prodLinesData.productionLines)) {
                productionLines = prodLinesData.productionLines;
              } else {
                productionLines = [];
              }
              
              return { ...factory, productionLines };
            } else {
              return { ...factory, productionLines: [] };
            }
          } catch (error) {
            console.warn(`Error loading production lines for factory ${factory._id}:`, error);
            return { ...factory, productionLines: [] };
          }
        })
      );
      
      setFactories(factoriesWithProductionLines);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing dependencies:', error);
      setFactories([]);
    } finally {
      setLoading(false);
    }
  };  // Load all factories to check for ingredient availability
  useEffect(() => {
    refreshDependencies();
  }, [currentFactoryId]);
  // Auto-refresh functionality with dynamic interval based on imports
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    // Refresh more frequently if there are active imports (they might be updated)
    const hasImports = imports.length > 0;
    const refreshInterval = hasImports ? Math.min(autoRefreshInterval, 15000) : autoRefreshInterval; // 15s max if imports exist

    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      refreshDependencies();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled, autoRefreshInterval, imports.length]);
  // Refresh when production lines change
  useEffect(() => {
    if (factories.length > 0) {
      // Small delay to avoid too frequent updates
      const timeoutId = setTimeout(() => {
        refreshDependencies();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [productionLines]);

  // Refresh when trigger changes (for immediate updates)
  useEffect(() => {
    if (refreshTrigger && factories.length > 0) {
      refreshDependencies();
    }
  }, [refreshTrigger]);
  // Analyze missing ingredients
  useEffect(() => {
    // Ensure productionLines is an array
    const validProductionLines = Array.isArray(productionLines) ? productionLines : [];
    
    if (!validProductionLines.length || !factories.length) {
      setMissingIngredients([]);
      return;
    }    const missing: MissingIngredient[] = [];
    const currentFactoryProduction = new Set(
      validProductionLines.map(pl => pl.itemClassName)
    );    // Create a map of existing imports by item class name
    const existingImports = new Map<string, number>();
    imports.forEach((imp: any) => {
      const currentAmount = existingImports.get(imp.itemClassName) || 0;
      existingImports.set(imp.itemClassName, currentAmount + imp.requiredAmount);
    });

    // Check each production line for missing ingredients
    validProductionLines.forEach(productionLine => {
      if (!productionLine.recipe?.ingredients) return;

      productionLine.recipe.ingredients.forEach(ingredient => {
        // Skip if we already produce this ingredient in current factory
        if (currentFactoryProduction.has(ingredient.item)) return;

        // Calculate required amount per minute
        const requiredPerMinute = (ingredient.amount / (productionLine.recipe?.time || 1)) * 60 * 
          (productionLine.targetQuantityPerMinute / ((productionLine.recipe?.products[0]?.amount || 1) / (productionLine.recipe?.time || 1) * 60));

        // Check if we already have this in missing list
        const existingMissing = missing.find(m => m.item === ingredient.item);
        
        if (existingMissing) {
          existingMissing.requiredAmount += requiredPerMinute;
        } else {
          // Create new missing ingredient entry
          missing.push({
            item: ingredient.item,
            name: ingredient.name || ingredient.item,
            requiredAmount: requiredPerMinute,
            availableInFactories: []
          });
        }
      });
    });    // Filter out ingredients that are sufficiently covered by imports
    const actuallyMissing = missing.filter(missingItem => {
      const importedAmount = existingImports.get(missingItem.item) || 0;
      const stillNeeded = missingItem.requiredAmount - importedAmount;
      
      // Only show as missing if we still need more than what we're importing
      if (stillNeeded > 0.01) { // Small threshold to account for floating point precision
        // Update the required amount to show only what's still needed
        missingItem.requiredAmount = stillNeeded;
        return true;
      }
      return false;
    });    // Find which other factories produce the still-missing ingredients
    actuallyMissing.forEach(missingItem => {
      const availableInFactories: Array<{factoryId: string; factoryName: string; productionRate: number}> = [];
      
      factories.forEach((factory: any) => {
        if (factory._id === currentFactoryId) return; // Skip current factory
        
        // Ensure productionLines is an array before iterating
        const productionLines = Array.isArray(factory.productionLines) ? factory.productionLines : [];
        
        // Calculate total production rate for this item across all production lines in the factory
        let totalProductionRate = 0;
        productionLines.forEach((pl: any) => {
          if (pl.itemClassName === missingItem.item) {
            totalProductionRate += pl.targetQuantityPerMinute || 0;
          }
        });
        
        // Only add factory if it produces this item
        if (totalProductionRate > 0) {
          availableInFactories.push({
            factoryId: factory._id,
            factoryName: factory.name,
            productionRate: totalProductionRate
          });
        }
      });

      missingItem.availableInFactories = availableInFactories;
    });

    setMissingIngredients(actuallyMissing);
  }, [productionLines, factories, imports, currentFactoryId]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Search className="w-4 h-4 animate-spin" />
          <span>Analyzing dependencies...</span>
        </div>
      </div>
    );
  }
  if (missingIngredients.length === 0) {
    return (
      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">All dependencies satisfied</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshDependencies()}
              disabled={loading}
              className="text-green-400 hover:text-green-300"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
              className={`${isAutoRefreshEnabled ? 'text-green-400' : 'text-gray-400'}`}
            >
              {isAutoRefreshEnabled ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-green-300 text-sm">
            All required ingredients are being produced in this factory.
          </p>          <div className="flex items-center gap-2 text-xs text-green-300">
            <Clock className="w-3 h-3" />
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            {isAutoRefreshEnabled && (
              <span className="text-green-400">
                • Auto-refresh: {imports.length > 0 ? '15s' : '30s'}
                {imports.length > 0 && <span className="text-blue-300"> (monitoring imports)</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg">
      <div 
        className="p-4 cursor-pointer hover:bg-yellow-900/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="font-medium text-yellow-300">
              Missing Dependencies ({missingIngredients.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                refreshDependencies();
              }}
              disabled={loading}
              className="text-yellow-400 hover:text-yellow-300"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsAutoRefreshEnabled(!isAutoRefreshEnabled);
              }}
              className={`${isAutoRefreshEnabled ? 'text-green-400' : 'text-gray-400'}`}
            >
              {isAutoRefreshEnabled ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </Button>
            <Button variant="ghost" size="sm" className="text-yellow-400">
              {expanded ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-yellow-200 text-sm">
            Some ingredients are not being produced in this factory.
          </p>            <div className="flex items-center gap-2 text-xs text-yellow-300">
              <Clock className="w-3 h-3" />
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              {isAutoRefreshEnabled && (
                <span className="text-green-400">
                  • Auto-refresh: {imports.length > 0 ? '15s' : '30s'}
                  {imports.length > 0 && <span className="text-blue-300"> (monitoring imports)</span>}
                </span>
              )}
            </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-yellow-700 p-4 space-y-4">
          {missingIngredients.map((missing) => (
            <div key={missing.item} className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-white">{missing.name}</h4>
                  <p className="text-sm text-slate-400">
                    Required: {missing.requiredAmount.toFixed(1)}/min
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Option 1: Add production line */}
                <div className="flex items-center justify-between p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-200">Create production line</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-600 text-blue-300 hover:bg-blue-700"
                    onClick={() => onAddProductionLine?.(missing.item)}
                  >
                    Add Line
                  </Button>
                </div>

                {/* Option 2: Import from other factories */}
                {missing.availableInFactories.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <ArrowRight className="w-3 h-3" />
                      Available in other factories:
                    </p>                    {missing.availableInFactories.map((factory) => {
                      // Check if we already have an import from this factory for this item
                      const existingImport = imports.find((imp: any) => 
                        imp.sourceFactoryId._id === factory.factoryId && 
                        imp.itemClassName === missing.item
                      );

                      return (
                        <div
                          key={factory.factoryId}
                          className="flex items-center justify-between p-3 bg-green-900/30 border border-green-700 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Factory className="w-4 h-4 text-green-400" />
                            <div>                              <span className="text-green-200">{factory.factoryName}</span>
                              <p className="text-xs text-green-300">
                                Produces: {factory.productionRate.toFixed(1)}/min
                                {existingImport && (
                                  <span className="text-blue-300 ml-1">
                                    (Importing {existingImport.requiredAmount.toFixed(1)}/min)
                                  </span>
                                )}
                                {existingImport && factory.productionRate > existingImport.requiredAmount && (
                                  <span className="text-yellow-300 ml-1">
                                    • {(factory.productionRate - existingImport.requiredAmount).toFixed(1)}/min available
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className={`${existingImport 
                              ? 'border-gray-600 text-gray-400 cursor-not-allowed' 
                              : 'border-green-600 text-green-300 hover:bg-green-700'
                            }`}
                            onClick={() => {
                              if (!existingImport) {
                                // Import the available production from this factory
                                // Never import more than what they can produce
                                const maxAvailable = factory.productionRate;
                                const actualImportAmount = Math.min(missing.requiredAmount, maxAvailable);
                                handleImportFromFactory(missing.item, factory.factoryId, actualImportAmount);
                              }
                            }}                            disabled={
                              importing === `${missing.item}-${factory.factoryId}` || 
                              !!existingImport
                            }
                          >
                            {importing === `${missing.item}-${factory.factoryId}` ? (
                              <>
                                <div className="w-3 h-3 mr-1 border border-green-300 border-t-transparent rounded-full animate-spin" />
                                Importing...
                              </>
                            ) : existingImport ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Imported
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Import
                              </>
                            )}
                          </Button>                          {/* Update Import Button for existing imports */}
                          {existingImport && (
                            <div className="flex gap-2">
                              {/* Show increase button if factory has more capacity OR if we still need more */}
                              {(factory.productionRate > existingImport.requiredAmount || missing.requiredAmount > existingImport.requiredAmount) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-600 text-blue-300 hover:bg-blue-700"
                                  onClick={() => {
                                    const maxFactoryCapacity = factory.productionRate;
                                    const currentImport = existingImport.requiredAmount;
                                    
                                    // Calculate how much more we can import
                                    const additionalCapacity = maxFactoryCapacity - currentImport;
                                    const additionalNeeded = missing.requiredAmount;
                                    
                                    // Import the minimum of additional capacity and what we need
                                    const additionalAmount = Math.min(additionalCapacity, additionalNeeded);
                                    const newTotal = currentImport + additionalAmount;
                                    
                                    if (additionalAmount > 0) {
                                      handleImportFromFactory(missing.item, factory.factoryId, newTotal);
                                    }
                                  }}
                                  disabled={importing === `${missing.item}-${factory.factoryId}`}
                                  title={`Increase to ${Math.min(factory.productionRate, existingImport.requiredAmount + missing.requiredAmount).toFixed(1)}/min`}
                                >
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                  </svg>
                                  {factory.productionRate > existingImport.requiredAmount ? 'Increase' : 'Add More'}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No other factories produce this */}
                {missing.availableInFactories.length === 0 && (
                  <div className="p-3 bg-slate-800 border border-slate-600 rounded-lg">
                    <p className="text-sm text-slate-400">
                      This ingredient is not being produced in any other factory.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
