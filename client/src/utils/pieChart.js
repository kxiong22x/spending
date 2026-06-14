// Returns the Cartesian point on a circle at the given angle in radians.
function polarToCartesian(cx, cy, radius, angle) {
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

// Builds an SVG donut arc path string between two angles.
function arcPath(cx, cy, outerR, innerR, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const o1 = polarToCartesian(cx, cy, outerR, startAngle);
  const o2 = polarToCartesian(cx, cy, outerR, endAngle);
  const i1 = polarToCartesian(cx, cy, innerR, startAngle);
  const i2 = polarToCartesian(cx, cy, innerR, endAngle);
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${i1.x} ${i1.y} Z`;
}

// Sorts categories by total descending and computes SVG slice geometry for a donut chart.
export function computeSlices(categories, total, cx, cy, outerR, innerR) {
  const sorted = [...categories].sort((a, b) => b.total - a.total);
  let angle = -Math.PI / 2;
  return sorted.map(cat => {
    const fraction = cat.total / total;
    const start = angle;
    angle += fraction * 2 * Math.PI;
    return { path: arcPath(cx, cy, outerR, innerR, start, angle), name: cat.name, fraction, catTotal: cat.total };
  });
}
