'use client';

import { useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
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
  selected,
}: EdgeProps & { data?: FlowEdgeData }) {
  const { deleteElements } = useReactFlow();

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

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!data?.importId || !data?.targetFactoryId) return;
      const res = await fetch(
        `/api/factories/${data.targetFactoryId}/imports?importId=${data.importId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        deleteElements({ edges: [{ id }] });
      }
    },
    [data, id, deleteElements]
  );

  return (
    <>
      {/* Invisible wide hit area for easy clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#fb923c' : '#f97316',
          strokeWidth: selected ? strokeWidth + 0.5 : strokeWidth,
          strokeDasharray: '6 3',
          animation: 'flow-dash 1.2s linear infinite',
          opacity: selected ? 1 : 0.85,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="group/edgelabel flex items-center gap-1"
        >
          {data?.itemName && (
            <div className={`text-xs rounded px-2 py-0.5 whitespace-nowrap border ${
              selected
                ? 'bg-neutral-900/95 border-orange-500/50 text-neutral-200'
                : 'bg-neutral-900/90 border-neutral-700 text-neutral-300'
            }`}>
              {data.itemName}
              {amount > 0 && <span className="text-orange-400 ml-1">· {amount}/min</span>}
            </div>
          )}
          <button
            onClick={handleDelete}
            className="w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-xs leading-none flex-shrink-0 opacity-0 group-hover/edgelabel:opacity-100 transition-opacity shadow-lg"
            title="Delete connection"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
