/**
 * Touch Gesture Support - Issue #70
 * Provides swipe-to-delete, pull-to-refresh, and other mobile gestures
 */

import React from 'react';

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipeGesture(handlers: SwipeHandlers, threshold: number = 50) {
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > threshold && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      } else if (distanceX < -threshold && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      }
    } else {
      if (distanceY > threshold && handlers.onSwipeUp) {
        handlers.onSwipeUp();
      } else if (distanceY < -threshold && handlers.onSwipeDown) {
        handlers.onSwipeDown();
      }
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const startY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY.current > 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;
      
      if (distance > 0) {
        setPullDistance(Math.min(distance, 100));
        setIsPulling(distance > 60);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling) {
      await onRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
  };

  return {
    isPulling,
    pullDistance,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}
