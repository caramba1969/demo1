'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RefreshCw, ZoomIn, ZoomOut, Home, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Factory {
  id: string;
  name: string;
}

interface ProductionLine {
  _id: string;
  itemClassName: string;
  targetQuantityPerMinute: number;
  item?: {
    name: string;
  };
}

interface Import {
  _id: string;
  sourceFactoryId: {
    _id: string;
    name: string;
  };
  itemClassName: string;
  requiredAmount: number;
  item?: {
    name: string;
  };
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
  itemClassName: string;
}

interface FactoryDependencyGraphProps {
  factories: Factory[];
}

export default function FactoryDependencyGraph({ factories }: FactoryDependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  // Load factory data and build graph
  const loadGraphData = async () => {
    if (factories.length === 0) return;
    
    setLoading(true);
    try {
      const nodes: GraphNode[] = factories.map(factory => ({
        id: factory.id,
        name: factory.name,
        type: 'factory' as const
      }));

      const links: GraphLink[] = [];

      // Load imports for each factory to build connections
      for (const factory of factories) {
        try {
          const importsResponse = await fetch(`/api/factories/${factory.id}/imports`);
          if (importsResponse.ok) {
            const importsData = await importsResponse.json();
            const imports: Import[] = importsData.imports || [];

            imports.forEach(importItem => {
              const sourceFactory = importItem.sourceFactoryId;
              if (sourceFactory && sourceFactory._id) {
                links.push({
                  source: sourceFactory._id,
                  target: factory.id,
                  itemName: importItem.item?.name || importItem.itemClassName,
                  amount: importItem.requiredAmount,
                  itemClassName: importItem.itemClassName
                });
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to load imports for factory ${factory.id}:`, error);
        }
      }

      setGraphData({ nodes, links });
    } catch (error) {
      console.error('Error loading graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize and update D3 visualization
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const container = svg.select('.graph-container');
    
    // Clear previous content
    container.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);    // Create simulation
    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links)
        .id((d: GraphNode) => d.id)
        .distance(200)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(80));

    simulationRef.current = simulation;

    // Create arrow markers for directed edges
    svg.select('defs').remove();
    const defs = svg.append('defs');
    
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#64748b')
      .style('stroke', 'none');

    // Create links
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll('g')
      .data(graphData.links)
      .join('g')
      .attr('class', 'link-group');    // Link lines
    link.append('line')
      .attr('class', 'link')
      .attr('stroke', '#64748b')
      .attr('stroke-width', (d: GraphLink) => Math.max(1, Math.min(8, d.amount / 20)))
      .attr('stroke-dasharray', '5,5')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('opacity', 0.6);

    // Link labels
    const linkLabels = link.append('g')
      .attr('class', 'link-label');
    
    linkLabels.append('rect')
      .attr('class', 'link-label-bg')
      .attr('fill', '#1e293b')
      .attr('stroke', '#475569')
      .attr('stroke-width', 1)
      .attr('rx', 4);
      linkLabels.append('text')
      .attr('class', 'link-label-text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d: GraphLink) => `${d.itemName}: ${d.amount.toFixed(1)}/min`);    // Position link label backgrounds
    linkLabels.selectAll('.link-label-bg')
      .each(function(this: SVGRectElement) {
        const parentNode = this.parentNode as SVGGElement;
        const textElement = d3.select(parentNode).select('.link-label-text').node() as SVGTextElement;
        if (textElement) {
          const bbox = textElement.getBBox();
          d3.select(this)
            .attr('x', bbox.x - 4)
            .attr('y', bbox.y - 2)
            .attr('width', bbox.width + 8)
            .attr('height', bbox.height + 4);
        }
      });    // Create nodes
    const node = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event: MouseEvent, d: GraphNode) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // Node circles
    node.append('circle')
      .attr('r', 30)
      .attr('fill', '#f97316')
      .attr('stroke', '#ea580c')
      .attr('stroke-width', 3);    // Node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d: GraphNode) => d.name.length > 10 ? d.name.slice(0, 10) + '...' : d.name);    // Update positions on simulation tick
    simulation.on('tick', () => {
      link.select('line')
        .attr('x1', (d: GraphLink) => (d.source as GraphNode).x!)
        .attr('y1', (d: GraphLink) => (d.source as GraphNode).y!)
        .attr('x2', (d: GraphLink) => (d.target as GraphNode).x!)
        .attr('y2', (d: GraphLink) => (d.target as GraphNode).y!);

      linkLabels
        .attr('transform', (d: GraphLink) => {
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;
          const x = (source.x! + target.x!) / 2;
          const y = (source.y! + target.y!) / 2;
          return `translate(${x}, ${y})`;
        });

      node.attr('transform', (d: GraphNode) => `translate(${d.x}, ${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }    // Initial zoom to fit
    const bounds = (container.node() as SVGGElement)?.getBBox();
    if (bounds) {
      const fullWidth = width;
      const fullHeight = height;
      const widthScale = fullWidth / bounds.width;
      const heightScale = fullHeight / bounds.height;
      const scale = Math.min(widthScale, heightScale) * 0.8;
      const translateX = (fullWidth - bounds.width * scale) / 2 - bounds.x * scale;
      const translateY = (fullHeight - bounds.height * scale) / 2 - bounds.y * scale;
      
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
    }

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  // Load data when factories change
  useEffect(() => {
    loadGraphData();
  }, [factories]);

  const handleZoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1 / 1.5
      );
    }
  };
  const handleResetView = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const container = svg.select('.graph-container');
      const bounds = (container.node() as SVGGElement)?.getBBox();
      
      if (bounds) {
        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;
        const widthScale = width / bounds.width;
        const heightScale = height / bounds.height;
        const scale = Math.min(widthScale, heightScale) * 0.8;
        const translateX = (width - bounds.width * scale) / 2 - bounds.x * scale;
        const translateY = (height - bounds.height * scale) / 2 - bounds.y * scale;
        
        svg.transition().duration(750).call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={loadGraphData}
          disabled={loading}
          className="bg-slate-800 border-slate-600 hover:bg-slate-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          className="bg-slate-800 border-slate-600 hover:bg-slate-700"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          className="bg-slate-800 border-slate-600 hover:bg-slate-700"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetView}
          className="bg-slate-800 border-slate-600 hover:bg-slate-700"
        >
          <Home className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-slate-800 border border-slate-600 rounded-lg p-4 max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Legend</h3>
        </div>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span>Factory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0 border-t-2 border-dashed border-slate-400"></div>
            <span>Import/Export Flow</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            • Drag nodes to reposition<br/>
            • Click nodes for details<br/>
            • Line thickness = flow amount
          </div>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-slate-800 border border-slate-600 rounded-lg p-4 max-w-sm">
          <h3 className="text-sm font-semibold text-white mb-2">{selectedNode.name}</h3>
          <div className="text-xs text-slate-300">
            <p>Factory ID: {selectedNode.id}</p>
            <p>Type: {selectedNode.type}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedNode(null)}
            className="mt-2 bg-slate-700 border-slate-600 hover:bg-slate-600"
          >
            Close
          </Button>
        </div>
      )}

      {/* SVG Container */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={() => setSelectedNode(null)}
      >
        <g className="graph-container"></g>
      </svg>

      {/* Empty State */}
      {graphData.nodes.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="w-16 h-16 mx-auto mb-4 opacity-50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
                <path d="m21 12-6-3 6-3"/>
                <path d="m3 12 6 3-6 3"/>
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">No connections found</p>
            <p className="text-sm">
              Create some imports between factories to see their relationships
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
