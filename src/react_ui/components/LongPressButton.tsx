import React, { useState, useRef, useCallback, useEffect } from 'react';

interface LongPressButtonProps {
  onClick: () => void;
  onLongPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  longPressThreshold?: number; // in milliseconds
}

const LongPressButton: React.FC<LongPressButtonProps> = ({
  onClick,
  onLongPress,
  children,
  disabled = false,
  className = '',
  longPressThreshold = 500, // default to 500ms
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const startPressTimer = useCallback(() => {
    // Record start time for visual feedback
    startTimeRef.current = Date.now();
    
    // Set pressing state for visual feedback
    setIsPressing(true);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a new timer for long press
    timerRef.current = setTimeout(() => {
      setLongPressTriggered(true);
      setIsPressing(false);
      onLongPress();
    }, longPressThreshold);
  }, [longPressThreshold, onLongPress]);

  const cancelPressTimer = useCallback((shouldTriggerClick: boolean) => {
    // Clear the timeout
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // If we haven't triggered the long press and should trigger click, do it
    if (!longPressTriggered && shouldTriggerClick) {
      onClick();
    }
    
    // Reset states
    setIsPressing(false);
    setLongPressTriggered(false);
  }, [longPressTriggered, onClick]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    
    // Only handle left clicks or touch
    if (e.button === 0 || e.pointerType === 'touch') {
      startPressTimer();
    }
  }, [disabled, startPressTimer]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    
    // Only handle left clicks or touch
    if (e.button === 0 || e.pointerType === 'touch') {
      cancelPressTimer(true);
    }
  }, [disabled, cancelPressTimer]);

  const handlePointerLeave = useCallback(() => {
    if (disabled) return;
    cancelPressTimer(false);
  }, [disabled, cancelPressTimer]);

  const handlePointerCancel = useCallback(() => {
    if (disabled) return;
    cancelPressTimer(false);
  }, [disabled, cancelPressTimer]);

  // Calculate progress for visual feedback
  const getProgressStyle = () => {
    if (!isPressing) return {};
    
    const elapsedTime = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsedTime / longPressThreshold, 1);
    
    return {
      backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) ${progress * 100}%, transparent ${progress * 100}%, transparent 100%)`,
    };
  };

  return (
    <button
      className={`${className} ${isPressing ? 'active' : ''}`}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
      style={getProgressStyle()}
    >
      {children}
    </button>
  );
};

export default LongPressButton;
