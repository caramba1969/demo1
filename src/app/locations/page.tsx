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
  Save,
  Factory as FactoryIcon
} from 'lucide-react';

interface Location {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: '🌍'
  });

  // Common location icons
  const iconOptions = [
    '🌍', '🏭', '🌊', '🏔️', '🌋', '🏜️', '🌲', '🏙️', 
    '⭐', '🌙', '🚀', '⚡', '🔥', '❄️', '🌸', '🍃',
    '🏰', '🏗️', '🏢', '🏪', '🎯', '💎', '⚙️', '🔧'
  ];
  
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
    '#6b7280', // gray
    '#14b8a6', // teal
    '#a855f7'  // purple
  ];

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      } else {
        console.error('Failed to load locations');
      }
    } catch (error) {
      console.error('Error loading locations:', error);
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
        alert(errorData.error || 'Failed to create location');
      }
    } catch (error) {
      console.error('Error creating location:', error);
      alert('Failed to create location');
    }
  };

  const handleUpdateLocation = async (locationId: string, updates: Partial<Location>) => {
    try {
      const response = await fetch('/api/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: locationId, ...updates }),
      });

      if (response.ok) {
        const updatedLocation = await response.json();
        setLocations(prev => prev.map(loc => 
          loc._id === locationId ? updatedLocation : loc
        ));
        setEditingId(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) return;

    try {
      const response = await fetch('/api/locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: locationId }),
      });

      if (response.ok) {
        setLocations(prev => prev.filter(loc => loc._id !== locationId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-3 text-neutral-400">Loading locations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Locations Management</h1>
          </div>
          <p className="text-neutral-400">
            Organize your factories by creating and managing different locations. 
            Each location can represent a geographical area, production zone, or any organizational structure you prefer.
          </p>
        </div>

        {/* Add New Location Button */}
        {!showAddForm && (
          <div className="mb-6">
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Location
            </Button>
          </div>
        )}

        {/* Add New Location Form */}
        {showAddForm && (
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Map className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Create New Location</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">Location Name *</label>
                <Input
                  placeholder="e.g., Northern Mountains, Main Industrial Zone"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-neutral-800 border-neutral-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">Description</label>
                <Input
                  placeholder="Optional description"
                  value={newLocation.description}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-neutral-800 border-neutral-600 text-white"
                />
              </div>
            </div>
            
            {/* Icon Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium text-neutral-300 mb-2 block">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewLocation(prev => ({ ...prev, icon }))}
                    className={`w-10 h-10 rounded border text-lg transition-colors ${
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
            <div className="mb-6">
              <label className="text-sm font-medium text-neutral-300 mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewLocation(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      newLocation.color === color
                        ? 'border-white scale-110'
                        : 'border-neutral-600 hover:border-neutral-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleAddLocation}
                disabled={!newLocation.name.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Create Location
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewLocation({ name: '', description: '', color: '#3b82f6', icon: '🌍' });
                }}
                className="border-neutral-600"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Locations List */}
        <div className="space-y-4">
          {locations.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900 border border-neutral-700 rounded-lg">
              <MapPin className="w-16 h-16 mx-auto text-neutral-600 mb-4" />
              <h3 className="text-xl font-medium text-neutral-400 mb-2">No locations yet</h3>
              <p className="text-neutral-500">Create your first location to start organizing your factories</p>
            </div>
          ) : (
            locations.map((location) => (
              <LocationCard
                key={location._id}
                location={location}
                isEditing={editingId === location._id}
                onEdit={() => setEditingId(location._id)}
                onSave={(updates) => handleUpdateLocation(location._id, updates)}
                onCancel={() => setEditingId(null)}
                onDelete={() => handleDeleteLocation(location._id)}
                iconOptions={iconOptions}
                colorOptions={colorOptions}
              />
            ))
          )}
        </div>

        {/* Back to Factories Link */}
        <div className="mt-8 pt-6 border-t border-neutral-700">
          <a 
            href="/"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
          >
            <FactoryIcon className="w-4 h-4 mr-2" />
            Back to Factories
          </a>
        </div>
      </div>
    </div>
  );
}

// Location Card Component
interface LocationCardProps {
  location: Location;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Location>) => void;
  onCancel: () => void;
  onDelete: () => void;
  iconOptions: string[];
  colorOptions: string[];
}

function LocationCard({ 
  location, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete,
  iconOptions,
  colorOptions 
}: LocationCardProps) {
  const [editData, setEditData] = useState({
    name: location.name,
    description: location.description,
    color: location.color,
    icon: location.icon
  });

  useEffect(() => {
    if (isEditing) {
      setEditData({
        name: location.name,
        description: location.description,
        color: location.color,
        icon: location.icon
      });
    }
  }, [isEditing, location]);

  const handleSave = () => {
    if (!editData.name.trim()) return;
    onSave(editData);
  };

  if (isEditing) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-neutral-300 mb-2 block">Location Name</label>
            <Input
              value={editData.name}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-neutral-800 border-neutral-600 text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-300 mb-2 block">Description</label>
            <Input
              value={editData.description}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-neutral-800 border-neutral-600 text-white"
            />
          </div>
        </div>

        {/* Icon Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium text-neutral-300 mb-2 block">Icon</label>
          <div className="flex gap-2 flex-wrap">
            {iconOptions.map((icon) => (
              <button
                key={icon}
                onClick={() => setEditData(prev => ({ ...prev, icon }))}
                className={`w-10 h-10 rounded border text-lg transition-colors ${
                  editData.icon === icon
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
        <div className="mb-6">
          <label className="text-sm font-medium text-neutral-300 mb-2 block">Color</label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color}
                onClick={() => setEditData(prev => ({ ...prev, color }))}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  editData.color === color
                    ? 'border-white scale-110'
                    : 'border-neutral-600 hover:border-neutral-400'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={!editData.name.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-neutral-600"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 hover:border-neutral-600 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: location.color }}
          >
            {location.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{location.name}</h3>
            {location.description && (
              <p className="text-neutral-400 text-sm">{location.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-neutral-600 text-neutral-300 hover:text-white"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
