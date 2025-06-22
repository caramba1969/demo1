'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, ArrowRight, Factory, Search, ExternalLink } from 'lucide-react';
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
}

export default function DependencyTracker({
  currentFactoryId,
  productionLines,
  onAddProductionLine,
  onImportFromFactory
}: DependencyTrackerProps) {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<MissingIngredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [importing, setImporting] = useState<string | null>(null); // Track which import is in progress

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
      }

      const data = await response.json();
      
      // Show success message (you could also use a toast notification)
      alert('Import created successfully! This factory will now consume this ingredient from the selected factory.');
      
      // Optionally refresh the dependency analysis
      // The dependencies should automatically update since we're not producing this locally anymore
      
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

  // Load all factories to check for ingredient availability
  useEffect(() => {
    const loadFactories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/factories');
        if (!response.ok) throw new Error('Failed to fetch factories');
          const factoriesData = await response.json();
        
        // Ensure factoriesData is an array
        const validFactoriesData = Array.isArray(factoriesData) ? factoriesData : [];
          // Load production lines for each factory
        const factoriesWithProductionLines = await Promise.all(
          validFactoriesData.map(async (factory: Factory) => {
            try {
              console.log(`🔄 Loading production lines for factory: ${factory.name} (${factory._id})`);
              const prodLinesResponse = await fetch(`/api/factories/${factory._id}/production-lines`);
              console.log(`📡 Response status for ${factory.name}:`, prodLinesResponse.status, prodLinesResponse.statusText);
                if (prodLinesResponse.ok) {
                const prodLinesData = await prodLinesResponse.json();
                console.log(`📦 Raw production lines data for ${factory.name}:`, prodLinesData);
                
                // Handle nested structure: extract the actual array from the response
                let productionLines;
                if (Array.isArray(prodLinesData)) {
                  productionLines = prodLinesData;
                } else if (prodLinesData && Array.isArray(prodLinesData.productionLines)) {
                  productionLines = prodLinesData.productionLines;
                } else {
                  productionLines = [];
                }
                
                console.log(`✅ Processed production lines for ${factory.name}:`, productionLines.length, productionLines);
                
                return { ...factory, productionLines };
              } else {
                console.warn(`❌ Failed to load production lines for ${factory.name}:`, prodLinesResponse.status);
                return { ...factory, productionLines: [] };
              }
            } catch (error) {
              console.warn(`💥 Error loading production lines for factory ${factory._id}:`, error);
              return { ...factory, productionLines: [] };
            }
          })
        );        setFactories(factoriesWithProductionLines);
      } catch (error) {
        console.error('Error loading factories:', error);
        setFactories([]); // Ensure we always have an array
      } finally {
        setLoading(false);
      }
    };

    loadFactories();
  }, []);
  // Analyze missing ingredients
  useEffect(() => {
    // Ensure productionLines is an array
    const validProductionLines = Array.isArray(productionLines) ? productionLines : [];
    
    if (!validProductionLines.length || !factories.length) {
      setMissingIngredients([]);
      return;
    }

    const missing: MissingIngredient[] = [];
    const currentFactoryProduction = new Set(
      validProductionLines.map(pl => pl.itemClassName)
    );

    // Check each production line for missing ingredients
    validProductionLines.forEach(productionLine => {
      if (!productionLine.recipe?.ingredients) return;

      productionLine.recipe.ingredients.forEach(ingredient => {
        // Skip if we already produce this ingredient in current factory
        if (currentFactoryProduction.has(ingredient.item)) return;

        // Check if we already have this in missing list
        const existingMissing = missing.find(m => m.item === ingredient.item);
        const requiredPerMinute = (ingredient.amount / (productionLine.recipe?.time || 1)) * 60 * 
          (productionLine.targetQuantityPerMinute / ((productionLine.recipe?.products[0]?.amount || 1) / (productionLine.recipe?.time || 1) * 60));

        if (existingMissing) {
          existingMissing.requiredAmount += requiredPerMinute;
          return;
        }

        // Find which other factories produce this ingredient
        const availableInFactories: Array<{factoryId: string; factoryName: string; productionRate: number}> = [];        factories.forEach(factory => {
          if (factory._id === currentFactoryId) return; // Skip current factory
          
          // Ensure productionLines is an array before iterating
          const productionLines = Array.isArray(factory.productionLines) ? factory.productionLines : [];          productionLines.forEach(pl => {
            if (pl.itemClassName === ingredient.item) {
              availableInFactories.push({
                factoryId: factory._id,
                factoryName: factory.name,
                productionRate: pl.targetQuantityPerMinute
              });
            }
          });
        });

        missing.push({
          item: ingredient.item,
          name: ingredient.name || ingredient.item,
          requiredAmount: requiredPerMinute,
          availableInFactories
        });
      });
    });

    setMissingIngredients(missing);
  }, [productionLines, factories, currentFactoryId]);

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
        <div className="flex items-center gap-2 text-green-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">All dependencies satisfied</span>
        </div>
        <p className="text-green-300 text-sm mt-1">
          All required ingredients are being produced in this factory.
        </p>
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
          <Button variant="ghost" size="sm" className="text-yellow-400">
            {expanded ? 'Hide' : 'Show'}
          </Button>
        </div>
        <p className="text-yellow-200 text-sm mt-1">
          Some ingredients are not being produced in this factory.
        </p>
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
                    </p>
                    {missing.availableInFactories.map((factory) => (
                      <div
                        key={factory.factoryId}
                        className="flex items-center justify-between p-3 bg-green-900/30 border border-green-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Factory className="w-4 h-4 text-green-400" />
                          <div>
                            <span className="text-green-200">{factory.factoryName}</span>
                            <p className="text-xs text-green-300">
                              Produces: {factory.productionRate.toFixed(1)}/min
                            </p>
                          </div>
                        </div>                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-600 text-green-300 hover:bg-green-700"
                          onClick={() => handleImportFromFactory(missing.item, factory.factoryId, missing.requiredAmount)}
                          disabled={importing === `${missing.item}-${factory.factoryId}`}
                        >
                          {importing === `${missing.item}-${factory.factoryId}` ? (
                            <>
                              <div className="w-3 h-3 mr-1 border border-green-300 border-t-transparent rounded-full animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Import
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
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
