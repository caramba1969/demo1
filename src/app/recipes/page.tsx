'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Clock, 
  Zap, 
  Package, 
  ArrowRight,
  Building2,
  ChevronDown,
  X
} from 'lucide-react';

interface Recipe {
  _id: string;
  className: string;
  name: string;
  time: number;
  ingredients: Array<{
    item: string;
    amount: number;
    name?: string;
    image?: string;
  }>;
  products: Array<{
    item: string;
    amount: number;
    name?: string;
    image?: string;
  }>;
  producedIn: string[];
  maxPower?: number;
}

interface Factory {
  id: string;
  name: string;
  order?: number;
  tasks: Array<{ id: string; text: string; completed: boolean; createdAt: string }>;
  notes: Array<{ id: string; text: string; createdAt: string }>;
}

export default function RecipesPage() {
  const { data: session, status } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique building types
  const buildingTypes = Array.from(
    new Set(recipes.flatMap(recipe => recipe.producedIn))
  ).filter(Boolean).sort();

  // Load recipes
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/recipes?limit=1000');
        if (!response.ok) throw new Error('Failed to fetch recipes');

        const data = await response.json();
        setRecipes(data.recipes || []);
      } catch (err) {
        console.error('Error loading recipes:', err);
        setError('Failed to load recipes');
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      loadRecipes();
    }
  }, [status]);

  // Load factories for sidebar
  useEffect(() => {
    const loadFactories = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/factories');
        if (!response.ok) throw new Error('Failed to fetch factories');

        const data = await response.json();        setFactories(data.map((f: any) => ({
          id: f._id,
          name: f.name,
          order: f.order || 0,
          tasks: f.tasks || [],
          notes: f.notes || []
        })));
      } catch (err) {
        console.error('Error loading factories:', err);
      }
    };

    loadFactories();
  }, [status]);

  // Filter recipes based on search and building filter
  useEffect(() => {
    let filtered = recipes;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(term) ||
        recipe.ingredients.some(ing => ing.name?.toLowerCase().includes(term)) ||
        recipe.products.some(prod => prod.name?.toLowerCase().includes(term))
      );
    }

    if (selectedBuilding) {
      filtered = filtered.filter(recipe =>
        recipe.producedIn.includes(selectedBuilding)
      );
    }

    setFilteredRecipes(filtered);
  }, [recipes, searchTerm, selectedBuilding]);

  // Format time display
  const formatTime = (timeInSeconds: number) => {
    if (timeInSeconds < 60) return `${timeInSeconds}s`;
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
  };

  // Format building name
  const formatBuildingName = (building: string) => {
    return building
      .replace(/^Build_/, '')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
  };

  // Calculate items per minute
  const calculateItemsPerMinute = (amount: number, time: number) => {
    return ((amount / time) * 60).toFixed(1);
  };

  // Empty functions for sidebar
  const handleAddFactory = () => {};
  const handleSelectFactory = () => {};
  const handleDeleteFactory = () => {};
  const handleReorderFactories = () => {};

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-neutral-400 flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-neutral-400">Please sign in to view recipes.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar 
        factories={factories}
        onAddFactory={handleAddFactory}
        onSelectFactory={handleSelectFactory}
        onDeleteFactory={handleDeleteFactory}
        onReorderFactories={handleReorderFactories}
      />
      
      <main className="ml-64 flex-1 overflow-y-auto h-[calc(100vh-3rem)]">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 min-h-full">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-8 h-8 text-orange-400" />
                <h1 className="text-3xl font-bold text-white">Recipe Database</h1>
              </div>
              <p className="text-neutral-400 text-lg">
                Browse and search through all available Satisfactory recipes
              </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <Input
                    placeholder="Search recipes, ingredients, or products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-48">
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Building Type
                      </label>
                      <select
                        value={selectedBuilding}
                        onChange={(e) => setSelectedBuilding(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white"
                      >
                        <option value="">All Buildings</option>
                        {buildingTypes.map(building => (
                          <option key={building} value={building}>
                            {formatBuildingName(building)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedBuilding('');
                        }}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Count */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-neutral-400">
                  Showing {filteredRecipes.length} of {recipes.length} recipes
                </p>
                {(searchTerm || selectedBuilding) && (
                  <p className="text-sm text-orange-400">
                    {searchTerm && `Search: "${searchTerm}"`}
                    {searchTerm && selectedBuilding && ' • '}
                    {selectedBuilding && `Building: ${formatBuildingName(selectedBuilding)}`}
                  </p>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-2 text-neutral-400">
                  <div className="w-6 h-6 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                  Loading recipes...
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {/* Recipes Grid */}
            {!isLoading && !error && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe._id}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-orange-500/50 transition-colors"
                  >
                    {/* Recipe Header */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {recipe.name}
                      </h3>
                      
                      {/* Recipe Stats */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1 text-neutral-400">
                          <Clock className="w-4 h-4" />
                          {formatTime(recipe.time)}
                        </div>
                        {recipe.maxPower && (
                          <div className="flex items-center gap-1 text-neutral-400">
                            <Zap className="w-4 h-4" />
                            {recipe.maxPower} MW
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-neutral-400">
                          <Building2 className="w-4 h-4" />
                          {formatBuildingName(recipe.producedIn[0] || 'Unknown')}
                        </div>
                      </div>
                    </div>                    {/* Ingredients */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-neutral-300 mb-2">Ingredients</h4>
                      <div className="space-y-2">
                        {recipe.ingredients.map((ingredient, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">                            <div className="w-8 h-8 bg-slate-800 rounded border border-slate-600 flex-shrink-0 overflow-hidden hover:border-orange-500/50 transition-colors">
                              <img
                                src={ingredient.image || '/images/items/default.svg'}
                                alt={ingredient.name || ingredient.item}
                                className="w-full h-full object-cover hover:scale-110 transition-transform"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/images/items/default.svg';
                                }}
                              />
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                              <span className="text-neutral-400">
                                {ingredient.name || ingredient.item}
                              </span>
                              <span className="text-white">
                                {ingredient.amount} ({calculateItemsPerMinute(ingredient.amount, recipe.time)}/min)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center mb-4">
                      <ArrowRight className="w-5 h-5 text-orange-400" />
                    </div>                    {/* Products */}
                    <div>
                      <h4 className="text-sm font-medium text-neutral-300 mb-2">Products</h4>
                      <div className="space-y-2">
                        {recipe.products.map((product, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">                            <div className="w-8 h-8 bg-slate-800 rounded border border-slate-600 flex-shrink-0 overflow-hidden hover:border-orange-500/50 transition-colors">
                              <img
                                src={product.image || '/images/items/default.svg'}
                                alt={product.name || product.item}
                                className="w-full h-full object-cover hover:scale-110 transition-transform"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/images/items/default.svg';
                                }}
                              />
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                              <span className="text-neutral-400">
                                {product.name || product.item}
                              </span>
                              <span className="text-orange-400 font-medium">
                                {product.amount} ({calculateItemsPerMinute(product.amount, recipe.time)}/min)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && !error && filteredRecipes.length === 0 && recipes.length > 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-400 mb-2">No recipes found</h3>
                <p className="text-neutral-500">
                  Try adjusting your search terms or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
