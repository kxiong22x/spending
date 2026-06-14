import { useState } from 'react';

const DIMMED_OPACITY = 0.35;

// Manages hover state for pie chart slices, syncing local highlight with an optional external callback.
export function useSliceHover(onSliceHover?: (name: string | null) => void) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  function handleMouseEnter(name: string): void {
    setHoveredSlice(name);
    onSliceHover?.(name);
  }

  function handleMouseLeave(): void {
    setHoveredSlice(null);
    onSliceHover?.(null);
  }

  function sliceOpacity(name: string): number {
    return hoveredSlice && hoveredSlice !== name ? DIMMED_OPACITY : 1;
  }

  return { handleMouseEnter, handleMouseLeave, sliceOpacity };
}
