import { useState } from 'react';

const DIMMED_OPACITY = 0.35;

// Manages hover state for pie/bar chart slices, syncing with optional external callbacks. Accepts an external locked slice for visual display.
export function useSliceHover(
  onSliceHover?: (name: string | null) => void,
  onSliceClick?: (name: string) => void,
  lockedSlice?: string | null,
) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const effectiveSlice = hoveredSlice ?? lockedSlice ?? null;

  function handleMouseEnter(name: string): void {
    setHoveredSlice(name);
    onSliceHover?.(name);
  }

  function handleMouseLeave(): void {
    setHoveredSlice(null);
    onSliceHover?.(null);
  }

  function handleClick(name: string): void {
    onSliceClick?.(name);
  }

  function sliceOpacity(name: string): number {
    return effectiveSlice && effectiveSlice !== name ? DIMMED_OPACITY : 1;
  }

  return { handleMouseEnter, handleMouseLeave, handleClick, sliceOpacity };
}
