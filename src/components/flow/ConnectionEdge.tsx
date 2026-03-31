'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import type { FlowEdgeData } from './flowTypes';

export default function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps & { data?: FlowEdgeData }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const amount = data?.amount ?? 0;
  const strokeWidth = Math.max(1.5, Math.min(4, amount / 30));

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: '#f97316',
          strokeWidth,
          strokeDasharray: '6 3',
          animation: 'flow-dash 1.2s linear infinite',
          opacity: 0.85,
        }}
      />
      {data?.itemName && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="bg-neutral-900/90 border border-neutral-700 text-neutral-300 text-xs rounded px-2 py-0.5 whitespace-nowrap"
          >
            {data.itemName}
            {amount > 0 && (
              <span className="text-orange-400 ml-1">· {amount}/min</span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
