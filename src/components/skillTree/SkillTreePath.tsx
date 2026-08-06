import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface TreePoint {
  x: number;
  y: number;
}

function buildZigZagPath(points: TreePoint[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
  }
  return d;
}

interface SkillTreePathProps {
  points: TreePoint[];
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
}

export default function SkillTreePath({
  points,
  width,
  height,
  color = '#E5D5D0',
  strokeWidth = 6,
}: SkillTreePathProps) {
  const d = buildZigZagPath(points);
  if (!d) return null;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      <Path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
