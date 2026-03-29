'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RefreshCw, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GRID_SIZE = 40;

interface Factory {
  id: string;
  name: string;
}

interface Import {
  _id: string;
  sourceFactoryId: { _id: string; name: string };
  itemClassName: string;
  requiredAmount: number;
  item?: { name: string };
}

interface GraphNode {
  id: string;
  name: string;
  type: 'factory';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  itemName: string;
  amount: number;
}

interface FactoryDependencyGraphProps {
  factories: Factory[];
}

function snapToGrid(v: number): number {
  return Math.round(v / GRID_SIZE) * GRID_SIZE;
}

export default function FactoryDependencyGraph({ factories }: FactoryDependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const loadGraphData = async () => {
    if (factories.length === 0) return;
    setLoading(true);
    try {
      const nodes: GraphNode[] = factories.map(f => ({ id: f.id, name: f.name, type: 'factory' as const }));
      const links: GraphLink[] = [];

      for (const factory of factories) {
        try {
          const res = await fetch(`/api/factories/${factory.id}/imports`);
          if (res.ok) {
            const data = await res.json();
            (data.imports || [] as Import[]).forEach((imp: Import) => {
              const src = imp.sourceFactoryId;
              if (src?._id) {
                links.push({
                  source: src._id,
                  target: factory.id,
                  itemName: imp.item?.name || imp.itemClassName.replace(/^Desc_/, '').replace(/_C$/, '').replace(/_/g, ' '),
                  amount: imp.requiredAmount,
                });
              }
            });
          }
        } catch { /* ignore per-factory errors */ }
      }

      setGraphData({ nodes, links });
    } catch (e) {
      console.error('Error loading graph data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.graph-container > *').remove();
    svg.select('defs').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const container = svg.select<SVGGElement>('.graph-container');

    // ── Defs ──────────────────────────────────────────────────────────────
    const defs = svg.append('defs');

    // Grid pattern
    defs.append('pattern')
      .attr('id', 'grid')
      .attr('width', GRID_SIZE)
      .attr('height', GRID_SIZE)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('path')
      .attr('d', `M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`)
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1);

    // Larger grid accent
    defs.append('pattern')
      .attr('id', 'grid-large')
      .attr('width', GRID_SIZE * 4)
      .attr('height', GRID_SIZE * 4)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('path')
      .attr('d', `M ${GRID_SIZE * 4} 0 L 0 0 0 ${GRID_SIZE * 4}`)
      .attr('fill', 'none')
      .attr('stroke', '#293548')
      .attr('stroke-width', 1);

    // Drop shadow for cards
    const shadow = defs.append('filter').attr('id', 'card-shadow')
      .attr('x', '-20%').attr('y', '-30%').attr('width', '140%').attr('height', '160%');
    shadow.append('feDropShadow')
      .attr('dx', 0).attr('dy', 4).attr('stdDeviation', 6)
      .attr('flood-color', '#000').attr('flood-opacity', 0.6);

    // Clean arrowhead marker
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 2 L 9 5 L 0 8 Z')
      .attr('fill', '#f97316')
      .attr('opacity', 0.8);

    // ── Grid background (inside container so it pans/zooms with content) ──
    container.append('rect')
      .attr('class', 'grid-bg')
      .attr('x', -5000).attr('y', -5000)
      .attr('width', 10000).attr('height', 10000)
      .attr('fill', 'url(#grid-large)');
    container.append('rect')
      .attr('class', 'grid-bg')
      .attr('x', -5000).attr('y', -5000)
      .attr('width', 10000).attr('height', 10000)
      .attr('fill', 'url(#grid)');

    // ── Zoom ──────────────────────────────────────────────────────────────
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        container.attr('transform', event.transform.toString());
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    // ── Simulation ────────────────────────────────────────────────────────
    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links)
        .id(d => d.id).distance(280).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(120))
      .alphaDecay(0.06)
      .on('end', () => {
        // Once settled, pin every node at its current position so they never move again
        graphData.nodes.forEach(d => {
          d.fx = snapToGrid(d.x!);
          d.fy = snapToGrid(d.y!);
        });
        node.attr('transform', d => `translate(${d.fx},${d.fy})`);
      });
    simulationRef.current = simulation;

    // ── Links ─────────────────────────────────────────────────────────────
    const cardW = 160;
    const cardH = 52;

    const linkG = container.append('g').attr('class', 'links');

    const linkLine = linkG.selectAll<SVGLineElement, GraphLink>('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', '#f97316')
      .attr('stroke-width', d => Math.max(1.5, Math.min(5, d.amount / 30)))
      .attr('stroke-opacity', 0.55)
      .attr('marker-end', 'url(#arrow)');

    // Link label groups
    const linkLabelG = linkG.selectAll<SVGGElement, GraphLink>('g')
      .data(graphData.links)
      .join('g');

    linkLabelG.append('rect')
      .attr('fill', '#0f172a')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    linkLabelG.append('text')
      .attr('class', 'link-text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('pointer-events', 'none')
      .text(d => `${d.itemName}  ${d.amount.toFixed(1)}/min`);

    // ── Nodes ─────────────────────────────────────────────────────────────
    const node = container.append('g').attr('class', 'nodes')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(graphData.nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'grab')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (_event, d) => {
          // Do NOT restart simulation — keeps all other nodes frozen
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
          d.x = event.x;
          d.y = event.y;
          // Manually update just this node and its connected edges
          node.filter(n => n.id === d.id).attr('transform', `translate(${d.fx},${d.fy})`);
          linkLine
            .attr('x1', l => {
              const s = l.source as GraphNode; const t = l.target as GraphNode;
              return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).x1;
            })
            .attr('y1', l => {
              const s = l.source as GraphNode; const t = l.target as GraphNode;
              return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).y1;
            })
            .attr('x2', l => {
              const s = l.source as GraphNode; const t = l.target as GraphNode;
              return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).x2;
            })
            .attr('y2', l => {
              const s = l.source as GraphNode; const t = l.target as GraphNode;
              return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).y2;
            });
          linkLabelG.attr('transform', l => {
            const s = l.source as GraphNode; const t = l.target as GraphNode;
            return `translate(${(s.x! + t.x!) / 2},${(s.y! + t.y!) / 2})`;
          });
        })
        .on('end', (event, d) => {
          // Snap to grid on drop
          d.fx = snapToGrid(event.x);
          d.fy = snapToGrid(event.y);
          d.x = d.fx;
          d.y = d.fy;
          node.filter(n => n.id === d.id).attr('transform', `translate(${d.fx},${d.fy})`);
          // Redraw edges with final snapped position
          linkLine
            .attr('x1', l => { const s = l.source as GraphNode; const t = l.target as GraphNode; return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).x1; })
            .attr('y1', l => { const s = l.source as GraphNode; const t = l.target as GraphNode; return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).y1; })
            .attr('x2', l => { const s = l.source as GraphNode; const t = l.target as GraphNode; return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).x2; })
            .attr('y2', l => { const s = l.source as GraphNode; const t = l.target as GraphNode; return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).y2; });
          linkLabelG.attr('transform', l => {
            const s = l.source as GraphNode; const t = l.target as GraphNode;
            return `translate(${(s.x! + t.x!) / 2},${(s.y! + t.y!) / 2})`;
          });
        }) as any)
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .on('dblclick', (event) => {
        event.stopPropagation();
      });

    // Card shadow rect (offset)
    node.append('rect')
      .attr('x', -cardW / 2 + 2).attr('y', -cardH / 2 + 3)
      .attr('width', cardW).attr('height', cardH)
      .attr('rx', 8)
      .attr('fill', '#000')
      .attr('opacity', 0.35);

    // Card body
    node.append('rect')
      .attr('x', -cardW / 2).attr('y', -cardH / 2)
      .attr('width', cardW).attr('height', cardH)
      .attr('rx', 8)
      .attr('fill', '#1e293b')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5);

    // Left accent
    node.append('rect')
      .attr('x', -cardW / 2).attr('y', -cardH / 2)
      .attr('width', 3).attr('height', cardH)
      .attr('rx', 2)
      .attr('fill', '#f97316');

    // Icon
    node.append('text')
      .attr('x', -cardW / 2 + 18).attr('y', 1)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', '15px').attr('pointer-events', 'none')
      .text('🏭');

    // Name
    node.append('text')
      .attr('x', -cardW / 2 + 34).attr('y', -8)
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#f1f5f9').attr('font-size', '12px').attr('font-weight', '600')
      .attr('font-family', 'system-ui, sans-serif').attr('pointer-events', 'none')
      .text(d => d.name.length > 15 ? d.name.slice(0, 15) + '…' : d.name);

    // Subtitle
    node.append('text')
      .attr('x', -cardW / 2 + 34).attr('y', 9)
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#475569').attr('font-size', '10px')
      .attr('font-family', 'system-ui, sans-serif').attr('pointer-events', 'none')
      .text('Factory');

    // ── Tick ──────────────────────────────────────────────────────────────
    simulation.on('tick', () => {
      // Compute edge endpoints stopping at card edge, not center
      linkLine
        .attr('x1', d => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).x1;
        })
        .attr('y1', d => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).y1;
        })
        .attr('x2', d => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).x2;
        })
        .attr('y2', d => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return edgePoint(s.x!, s.y!, t.x!, t.y!, cardW, cardH).y2;
        });

      linkLabelG.attr('transform', d => {
        const s = d.source as GraphNode;
        const t = d.target as GraphNode;
        return `translate(${(s.x! + t.x!) / 2},${(s.y! + t.y!) / 2})`;
      });

      // Size label bg after text renders
      linkLabelG.each(function () {
        const g = d3.select(this as SVGGElement);
        const textEl = g.select<SVGTextElement>('.link-text').node();
        if (textEl) {
          const bb = textEl.getBBox();
          g.select('rect')
            .attr('x', bb.x - 5).attr('y', bb.y - 3)
            .attr('width', bb.width + 10).attr('height', bb.height + 6);
        }
      });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [graphData]);

  useEffect(() => { loadGraphData(); }, [factories]);

  // ── Helpers ───────────────────────────────────────────────────────────
  function edgePoint(x1: number, y1: number, x2: number, y2: number, w: number, h: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const hw = w / 2 + 4;
    const hh = h / 2 + 4;
    // Clip on source card edge
    const tSrc = Math.min(Math.abs(hw / (dx || 0.001)), Math.abs(hh / (dy || 0.001)));
    const sx = x1 + (dx / len) * Math.min(len * tSrc, hw);
    const sy = y1 + (dy / len) * Math.min(len * tSrc, hh);
    // Clip on target card edge (come in from target side)
    const tTgt = Math.min(Math.abs(hw / (dx || 0.001)), Math.abs(hh / (dy || 0.001)));
    const tx = x2 - (dx / len) * Math.min(len * tTgt, hw + 14); // extra for arrowhead
    const ty = y2 - (dy / len) * Math.min(len * tTgt, hh + 14);
    return { x1: sx, y1: sy, x2: tx, y2: ty };
  }

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current)
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.4);
  };
  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current)
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1 / 1.4);
  };
  const handleResetView = () => {
    if (svgRef.current && zoomRef.current)
      d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div className="relative w-full h-full bg-slate-950">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button variant="outline" size="sm" onClick={loadGraphData} disabled={loading}
          className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomIn}
          className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}
          className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleResetView}
          className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900 border border-slate-700 rounded-lg p-4 text-xs">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 font-medium">Controls</span>
        </div>
        <div className="space-y-1.5 text-slate-400">
          <p>Drag → move &amp; snap to grid</p>
          <p>Scroll → zoom</p>
          <p>Pan → drag background</p>
        </div>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900 border border-slate-700 rounded-lg p-4 min-w-48">
          <p className="text-sm font-semibold text-white mb-1">{selectedNode.name}</p>
          <p className="text-xs text-slate-400 mb-3">Factory</p>
          <Button variant="outline" size="sm" onClick={() => setSelectedNode(null)}
            className="w-full bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200">
            Close
          </Button>
        </div>
      )}

      {/* SVG */}
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={() => setSelectedNode(null)}>
        <g className="graph-container" />
      </svg>

      {/* Empty state */}
      {graphData.nodes.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-slate-500">
            <p className="text-base font-medium mb-1">No connections found</p>
            <p className="text-sm">Add imports between factories to see the graph</p>
          </div>
        </div>
      )}
    </div>
  );
}
