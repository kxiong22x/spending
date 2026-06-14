import { useState } from 'react';

const DIMMED_OPACITY = 0.35;

// Manages hover state for pie chart slices, syncing local highlight with an optional external callback.
export function useSliceHover(onSliceHover) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  function handleMouseEnter(name) {
    setHoveredSlice(name);
    onSliceHover?.(name);
  }

  function handleMouseLeave() {
    setHoveredSlice(null);
    onSliceHover?.(null);
  }

  function sliceOpacity(name) {
    return hoveredSlice && hoveredSlice !== name ? DIMMED_OPACITY : 1;
  }

  return { handleMouseEnter, handleMouseLeave, sliceOpacity };
}
