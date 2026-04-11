'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (requiredAmount: number) => Promise<void>;
  sourceFactoryName: string;
  targetFactoryName: string;
  itemName: string;
  suggestedAmount: number;
}

export default function ConnectionDialog({
  open,
  onClose,
  onConfirm,
  sourceFactoryName,
  targetFactoryName,
  itemName,
  suggestedAmount,
}: ConnectionDialogProps) {
  const [amount, setAmount] = useState(suggestedAmount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync amount when suggested value changes (e.g. dialog re-used for different connections)
  useEffect(() => {
    setAmount(suggestedAmount);
  }, [suggestedAmount]);

  const handleConfirm = async () => {
    if (amount <= 0) { setError('Amount must be greater than 0'); return; }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(amount);
    } catch {
      setError('Failed to create connection. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white text-base">Create Connection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Factory flow */}
          <div className="flex items-center gap-2 text-sm bg-neutral-800 rounded-lg px-3 py-2">
            <span className="text-neutral-300 font-medium truncate max-w-[90px]">{sourceFactoryName}</span>
            <ArrowRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span className="text-neutral-300 font-medium truncate max-w-[90px]">{targetFactoryName}</span>
          </div>

          {/* Item */}
          <div>
            <p className="text-xs text-neutral-500 mb-1">Item</p>
            <p className="text-sm text-orange-400 font-medium">{itemName}</p>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-xs text-neutral-500 block mb-1">
              Required amount (items/min)
            </label>
            <Input
              type="number"
              min={0.1}
              step={1}
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onClose(); }}
              autoFocus
              className="bg-neutral-800 border-neutral-600 text-white h-8 text-sm"
            />
            {suggestedAmount > 0 && (
              <p className="text-xs text-neutral-600 mt-1">
                Source output: {suggestedAmount.toFixed(1)}/min
              </p>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="text-neutral-400 hover:text-white h-8"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={saving || amount <= 0}
              className="bg-orange-600 hover:bg-orange-700 text-white h-8"
            >
              {saving ? 'Connecting…' : 'Connect'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
