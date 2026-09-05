"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Users,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Info,
  X,
  AlertCircle
} from "lucide-react";
import { loadCharacterProfiles, CharacterProfile, getAvatarColor, getInitials } from "@/lib/ai/characterAI";

// ============================================
// TYPES
// ============================================

type Node = {
  id: string; // The character name (since it's unique in a project)
  profile: CharacterProfile;
  x: number;
  y: number;
  radius: number;
};

type Edge = {
  source: string; // name
  target: string; // name
  label: string;
};

// ============================================
// CONFIG
// ============================================

const ROLE_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  protagonist: { bg: "#4f46e5", border: "#818cf8", glow: "rgba(79, 70, 229, 0.4)" }, // Indigo
  antagonist: { bg: "#e11d48", border: "#fb7185", glow: "rgba(225, 29, 72, 0.4)" }, // Rose
  supporting: { bg: "#0d9488", border: "#2dd4bf", glow: "rgba(13, 148, 136, 0.4)" }, // Teal
  minor: { bg: "#475569", border: "#94a3b8", glow: "rgba(71, 85, 105, 0.4)" }, // Slate
};

const DEFAULT_ROLE_COLOR = { bg: "#475569", border: "#94a3b8", glow: "rgba(71, 85, 105, 0.4)" };

// ============================================
// COMPONENT
// ============================================

