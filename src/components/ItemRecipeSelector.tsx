'use client';

import React, { useState, useEffect } from 'react';
import { Search, Package, Beaker } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Item {
  _id: string;
  className: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sinkPoints: number;
  liquid: boolean;
  energyValue: number;
}

interface Recipe {
  _id: string;
  className: string;
  name: string;
  slug: string;
  alternate: boolean;
  time: number;
  ingredients: Array<{ item: string; amount: number }>;
  products: Array<{ item: string; amount: number }>;
  producedIn: string[];
  inMachine: boolean;
  inHand: boolean;
}

interface ItemRecipeSelectorProps {
  onSelectionComplete: (data: {
    item: Item;
    recipe: Recipe;
    targetQuantityPerMinute: number;
  }) => void;
  className?: string;
  filterByItemClass?: string; // Optional filter to show only recipes that produce a specific item
}

export default function ItemRecipeSelector({ 
  onSelectionComplete, 
  className = '', 
  filterByItemClass 
}: ItemRecipeSelectorProps) {
  const [step, setStep] = useState<'item' | 'recipe' | 'quantity'>('item');
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [targetQuantity, setTargetQuantity] = useState<number>(60);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch items
  const fetchItems = async (search: string = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '100');
      
      const response = await fetch(`/api/items?${params}`);
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipes for selected item
  const fetchRecipes = async (itemClassName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recipes?productItem=${itemClassName}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      
      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (err) {
      setError('Failed to load recipes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };  // Load items on component mount and when search changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchItems(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Auto-select item when filterByItemClass is provided
  useEffect(() => {
    if (filterByItemClass && items.length > 0) {
      const targetItem = items.find(item => item.className === filterByItemClass);
      if (targetItem) {
        handleItemSelect(targetItem);
      }
    }
  }, [filterByItemClass, items]);

  // Use server-side filtering instead of client-side
  const filteredItems = items;

  // Handle item selection
  const handleItemSelect = async (item: Item) => {
    setSelectedItem(item);
    setStep('recipe');
    await fetchRecipes(item.className);
  };

  // Handle recipe selection
  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setStep('quantity');
  };

  // Handle final selection
  const handleComplete = () => {
    if (selectedItem && selectedRecipe && targetQuantity > 0) {
      onSelectionComplete({
        item: selectedItem,
        recipe: selectedRecipe,
        targetQuantityPerMinute: targetQuantity
      });
      
      // Reset form
      setStep('item');
      setSelectedItem(null);
      setSelectedRecipe(null);
      setTargetQuantity(60);
      setSearchTerm('');
    }
  };

  // Calculate items per minute for recipe preview
  const calculateItemsPerMinute = (recipe: Recipe, itemClassName: string) => {
    const product = recipe.products.find(p => p.item === itemClassName);
    if (!product) return 0;
    
    const itemsPerCycle = product.amount;
    const cycleTimeInMinutes = recipe.time / 60;
    return itemsPerCycle / cycleTimeInMinutes;
  };

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-orange-400" />
        <h3 className="text-xl font-semibold text-white">Add Production Line</h3>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Step 1: Item Selection */}
      {step === 'item' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Item to Produce
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No items found</div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item._id}
                  onClick={() => handleItemSelect(item)}
                  className="w-full p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white group-hover:text-orange-400 transition-colors">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-sm text-slate-400 truncate">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Sink Points</p>
                      <p className="text-sm font-medium text-orange-400">{item.sinkPoints}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 2: Recipe Selection */}
      {step === 'recipe' && selectedItem && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep('item')}
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              ← Back
            </Button>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-400" />
              <span className="text-white font-medium">{selectedItem.name}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Recipe
            </label>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading recipes...</div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No recipes found for this item</div>
            ) : (
              recipes.map((recipe) => {
                const itemsPerMinute = calculateItemsPerMinute(recipe, selectedItem.className);
                return (
                  <button
                    key={recipe._id}
                    onClick={() => handleRecipeSelect(recipe)}
                    className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                        <Beaker className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                            {recipe.name}
                          </p>
                          {recipe.alternate && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                              ALT
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">
                          {recipe.time}s cycle • {itemsPerMinute.toFixed(1)} items/min
                        </p>
                        <div className="text-xs text-slate-500">
                          <span>Ingredients: {recipe.ingredients.length}</span>
                          {recipe.producedIn.length > 0 && (
                            <span className="ml-3">Building: {recipe.producedIn[0]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Step 3: Quantity Selection */}
      {step === 'quantity' && selectedItem && selectedRecipe && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep('recipe')}
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              ← Back
            </Button>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-400" />
              <span className="text-white font-medium">{selectedItem.name}</span>
              <span className="text-slate-400">•</span>
              <Beaker className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300">{selectedRecipe.name}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Production (items/minute)
            </label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(parseFloat(e.target.value) || 0)}
              className="bg-slate-800 border-slate-600 text-white"
              placeholder="60"
            />
          </div>

          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-white">Production Preview</h4>
            <div className="text-sm text-slate-300 space-y-1">
              <p>Recipe Time: {selectedRecipe.time} seconds</p>
              <p>Items per Cycle: {selectedRecipe.products.find(p => p.item === selectedItem.className)?.amount || 0}</p>
              <p>Recipe Rate: {calculateItemsPerMinute(selectedRecipe, selectedItem.className).toFixed(1)} items/min</p>
              <p>Required Buildings: {Math.ceil(targetQuantity / calculateItemsPerMinute(selectedRecipe, selectedItem.className))}</p>
            </div>
          </div>

          <Button
            onClick={handleComplete}
            disabled={targetQuantity <= 0}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            Add Production Line
          </Button>
        </div>
      )}
    </div>
  );
}
