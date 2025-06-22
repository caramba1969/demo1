'use client';

import React, { useState, useEffect } from 'react';
import { Factory, Zap, Clock, Trash2, Edit3, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Utility function to get item image URL from className
const getItemImageUrl = (className: string) => {
  if (!className) return null;
  // Convert className to lowercase and replace underscores with hyphens for the image filename
  const imageName = className.toLowerCase().replace(/_/g, '-');
  return `/images/items/${imageName}_64.png`;
};

interface ProductionLine {
  _id: string;
  itemClassName: string;
  recipeClassName: string;
  targetQuantityPerMinute: number;
  actualQuantityPerMinute?: number;
  buildingCount?: number;
  buildingType?: string;
  powerConsumption?: number;
  efficiency?: number;
  notes?: string;
  active: boolean;
  item?: {
    name: string;
    icon?: string;
    slug: string;
  };
  recipe?: {
    name: string;
    time: number;    ingredients: Array<{ item: string; amount: number; name?: string }>;
    products: Array<{ item: string; amount: number; name?: string }>;
  };
}

interface ProductionLineCardProps {
  productionLine: ProductionLine;
  onUpdate: (id: string, updates: Partial<ProductionLine>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  className?: string;
}

export default function ProductionLineCard({ 
  productionLine, 
  onUpdate, 
  onDelete, 
  className = '' 
}: ProductionLineCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTarget, setEditTarget] = useState(productionLine.targetQuantityPerMinute);
  const [editNotes, setEditNotes] = useState(productionLine.notes || '');
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(`production-line-${productionLine._id}-collapsed`);
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, [productionLine._id]);

  // Save collapse state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(`production-line-${productionLine._id}-collapsed`, JSON.stringify(isCollapsed));
  }, [isCollapsed, productionLine._id]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onUpdate(productionLine._id, {
        targetQuantityPerMinute: editTarget,
        notes: editNotes
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update production line:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditTarget(productionLine.targetQuantityPerMinute);
    setEditNotes(productionLine.notes || '');
    setIsEditing(false);
  };

  const toggleActive = async () => {
    try {
      await onUpdate(productionLine._id, {
        active: !productionLine.active
      });
    } catch (error) {
      console.error('Failed to toggle production line:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this production line?')) {
      try {
        await onDelete(productionLine._id);
      } catch (error) {
        console.error('Failed to delete production line:', error);
      }
    }
  };

  const efficiency = productionLine.efficiency || 100;
  const actualOutput = (productionLine.actualQuantityPerMinute || 0) * (efficiency / 100);

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-lg p-6 ${className} ${
      !productionLine.active ? 'opacity-60' : ''
    }`}>      {/* Header */}
      <div className="flex items-start justify-between mb-4">        <div className="flex items-center gap-3 flex-1">          <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center relative overflow-hidden">
            {productionLine.itemClassName && getItemImageUrl(productionLine.itemClassName) ? (
              <img 
                src={getItemImageUrl(productionLine.itemClassName)!} 
                alt={productionLine.item?.name || 'Item'} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback to Package icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Package className={`w-5 h-5 text-orange-400 ${productionLine.itemClassName && getItemImageUrl(productionLine.itemClassName) ? 'hidden' : ''}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg">
              {productionLine.item?.name || 'Unknown Item'}
            </h3>
            <p className="text-slate-400 text-sm">
              {productionLine.recipe?.name || 'Unknown Recipe'}
            </p>
            {isCollapsed && (
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-slate-500">
                  Target: {productionLine.targetQuantityPerMinute.toFixed(1)}/min
                </span>
                <span className="text-xs text-slate-500">
                  Buildings: {productionLine.buildingCount || 0}
                </span>
                <span className="text-xs text-slate-500">
                  Power: {productionLine.powerConsumption || 0}MW
                </span>
              </div>
            )}
          </div>
        </div>
          <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCollapse}
            className="border-slate-600 text-slate-400 hover:bg-slate-700"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleActive}
            className={`${
              productionLine.active 
                ? 'border-green-500 text-green-400 hover:bg-green-500/10' 
                : 'border-red-500 text-red-400 hover:bg-red-500/10'
            }`}
          >
            {productionLine.active ? 'Active' : 'Inactive'}
          </Button>
          
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-slate-600 text-slate-400 hover:bg-slate-700"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={loading}
                className="border-green-500 text-green-400 hover:bg-green-500/10"
              >
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="border-slate-600 text-slate-400 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </>
          )}        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* Production Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-slate-300">Target Output</span>
          </div>
          {isEditing ? (
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={editTarget}
              onChange={(e) => setEditTarget(parseFloat(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600 text-white text-lg font-bold"
            />
          ) : (
            <p className="text-2xl font-bold text-white">
              {productionLine.targetQuantityPerMinute.toFixed(1)}
              <span className="text-sm font-normal text-slate-400 ml-1">/min</span>
            </p>
          )}
        </div>        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Factory className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">Buildings</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {productionLine.buildingCount || 0}
          </p>
          <p className="text-sm text-slate-400">
            {productionLine.buildingType ? 
              productionLine.buildingType
                .replace(/^Desc_/, '')
                .replace(/Build_/, '')
                .replace(/_C$/, '')
                .replace(/_/g, ' ')
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .replace(/^\w/, c => c.toUpperCase()) || 'Unknown'
              : 'Unknown'
            }
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-slate-300">Power</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {productionLine.powerConsumption || 0}
            <span className="text-sm font-normal text-slate-400 ml-1">MW</span>
          </p>
        </div>
      </div>      {/* Recipe Details */}
      {productionLine.recipe && (
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recipe Details
          </h4>
          
          {/* Recipe Name */}
          <div className="mb-3 pb-3 border-b border-slate-700">
            <p className="text-slate-400 text-xs mb-1">Selected Recipe</p>
            <p className="text-white font-medium">{productionLine.recipe.name}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Cycle Time</p>
              <p className="text-white">{productionLine.recipe.time} seconds</p>
            </div>
            
            <div>
              <p className="text-slate-400 mb-1">Actual Output</p>
              <p className="text-white">
                {actualOutput.toFixed(1)} items/min
                {efficiency < 100 && (
                  <span className="text-yellow-400 ml-1">({efficiency}%)</span>
                )}
              </p>
            </div>
          </div>{productionLine.recipe.ingredients.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-slate-400 text-xs mb-2">Ingredients per cycle:</p>              <div className="flex flex-wrap gap-2">
                {productionLine.recipe.ingredients.map((ingredient, index) => {
                  // Calculate total ingredient consumption based on building count
                  const buildingCount = productionLine.buildingCount || 0;
                  const cycleTime = productionLine.recipe?.time || 1;
                  const ingredientPerMinute = (ingredient.amount * buildingCount * 60) / cycleTime;
                  
                  return (
                    <span
                      key={index}
                      className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 flex items-center gap-1"
                    >                      {ingredient.item && getItemImageUrl(ingredient.item) && (
                        <img 
                          src={getItemImageUrl(ingredient.item)!} 
                          alt={ingredient.name || ingredient.item} 
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span>
                        {ingredient.amount}x {ingredient.name || ingredient.item}
                        {buildingCount > 0 && (
                          <span className="text-blue-400 ml-1">
                            ({ingredientPerMinute.toFixed(1)}/min)
                          </span>
                        )}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}      {/* Notes */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="font-medium text-white mb-2">Notes</h4>
        {isEditing ? (
          <Input
            type="text"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Add notes about this production line..."
            className="bg-slate-700 border-slate-600 text-white"
          />
        ) : (
          <p className="text-slate-300 text-sm">
            {productionLine.notes || 'No notes added'}
          </p>        )}
      </div>
        </>
      )}

      {/* Footer Summary */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-400">Consumes:</span>
              <span className="text-yellow-400 font-medium">{productionLine.powerConsumption || 0} MW</span>
            </div>
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">Buildings:</span>
              <span className="text-blue-400 font-medium">{productionLine.buildingCount || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-400" />
              <span className="text-slate-400">Produces:</span>
              <span className="text-orange-400 font-medium">{actualOutput.toFixed(1)}/min</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${productionLine.active ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className={`text-xs font-medium ${productionLine.active ? 'text-green-400' : 'text-red-400'}`}>
              {productionLine.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