export default function RelationshipMapPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<CharacterProfile[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Canvas State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Drag Node State
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const nodeStartRef = useRef({ x: 0, y: 0 });

  // Interaction State
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ============================================
  // LOAD DATA
  // ============================================
  useEffect(() => {
    async function load() {
      try {
        const data = await loadCharacterProfiles(projectId);
        setProfiles(data);

        // Build Nodes (Circle Layout)
        const radius = Math.max(300, data.length * 40); // Dynamic radius based on count
        const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : 600;
        const centerY = typeof window !== "undefined" ? window.innerHeight / 2 : 400;

        const newNodes: Node[] = data.map((profile, i) => {
          const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2; // Start at top
          return {
            id: profile.name,
            profile,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            radius: profile.role === "protagonist" || profile.role === "antagonist" ? 40 : 30,
          };
        });

        // Build Edges
        const newEdges: Edge[] = [];
        const existingNames = new Set(data.map((p) => p.name.toLowerCase()));

        data.forEach((p) => {
          if (!p.relationships) return;
          p.relationships.forEach((rel) => {
            const targetName = rel.character_name.trim();
            // Only add edge if target exists
            if (existingNames.has(targetName.toLowerCase())) {
              // Check if reverse edge already exists to avoid drawing twice if they both reference each other
              const exists = newEdges.find(
                (e) =>
                  (e.source.toLowerCase() === p.name.toLowerCase() && e.target.toLowerCase() === targetName.toLowerCase()) ||
                  (e.target.toLowerCase() === p.name.toLowerCase() && e.source.toLowerCase() === targetName.toLowerCase())
              );
              
              if (!exists) {
                // Find precise target name case from the existing set
                const realTargetName = data.find((d) => d.name.toLowerCase() === targetName.toLowerCase())?.name || targetName;
                newEdges.push({
                  source: p.name,
                  target: realTargetName,
                  label: rel.relationship,
                });
              } else if (exists.source === p.name) {
                // If it exists but we just want to update the label (maybe append)
                // Not doing this for now to keep it clean
              }
            }
          });
        });

        setNodes(newNodes);
        setEdges(newEdges);
        
        // Center the canvas
        if (typeof window !== "undefined") {
           setPan({ x: 0, y: -50 }); // slight vertical offset for header
        }

      } catch (err) {
        console.error("Error loading graph:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  // ============================================
  // DRAG & PAN LOGIC
  // ============================================
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).tagName === 'circle' || (e.target as Element).closest('g.node-group')) {
      // Node drag handled in the node's pointer down
      return;
    }
    
    // Start pan
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingNode) {
      // Drag node
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;
      
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNode
            ? { ...n, x: nodeStartRef.current.x + dx, y: nodeStartRef.current.y + dy }
            : n
        )
      );
    } else if (isPanning) {
      // Pan canvas
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
  };

  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNode(nodeId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      nodeStartRef.current = { x: node.x, y: node.y };
    }
    setSelectedNode(nodeId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.001;
      setZoom((prev) => Math.min(Math.max(0.2, prev + zoomFactor), 3));
    }
  };

  // ============================================
  // EXPORT SVG TO PNG
  // ============================================
  const exportToPNG = () => {
    if (!svgRef.current) return;
    
    // We need to clone the SVG to remove transform/zoom temporarily for a clean export
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    const gElement = svgClone.querySelector('g#canvas-group');
    if (gElement) {
       // Reset transform on clone
       gElement.setAttribute('transform', 'translate(0,0) scale(1)');
    }
    
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x - 100);
      minY = Math.min(minY, n.y - 100);
      maxX = Math.max(maxX, n.x + 100);
      maxY = Math.max(maxY, n.y + 100);
    });
    
    if (nodes.length === 0) {
      minX = 0; minY = 0; maxX = 800; maxY = 600;
    }
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    svgClone.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    svgClone.setAttribute('width', `${width}`);
    svgClone.setAttribute('height', `${height}`);
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    const img = new Image();
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#0f172a"; // slate-900
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
      }
      

      const a = document.createElement("a");
      a.download = "character-relationship-map.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // ============================================
  // RENDERING
  // ============================================

  const selectedProfile = useMemo(() => {
    return nodes.find(n => n.id === selectedNode)?.profile || null;
  }, [selectedNode, nodes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Users className="w-16 h-16 text-slate-700 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Characters Found</h2>
        <p className="text-gray-400 text-center max-w-md mb-6">
          You need to generate or add character profiles to your Story Wiki before you can see the relationship map.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/dashboard/${projectId}`)}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push(`/dashboard/${projectId}/characters`)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
          >
            Go to Characters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0B0F19] overflow-hidden flex flex-col relative select-none">
      
      {/* HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={() => router.push(`/dashboard/${projectId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="bg-black/40 backdrop-blur-md border border-white/10 px-5 py-2 rounded-xl">
            <h1 className="text-white font-bold text-lg">Relationship Map</h1>
            <p className="text-gray-400 text-xs">Drag nodes to rearrange</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-1.5 rounded-xl flex items-center gap-1">
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-300 font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => { setZoom(1); setPan({x:0, y:-50}); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white border-l border-white/10 ml-1" title="Reset View">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={exportToPNG}
            className="flex items-center justify-center gap-2 p-2.5 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 backdrop-blur-md rounded-xl text-indigo-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-semibold">Export PNG</span>
          </button>
        </div>
      </div>

      {/* LEGEND */}
      <div className="absolute bottom-6 left-6 z-40 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl pointer-events-auto">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Roles</h3>
        <div className="space-y-2">
          {Object.entries(ROLE_COLORS).map(([role, colors]) => (
            <div key={role} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.bg, boxShadow: `0 0 8px ${colors.glow}` }} />
              <span className="text-gray-300 text-sm capitalize">{role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG CANVAS */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          className="absolute inset-0"
        >
          {/* Defs for gradients/arrows */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" opacity="0.6" />
            </marker>
            <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#a78bfa" />
            </marker>
          </defs>

          <g id="canvas-group" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            
            {/* EDGES */}
            {edges.map((edge, i) => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              
              if (!sourceNode || !targetNode) return null;
              
              // Is this edge related to the hovered or selected node?
              const isRelated = 
                hoveredNode === edge.source || hoveredNode === edge.target || 
                selectedNode === edge.source || selectedNode === edge.target;
              
              const isHovered = hoveredEdge === i;
              const isActive = isRelated || isHovered;

              // Quadratic curve path
              const dx = targetNode.x - sourceNode.x;
              const dy = targetNode.y - sourceNode.y;
              const dr = Math.sqrt(dx * dx + dy * dy);
              // Calculate curved path string (arc)
              const pathStr = `M${sourceNode.x},${sourceNode.y} A${dr},${dr} 0 0,1 ${targetNode.x},${targetNode.y}`;

              // Calculate midpoint for label
              const midX = (sourceNode.x + targetNode.x) / 2 + (dy * 0.1); // Offset slightly for the curve
              const midY = (sourceNode.y + targetNode.y) / 2 - (dx * 0.1);
              
              return (
                <g 
                  key={i} 
                  onMouseEnter={() => setHoveredEdge(i)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  className="transition-opacity duration-300"
                  style={{ opacity: hoveredNode && !isRelated ? 0.1 : 1 }}
                >
                  {/* Invisible wide path for easier hover */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="20"
                    className="cursor-pointer"
                  />
                  
                  {/* Visible path */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={isActive ? "#a78bfa" : "#334155"}
                    strokeWidth={isActive ? 3 : 1.5}
                    markerEnd={isActive ? "url(#arrowhead-highlight)" : "url(#arrowhead)"}
                    className="transition-all duration-300 pointer-events-none"
                  />

                  {/* Label (Show if related, hovered, or globally zoomed in enough) */}
                  {(isActive || zoom > 1.2) && (
                    <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none">
                      <rect 
                        x="-40" y="-12" 
                        width="80" height="24" 
                        rx="12" 
                        fill="#1e293b" 
                        stroke={isActive ? "#8b5cf6" : "#475569"}
                      />
                      <text 
                        x="0" y="4" 
                        textAnchor="middle" 
                        fill={isActive ? "#fff" : "#94a3b8"} 
                        fontSize="10px" 
                        fontWeight="600"
                      >
                        {edge.label.length > 12 ? edge.label.substring(0, 10) + ".." : edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* NODES */}
            {nodes.map((node) => {
              const colors = ROLE_COLORS[node.profile.role.toLowerCase()] || DEFAULT_ROLE_COLOR;
              const isSelected = selectedNode === node.id;
              const isHovered = hoveredNode === node.id;
              
              // Determine opacity: if a node is hovered, dim non-related nodes
              let opacity = 1;
              if (hoveredNode && hoveredNode !== node.id) {
                // Check if related
                const related = edges.some(e => 
                  (e.source === hoveredNode && e.target === node.id) || 
                  (e.target === hoveredNode && e.source === node.id)
                );
                if (!related) opacity = 0.2;
              } else if (selectedNode && selectedNode !== node.id && !hoveredNode) {
                 const related = edges.some(e => 
                  (e.source === selectedNode && e.target === node.id) || 
                  (e.target === selectedNode && e.source === node.id)
                );
                if (!related) opacity = 0.4;
              }

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
                  onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="node-group cursor-grab active:cursor-grabbing transition-opacity duration-300"
                  style={{ opacity }}
                >
                  {/* Glow circle */}
                  <circle 
                    r={node.radius + (isHovered || isSelected ? 8 : 4)} 
                    fill="transparent" 
                    stroke={colors.glow} 
                    strokeWidth={isHovered || isSelected ? 8 : 4}
                    className="transition-all duration-300"
                  />
                  
                  {/* Main Circle */}
                  <circle 
                    r={node.radius} 
                    fill="#0f172a" 
                    stroke={isSelected ? "#fff" : colors.border} 
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-300"
                  />
                  
                  {/* Avatar / Initials */}
                  {node.profile.portrait_url ? (
                    <g clipPath={`url(#clip-${node.id})`}>
                      <clipPath id={`clip-${node.id}`}>
                        <circle r={node.radius - 2} />
                      </clipPath>
                      <image 
                        href={node.profile.portrait_url} 
                        x={-(node.radius - 2)} 
                        y={-(node.radius - 2)} 
                        width={(node.radius - 2) * 2} 
                        height={(node.radius - 2) * 2}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </g>
                  ) : (
                    <text 
                      textAnchor="middle" 
                      y="5" 
                      fill="#fff" 
                      fontSize={node.radius * 0.7} 
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {getInitials(node.profile.name)}
                    </text>
                  )}

                  {/* Name Label */}
                  <g transform={`translate(0, ${node.radius + 15})`} className="pointer-events-none">
                    {/* Background pill for text legibility */}
                    <rect 
                      x={-node.profile.name.length * 4 - 8} 
                      y="-12" 
                      width={node.profile.name.length * 8 + 16} 
                      height="22" 
                      rx="11" 
                      fill="rgba(0,0,0,0.6)" 
                    />
                    <text 
                      textAnchor="middle" 
                      fill={isHovered || isSelected ? "#fff" : "#cbd5e1"} 
                      fontSize="12px" 
                      fontWeight="600"
                    >
                      {node.profile.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* SIDE PANEL */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Panel Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{selectedProfile.name}</h2>
                <span 
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide inline-block"
                  style={{ 
                    backgroundColor: ROLE_COLORS[selectedProfile.role.toLowerCase()]?.glow || DEFAULT_ROLE_COLOR.glow,
                    color: ROLE_COLORS[selectedProfile.role.toLowerCase()]?.border || DEFAULT_ROLE_COLOR.border,
                    border: `1px solid ${ROLE_COLORS[selectedProfile.role.toLowerCase()]?.border || DEFAULT_ROLE_COLOR.border}`
                  }}
                >
                  {selectedProfile.role}
                </span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Scroll Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {selectedProfile.portrait_url && (
                <div className="w-full aspect-square rounded-2xl overflow-hidden border border-white/10">
                  <img src={selectedProfile.portrait_url} alt={selectedProfile.name} className="w-full h-full object-cover" />
                </div>
              )}

              {selectedProfile.personality && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Personality</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedProfile.personality}</p>
                </div>
              )}

              {selectedProfile.desire && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Core Desire</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedProfile.desire}</p>
                </div>
              )}

              {selectedProfile.internal_flaw && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Internal Flaw</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedProfile.internal_flaw}</p>
                </div>
              )}

              {/* Direct Relationships List */}
              {selectedProfile.relationships && selectedProfile.relationships.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Connections
                  </h3>
                  <div className="space-y-2">
                    {selectedProfile.relationships.map((rel, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-3 text-sm">
                        <span className="font-semibold text-white block mb-0.5">{rel.character_name}</span>
                        <span className="text-gray-400 text-xs">{rel.relationship}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20">
               <button 
                onClick={() => router.push(`/dashboard/${projectId}/characters`)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors text-sm"
               >
                 View Full Profile
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
