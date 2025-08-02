'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LocationSelector from './LocationSelector';
import { Factory, Plus, Loader2 } from 'lucide-react';

interface AddFactoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFactoryAdded: (factory: any) => void;
}

export default function AddFactoryDialog({ isOpen, onClose, onFactoryAdded }: AddFactoryDialogProps) {
  const [factoryName, setFactoryName] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/factories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: factoryName.trim(),
          locationId: selectedLocationId 
        }),
      });

      if (response.ok) {
        const factory = await response.json();
        const transformedFactory = {
          id: factory._id,
          name: factory.name,
          order: factory.order || 0,
          locationId: factory.locationId,
          tasks: factory.tasks || [],
          notes: factory.notes || []
        };
        
        onFactoryAdded(transformedFactory);
        handleClose();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create `factory`');
      }
    } catch (error) {
      console.error('Error creating `factory`:', error);
      alert('Failed to create `factory`');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFactoryName('');
    setSelectedLocationId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-orange-400" />
            Create New Factory
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
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Factory
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
