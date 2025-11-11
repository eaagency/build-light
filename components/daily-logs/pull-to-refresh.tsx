'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * PullToRefresh Component
 * Adds pull-to-refresh functionality for mobile devices
 *
 * Features:
 * - Touch-based pull down gesture
 * - Visual indicator with icon and text
 * - Haptic feedback (if supported)
 * - Smooth animations
 * - Mobile-only (hidden on desktop)
 */
export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startYRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_PULL_DISTANCE = 100;
  const TRIGGER_THRESHOLD = 80;

  // Check if device is mobile
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  };

  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || !isMobile()) return;

    // Only allow pull-to-refresh when scrolled to top
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || !isMobile() || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;

    if (distance > 0) {
      setIsPulling(true);

      // Apply diminishing returns to pull distance
      const adjustedDistance = Math.min(
        distance * 0.5,
        MAX_PULL_DISTANCE
      );

      setPullDistance(adjustedDistance);

      // Haptic feedback when reaching threshold
      if (adjustedDistance >= TRIGGER_THRESHOLD && pullDistance < TRIGGER_THRESHOLD) {
        triggerHapticFeedback();
      }

      // Prevent default scroll behavior when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || !isMobile() || isRefreshing) return;

    if (pullDistance >= TRIGGER_THRESHOLD) {
      setIsRefreshing(true);
      triggerHapticFeedback();

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
    startYRef.current = 0;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, disabled]);

  const getRefreshIcon = () => {
    if (isRefreshing) {
      return (
        <svg
          className="w-6 h-6 animate-spin text-buildlight-green"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }

    return (
      <svg
        className="w-6 h-6 text-buildlight-green transition-transform"
        style={{
          transform: `rotate(${(pullDistance / MAX_PULL_DISTANCE) * 180}deg)`,
        }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    );
  };

  const getRefreshText = () => {
    if (isRefreshing) return 'Refreshing...';
    if (pullDistance >= TRIGGER_THRESHOLD) return 'Release to refresh';
    return 'Pull to refresh';
  };

  const opacity = Math.min(pullDistance / TRIGGER_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center transition-all duration-200 z-10"
          style={{
            height: `${pullDistance}px`,
            opacity,
          }}
        >
          <div className="flex flex-col items-center gap-2 py-2">
            {getRefreshIcon()}
            <span className="text-xs font-medium text-buildlight-green">
              {getRefreshText()}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${isPulling || isRefreshing ? pullDistance : 0}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
