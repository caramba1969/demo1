'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LocationSelector from './LocationSelector';
import { Factory, Save, Loader2 } from 'lucide-react';

interface EditFactoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFactoryUpdated: (factory: any) => void;
  factory: {
    id: string;
    name: string;
    locationId?: any;
  } | null;
}

export default function EditFactoryDialog({ 
  isOpen, 
  onClose, 
  onFactoryUpdated, 
  factory 
}: EditFactoryDialogProps) {
  const [factoryName, setFactoryName] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when factory changes
  useEffect(() => {
    if (factory) {
      setFactoryName(factory.name);
      setSelectedLocationId(
        factory.locationId ? 
          (typeof factory.locationId === 'object' ? factory.locationId._id : factory.locationId) : 
          null
      );
    }
  }, [factory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryName.trim() || !factory || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/factories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: factory.id,
          name: factoryName.trim(),
          locationId: selectedLocationId 
        }),
      });

      if (response.ok) {
        const updatedFactory = await response.json();
        const transformedFactory = {
          id: updatedFactory._id,
          name: updatedFactory.name,
          order: updatedFactory.order || 0,
          locationId: updatedFactory.locationId,
          tasks: updatedFactory.tasks || [],
          notes: updatedFactory.notes || []
        };
        
        onFactoryUpdated(transformedFactory);
        handleClose();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update factory');
      }
    } catch (error) {
      console.error('Error updating factory:', error);
      alert('Failed to update factory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFactoryName('');
    setSelectedLocationId(null);
    onClose();
  };

  if (!factory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-orange-400" />
            Edit Factory
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Factory Name</label>
            <Input
              placeholder="Enter factory name..."
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
              className="bg-neutral-800 border-neutral-600 text-white"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <LocationSelector
            selectedLocationId={selectedLocationId}
            onLocationSelect={setSelectedLocationId}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 border-neutral-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!factoryName.trim() || isSubmitting}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Factory
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
