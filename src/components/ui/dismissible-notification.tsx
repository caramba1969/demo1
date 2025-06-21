'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DismissibleNotificationProps {
  children: React.ReactNode;
  autoDismissMs?: number;
  className?: string;
  onDismiss?: () => void;
  showCountdown?: boolean;
  showProgressBar?: boolean;
}

export function DismissibleNotification({ 
  children, 
  autoDismissMs = 30000, // 30 seconds default
  className = '',
  onDismiss,
  showCountdown = true,
  showProgressBar = true
}: DismissibleNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(autoDismissMs / 1000);
  useEffect(() => {
    if (!isVisible || isAnimatingOut) return;

    // Auto-dismiss timer
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    // Countdown timer for UI feedback
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Keyboard handler for escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(countdownInterval);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [autoDismissMs, isVisible, isAnimatingOut]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`relative transition-all duration-300 ease-in-out ${
        isAnimatingOut 
          ? 'opacity-0 transform scale-95 translate-y-2' 
          : 'opacity-100 transform scale-100 translate-y-0'
      } ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {children}
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-dismiss countdown */}
          {showCountdown && (
            <div className="text-xs text-neutral-500 hidden sm:block">
              {timeLeft > 0 ? `${timeLeft}s` : 'Dismissing...'}
            </div>
          )}
          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 transition-colors"
            aria-label="Dismiss notification"
            title="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Progress bar showing time remaining */}
      {showProgressBar && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700/30 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all ease-linear"
            style={{ 
              width: `${(timeLeft / (autoDismissMs / 1000)) * 100}%`,
              transition: timeLeft === 0 ? 'width 0.3s ease-out' : 'width 1s linear'
            }}
          />
        </div>
      )}
    </div>
  );
}
