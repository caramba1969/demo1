'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Loader2,
  Map,
  Globe
} from 'lucide-react';

interface Location {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
}

interface LocationSelectorProps {
  selectedLocationId?: string | null;
  onLocationSelect: (locationId: string | null) => void;
  className?: string;
}

export default function LocationSelector({ 
  selectedLocationId, 
  onLocationSelect, 
  className = "" 
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: '🌍'
  });

  // Common location icons
  const iconOptions = ['🌍', '🏭', '🌊', '🏔️', '🌋', '🏜️', '🌲', '🏙️', '⭐', '🌙'];
  
  // Common color options
  const colorOptions = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6b7280'  // gray
  ];

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      } else {
        console.error('Failed to load `locations`');
      }
    } catch (error) {
      console.error('Error loading `locations`:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) return;

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation),
      });

      if (response.ok) {
        const location = await response.json();
        setLocations(prev => [...prev, location]);
        setNewLocation({ name: '', description: '', color: '#3b82f6', icon: '🌍' });
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create `location`');
      }
    } catch (error) {
      console.error('Error creating `location`:', error);
      alert('Failed to create `location`');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const response = await fetch('/api/locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: locationId }),
      });

      if (response.ok) {
        setLocations(prev => prev.filter(loc => loc._id !== locationId));
        if (selectedLocationId === locationId) {
          onLocationSelect(null);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete `location`');
      }
    } catch (error) {
      console.error('Error deleting `location`:', error);
      alert('Failed to delete `location`');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-neutral-400">Loading locations...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location
        </label>
        
        <div className="grid grid-cols-1 gap-2">
          {/* No Location Option */}
          <button
            onClick={() => onLocationSelect(null)}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedLocationId === null || selectedLocationId === undefined
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-neutral-600 bg-neutral-800 text-neutral-300 hover:border-neutral-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" />
              <div>
                <div className="font-medium">No Location</div>
                <div className="text-xs opacity-75">Unassigned factory</div>
              </div>
            </div>
          </button>

          {/* Location Options */}
          {locations.map((location) => (
            <button
              key={location._id}
              onClick={() => onLocationSelect(location._id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedLocationId === location._id
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-neutral-600 bg-neutral-800 text-neutral-300 hover:border-neutral-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: location.color }}
                  >
                    {location.icon}
                  </div>
                  <div>
                    <div className="font-medium">{location.name}</div>
                    {location.description && (
                      <div className="text-xs opacity-75">{location.description}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLocation(location._id);
                    }}
                    className="p-1 h-6 w-6 rounded hover:bg-neutral-700 cursor-pointer transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-3 h-3" />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLocation(location._id);
                    }}
                    className="p-1 h-6 w-6 rounded hover:bg-neutral-700 cursor-pointer transition-colors flex items-center justify-center text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add New Location */}
      {!showAddForm ? (
        <Button
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full border-dashed border-neutral-600 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Location
        </Button>
      ) : (
        <div className="border border-neutral-600 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Map className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">New Location</span>
          </div>
          
          <Input
            placeholder="Location name"
            value={newLocation.name}
            onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
            className="bg-neutral-800 border-neutral-600 text-white"
          />
          
          <Input
            placeholder="Description (optional)"
            value={newLocation.description}
            onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
            className="bg-neutral-800 border-neutral-600 text-white"
          />
          
          {/* Icon Selection */}
          <div>
            <label className="text-xs text-neutral-400 mb-2 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewLocation(prev => ({ ...prev, icon }))}
                  className={`w-8 h-8 rounded border text-sm ${
                    newLocation.icon === icon
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-neutral-600 bg-neutral-800 hover:border-neutral-500'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          
          {/* Color Selection */}
          <div>
            <label className="text-xs text-neutral-400 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewLocation(prev => ({ ...prev, color }))}
                  className={`w-6 h-6 rounded border-2 ${
                    newLocation.color === color
                      ? 'border-white'
                      : 'border-neutral-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleAddLocation}
              disabled={!newLocation.name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Create
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setNewLocation({ name: '', description: '', color: '#3b82f6', icon: '🌍' });
              }}
              className="border-neutral-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
