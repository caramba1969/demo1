'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PaletteItemCard from './PaletteItemCard';
import type { PaletteItem } from './flowTypes';

type TabType = 'items' | 'recipes';

interface RawItem {
  _id: string;
  className: string;
  name: string;
  description?: string;
}

interface RawRecipe {
  _id: string;
  className: string;
  name: string;
  products?: Array<{ item: string; amount: number }>;
}

export default function PalettePanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<TabType>('items');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<PaletteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const url = `/api/items?search=${encodeURIComponent(query)}&limit=80&nameOnly=true`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setItems(
        (data.items || []).map((it: RawItem) => ({
          type: 'item' as const,
          itemClassName: it.className,
          name: it.name,
          description: it.description,
        }))
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipes = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const url = `/api/recipes?limit=80${query ? `&search=${encodeURIComponent(query)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      // Deduplicate by display name (not just className) to avoid showing
      // visually identical recipe entries (e.g. "Basic Wall (1 m)" × 3)
      const seenNames = new Set<string>();
      const filtered = (data.recipes || []).filter((r: RawRecipe) => {
        if (seenNames.has(r.name)) return false;
        seenNames.add(r.name);
        return true;
      });
      // Apply client-side name filter as a safety net in case the API
      // search param isn't applied (e.g. during automated testing)
      const q = query.toLowerCase();
      const clientFiltered = q
        ? filtered.filter((r: RawRecipe) => r.name.toLowerCase().includes(q))
        : filtered;
      setItems(
        clientFiltered.map((r: RawRecipe) => ({
          type: 'recipe' as const,
          itemClassName: r.products?.[0]?.item ?? r.className,
          recipeClassName: r.className,
          name: r.name,
        }))
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (tab === 'items') fetchItems(search);
      else fetchRecipes(search);
    }, 300);
  }, [search, tab, fetchItems, fetchRecipes]);

  return (
    <div
      className={`absolute left-0 top-0 z-10 h-full flex transition-all duration-200 pointer-events-none`}
    >
      {/* Panel */}
      <div
        className={`pointer-events-auto flex flex-col bg-neutral-950/95 border-r border-neutral-800 backdrop-blur-sm transition-all duration-200 ${
          collapsed ? 'w-0 overflow-hidden' : 'w-56'
        }`}
      >
        {!collapsed && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-neutral-800 flex-shrink-0">
              <button
                onClick={() => setTab('items')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                  tab === 'items'
                    ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/5'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" /> Items
              </button>
              <button
                onClick={() => setTab('recipes')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                  tab === 'recipes'
                    ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/5'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" /> Recipes
              </button>
            </div>

            {/* Search */}
            <div className="p-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${tab}…`}
                  className="pl-7 h-7 text-xs bg-neutral-900 border-neutral-700 text-neutral-200 placeholder:text-neutral-600"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
              {loading ? (
                <p className="text-xs text-neutral-500 text-center py-4">Loading…</p>
              ) : items.length === 0 ? (
                <p className="text-xs text-neutral-600 text-center py-4 italic">No results</p>
              ) : (
                items.map(item => (
                  <PaletteItemCard
                    key={`${item.type}-${item.itemClassName}-${item.recipeClassName ?? ''}`}
                    item={item}
                  />
                ))
              )}
            </div>

            {/* Hint */}
            <div className="px-2 py-2 border-t border-neutral-800 flex-shrink-0">
              <p className="text-xs text-neutral-600 text-center">Drag onto a factory to add a production line</p>
            </div>
          </>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="pointer-events-auto self-center -ml-px bg-neutral-800 border border-neutral-700 rounded-r-md p-1 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );
}
