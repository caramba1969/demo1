'use client';

import React, { useState, useEffect } from 'react';
import { Search, Package, Drill, Droplets, Mountain, TestTube } from 'lucide-react';
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

// Extraction data for raw materials
interface ExtractionData {
  className: string;
  name: string;
  type: 'ore' | 'fluid' | 'gas';
  extractorType: string;
  baseRate: number; // Base extraction rate per minute
  powerConsumption?: number;
  description?: string;
}

interface EnhancedItemRecipeSelectorProps {
  onSelectionComplete: (data: {
    item: Item;
    recipe?: Recipe;
    extraction?: ExtractionData;
    targetQuantityPerMinute: number;
    isExtraction: boolean;
  }) => void;
  className?: string;
  filterByItemClass?: string;
}

// Common extracted resources in Satisfactory
const EXTRACTION_DATA: Record<string, ExtractionData> = {
  'Desc_OreIron_C': {
    className: 'Desc_OreIron_C',
    name: 'Iron Ore Extraction',
    type: 'ore',
    extractorType: 'Miner',
    baseRate: 60, // Base miner rate
    powerConsumption: 5,
    description: 'Extracted from Iron Ore nodes using Miners'
  },
  'Desc_OreCopper_C': {
    className: 'Desc_OreCopper_C',
    name: 'Copper Ore Extraction',
    type: 'ore',
    extractorType: 'Miner',
    baseRate: 60,
    powerConsumption: 5,
    description: 'Extracted from Copper Ore nodes using Miners'
  },
  'Desc_Stone_C': {
    className: 'Desc_Stone_C',
    name: 'Limestone Extraction',
    type: 'ore',
    extractorType: 'Miner',
    baseRate: 60,
    powerConsumption: 5,
    description: 'Extracted from Limestone nodes using Miners'
  },
  'Desc_Coal_C': {
    className: 'Desc_Coal_C',
    name: 'Coal Extraction',
    type: 'ore',
    extractorType: 'Miner',
    baseRate: 60,
    powerConsumption: 5,
    description: 'Extracted from Coal nodes using Miners'
  },
  'Desc_OreGold_C': {
    className: 'Desc_OreGold_C',
    name: 'Caterium Ore Extraction',
    type: 'ore',
    extractorType: 'Miner',
    baseRate: 60,
    powerConsumption: 5,
    description: 'Extracted from Caterium Ore nodes using Miners'
  },
  'Desc_RawQuartz_C': {
    className: 'Desc_RawQuartz_C',
    name: 'Raw Quartz Extraction',
    type: 'ore',
    extractorType: 'Miner',
    baseRate: 60,
    powerConsumption: 5,
    description: 'Extracted from Quartz nodes using Miners'
  },
  'Desc_Sulfur_C': {
    className: 'Desc_Sulfur_C',
    name: 'Sulfur Extraction',
    type: 'ore',
    extractorType: 'Miner',
    baseRate: 60,
    powerConsumption: 5,
    description: 'Extracted from Sulfur nodes using Miners'
  },
  'Desc_OreBauxite_C': {
    className: 'Desc_OreBauxite_C',
    name: 'Bauxite Extraction',
    type: 'ore',
    extractorType: 'Miner',
    baseRate: 60,
    powerConsumption: 5,
    description: 'Extracted from Bauxite nodes using Miners'
  },
  'Desc_OreUranium_C': {
    className: 'Desc_OreUranium_C',
    name: 'Uranium Ore Extraction',
    type: 'ore',
    extractorType: 'Miner',
    baseRate: 60,
    powerConsumption: 5,
    description: 'Extracted from Uranium nodes using Miners'
  },
  'Desc_Water_C': {
    className: 'Desc_Water_C',
    name: 'Water Extraction',
    type: 'fluid',
    extractorType: 'Water Extractor',
    baseRate: 120,
    powerConsumption: 20,
    description: 'Extracted from water bodies using Water Extractors'
  },
  'Desc_LiquidOil_C': {
    className: 'Desc_LiquidOil_C',
    name: 'Crude Oil Extraction',
    type: 'fluid',
    extractorType: 'Oil Extractor',
    baseRate: 120,
    powerConsumption: 40,
    description: 'Extracted from Oil nodes using Oil Extractors'
  },
  'Desc_NitrogenGas_C': {
    className: 'Desc_NitrogenGas_C',
    name: 'Nitrogen Gas Extraction',
    type: 'gas',
    extractorType: 'Resource Well Extractor',
    baseRate: 60,
    powerConsumption: 150,
    description: 'Extracted from Nitrogen Gas wells using Resource Well Extractors'
  }
};

// Utility function to get item image URL from className
const getItemImageUrl = (className: string) => {
  if (!className) return null;
  const imageName = className.toLowerCase().replace(/_/g, '-');
  return `/images/items/${imageName}_64.png`;
};

export default function EnhancedItemRecipeSelector({ 
  onSelectionComplete, 
  className = '', 
  filterByItemClass 
}: EnhancedItemRecipeSelectorProps) {
  const [mode, setMode] = useState<'recipe' | 'extraction'>('recipe');
  const [step, setStep] = useState<'item' | 'recipe' | 'quantity'>('item');
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedExtraction, setSelectedExtraction] = useState<ExtractionData | null>(null);
  const [targetQuantity, setTargetQuantity] = useState<number>(60);
  const [loading, setLoading] = useState(false);

  // Load items on component mount
  useEffect(() => {
    loadItems();
  }, [searchTerm, filterByItemClass]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterByItemClass) params.append('className', filterByItemClass);
      params.append('limit', '100');

      const response = await fetch(`/api/items?${params}`);
      if (response.ok) {
        const data = await response.json();
        // API returns { items: [...], pagination: {...} }
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setItems([]); // Ensure items is always an array
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async (itemClassName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recipes?productItem=${itemClassName}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        // API returns { recipes: [...], pagination: {...} }
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      setRecipes([]); // Ensure recipes is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = async (item: Item) => {
    setSelectedItem(item);
    
    if (mode === 'extraction') {
      // Check if this item has extraction data
      const extractionData = EXTRACTION_DATA[item.className];
      if (extractionData) {
        setSelectedExtraction(extractionData);
        setStep('quantity');
      } else {
        alert('This item cannot be extracted. Please select a raw material or switch to Recipe mode.');
        return;
      }
    } else {
      // Load recipes for this item
      await loadRecipes(item.className);
      setStep('recipe');
    }
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setStep('quantity');
  };

  const handleComplete = () => {
    if (!selectedItem) return;

    if (mode === 'extraction' && selectedExtraction) {
      onSelectionComplete({
        item: selectedItem,
        extraction: selectedExtraction,
        targetQuantityPerMinute: targetQuantity,
        isExtraction: true
      });
    } else if (mode === 'recipe' && selectedRecipe) {
      onSelectionComplete({
        item: selectedItem,
        recipe: selectedRecipe,
        targetQuantityPerMinute: targetQuantity,
        isExtraction: false
      });
    }
  };

  const handleBack = () => {
    if (step === 'quantity') {
      setStep(mode === 'extraction' ? 'item' : 'recipe');
      setSelectedRecipe(null);
      setSelectedExtraction(null);
    } else if (step === 'recipe') {
      setStep('item');
      setSelectedItem(null);
      setRecipes([]);
    }
  };

  const filteredItems = (items || []).filter(item => {
    if (mode === 'extraction') {
      // Only show items that can be extracted
      return EXTRACTION_DATA[item.className];
    }
    return true;
  });

  const getIconForMode = (mode: string) => {
    switch (mode) {
      case 'extraction': return <Drill className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getIconForExtractionType = (type: string) => {
    switch (type) {
      case 'fluid': return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'gas': return <div className="w-4 h-4 rounded-full bg-gray-400" />;
      case 'ore': return <Mountain className="w-4 h-4 text-orange-400" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className={`bg-neutral-800 rounded-lg p-6 space-y-6 ${className}`}>
      {/* Mode Selection */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white mb-3">Production Lines</h3>
        <div className="flex gap-3">
          <Button
            variant={mode === 'recipe' ? 'default' : 'outline'}
            onClick={() => {
              setMode('recipe');
              setStep('item');
              setSelectedItem(null);
              setSelectedRecipe(null);
              setSelectedExtraction(null);
            }}
            className="flex items-center gap-2 flex-1 h-12"
          >
            <Package className="w-4 h-4" />
            Recipe Production
          </Button>
          <Button
            variant={mode === 'extraction' ? 'default' : 'outline'}
            onClick={() => {
              setMode('extraction');
              setStep('item');
              setSelectedItem(null);
              setSelectedRecipe(null);
              setSelectedExtraction(null);
            }}
            className="flex items-center gap-2 flex-1 h-12"
          >
            <Drill className="w-4 h-4" />
            Resource Extraction
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-neutral-700 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            step === 'item' ? 'bg-orange-600 text-white' : 'text-neutral-400'
          }`}>
            {getIconForMode(mode)}
            <span className="font-medium">
              {mode === 'extraction' ? 'Select Resource' : 'Select Item'}
            </span>
          </div>
          
          <div className="h-px bg-neutral-600 flex-1 mx-3"></div>
          
          {mode === 'recipe' && (
            <>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                step === 'recipe' ? 'bg-orange-600 text-white' : 'text-neutral-400'
              }`}>
                <TestTube className="w-4 h-4" />
                <span className="font-medium">Choose Recipe</span>
              </div>
              
              <div className="h-px bg-neutral-600 flex-1 mx-3"></div>
            </>
          )}
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            step === 'quantity' ? 'bg-orange-600 text-white' : 'text-neutral-400'
          }`}>
            <span className="text-lg font-bold">#</span>
            <span className="font-medium">Set Quantity</span>
          </div>
        </div>
      </div>

      {/* Content based on current step */}
      {step === 'item' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder={mode === 'extraction' ? "Search extractable resources..." : "Search items..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="!bg-neutral-700 border-neutral-600 pl-10 h-12 !text-white placeholder:!text-neutral-400 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div className="bg-neutral-700 rounded-lg p-1">
            {loading ? (
              <div className="text-center py-12 text-neutral-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                Loading items...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <Package className="w-12 h-12 mx-auto mb-4 text-neutral-500" />
                <p className="text-sm">
                  {mode === 'extraction' 
                    ? 'No extractable resources found. Try searching for raw materials like "iron", "water", or "oil".'
                    : 'No items found. Try adjusting your search.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto custom-scrollbar">
                {filteredItems.map((item) => {
                  const extractionData = EXTRACTION_DATA[item.className];
                  return (
                    <button
                      key={item._id}
                      onClick={() => handleItemSelect(item)}
                      className="flex items-center gap-4 p-4 rounded-lg bg-neutral-800 hover:bg-neutral-600 transition-all duration-200 text-left w-full border border-transparent hover:border-orange-500/20"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-neutral-600 rounded-lg flex items-center justify-center">
                        <img
                          src={getItemImageUrl(item.className) || ''}
                          alt={item.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {mode === 'extraction' && extractionData && 
                            getIconForExtractionType(extractionData.type)
                          }
                          <h3 className="font-semibold text-white truncate">{item.name}</h3>
                          {item.liquid && <Droplets className="w-3 h-3 text-blue-400" />}
                        </div>
                        {mode === 'extraction' && extractionData && (
                          <p className="text-xs text-neutral-400 leading-relaxed">{extractionData.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-neutral-600 flex items-center justify-center">
                          <span className="text-xs text-white">→</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'recipe' && mode === 'recipe' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {selectedItem && (
                <div className="w-10 h-10 bg-neutral-600 rounded-lg flex items-center justify-center">
                  <img
                    src={getItemImageUrl(selectedItem.className) || ''}
                    alt={selectedItem.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Recipes for {selectedItem?.name}
                </h3>
                <p className="text-sm text-neutral-400">Choose a production recipe</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleBack} className="h-10">
              ← Back
            </Button>
          </div>

          <div className="bg-neutral-700 rounded-lg p-1">
            {loading ? (
              <div className="text-center py-12 text-neutral-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                Loading recipes...
              </div>
            ) : (recipes || []).length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <TestTube className="w-12 h-12 mx-auto mb-4 text-neutral-500" />
                <p className="text-sm">No recipes found for this item.</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                {(recipes || []).map((recipe) => (
                  <button
                    key={recipe._id}
                    onClick={() => handleRecipeSelect(recipe)}
                    className="flex items-center justify-between p-4 rounded-lg bg-neutral-800 hover:bg-neutral-600 transition-all duration-200 text-left w-full border border-transparent hover:border-orange-500/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{recipe.name}</h4>
                        {recipe.alternate && (
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">
                            ALT
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-400">
                        {recipe.alternate ? 'Alternate Recipe' : 'Standard Recipe'} • Production time: {recipe.time}s
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-6 h-6 rounded-full bg-neutral-600 flex items-center justify-center">
                        <span className="text-xs text-white">→</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'quantity' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-neutral-700 rounded-lg p-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {mode === 'extraction' ? 'Extraction Configuration' : 'Production Configuration'}
              </h3>
              <p className="text-sm text-neutral-400">
                {mode === 'extraction' ? 'Set your extraction rate' : 'Set your production target'}
              </p>
            </div>
            <Button variant="outline" onClick={handleBack} className="h-10">
              ← Back
            </Button>
          </div>

          {selectedItem && (
            <div className="bg-neutral-700 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-600 rounded-lg flex items-center justify-center">
                  <img
                    src={getItemImageUrl(selectedItem.className) || ''}
                    alt={selectedItem.name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-lg">{selectedItem.name}</h4>
                  {mode === 'extraction' && selectedExtraction ? (
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-400 flex items-center gap-2">
                        {getIconForExtractionType(selectedExtraction.type)}
                        {selectedExtraction.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Using: {selectedExtraction.extractorType}
                        {selectedExtraction.powerConsumption && (
                          <span className="ml-2">• Power: {selectedExtraction.powerConsumption}MW</span>
                        )}
                      </p>
                    </div>
                  ) : selectedRecipe ? (
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-400 flex items-center gap-2">
                        <TestTube className="w-4 h-4" />
                        {selectedRecipe.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {selectedRecipe.alternate ? 'Alternate Recipe' : 'Standard Recipe'} • {selectedRecipe.time}s cycle time
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          <div className="bg-neutral-700 rounded-lg p-6 space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">
                {mode === 'extraction' ? 'Target Extraction Rate' : 'Target Production Rate'} (per minute)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(Number(e.target.value))}
                  placeholder="e.g., 60"
                  className="!bg-neutral-800 border-neutral-600 h-14 text-lg font-mono !text-white placeholder:!text-neutral-400 focus:ring-orange-500 focus:border-orange-500 pr-20"
                  min="0.1"
                  step="0.1"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-neutral-400 font-medium">
                  /min
                </div>
              </div>
              {mode === 'extraction' && selectedExtraction && (
                <div className="bg-neutral-800 rounded-lg p-3">
                  <p className="text-xs text-neutral-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Base {selectedExtraction.extractorType} rate: {selectedExtraction.baseRate}/min
                  </p>
                  {targetQuantity > selectedExtraction.baseRate && (
                    <p className="text-xs text-amber-400 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      Will require multiple extractors or overclocking
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button 
              onClick={handleComplete}
              disabled={!targetQuantity || targetQuantity <= 0}
              className="w-full bg-orange-600 hover:bg-orange-700 h-14 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="w-5 h-5 mr-2" />
              {mode === 'extraction' ? 'Add Extraction Line' : 'Add Production Line'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
