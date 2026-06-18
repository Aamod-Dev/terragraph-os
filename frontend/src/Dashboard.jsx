import React, { useState } from 'react';
import { Activity, ShieldAlert, Map, RefreshCw, Play } from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  // Mock Map Data (Nodes = Intersections, Edges = Roads)
  const mockGraph = {
    nodes: [
      { id: "INT_01", lat: 100, lng: 150, name: "Main St & 5th Ave" },
      { id: "INT_02", lat: 250, lng: 150, name: "HQ Core Intersection" },
      { id: "INT_03", lat: 175, lng: 300, name: "Transit Hub Node" },
      { id: "INT_04", lat: 350, lng: 300, name: "Eastern Bypass Link" }
    ],
    edges: [
      { id: "ROAD_A", source: "INT_01", target: "INT_02" },
      { id: "ROAD_B", source: "INT_02", target: "INT_03" },
      { id: "ROAD_C", source: "INT_01", target: "INT_03" },
      { id: "ROAD_D", source: "INT_03", target: "INT_04" }
    ]
  };

  const runResilienceAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/analyze-resilience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockGraph)
      });
      const result = await response.json();
      if (result.status === 'success') {
        setAnalysisData(result.data);
      }
    } catch (error) {
      console.error("Failed to communicate with mathematical backend:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex justify-between items-center backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-wider text-emerald-400">TERRAGRAPH OS</h1>
        </div>
        <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
          Domain: Track 2 - Route Resilience
        </span>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 p-6 gap-6">
        {/* Left Control & Metrics Panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" /> System Controls
            </h2>
            <button
              onClick={runResilienceAnalysis}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition dynamic-shadow flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              {loading ? "Calculating Matrix..." : "Execute Criticality Engine"}
            </button>
          </div>

          {/* Real-time Math Analysis Feed */}
          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur flex flex-col">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" /> Criticality Insights
            </h2>
            
            {analysisData ? (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1 text-sm">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-500 mb-1">Network Density Score</div>
                  <div className="text-xl font-mono text-emerald-400">{(analysisData.network_density * 100).toFixed(1)}%</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-amber-900/50">
                  <div className="text-xs text-amber-500 mb-1">Single Points of Failure (Articulation Nodes)</div>
                  <div className="text-sm font-mono text-amber-300">
                    {analysisData.single_points_of_failure.length > 0 
                      ? analysisData.single_points_of_failure.join(", ") 
                      : "None Detected"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center px-4">
                <p>Awaiting ingestion telemetry matrix.</p>
                <p className="text-xs mt-1">Click the button above to run Tarjan's and Centrality calculations.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Mapping Viewport Layer */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden relative flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-md border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Map className="h-3 w-3 text-emerald-400" /> Vector Mesh Canvas View
          </div>
          
          {/* Spatial Canvas Container */}
          <div className="flex-1 bg-slate-950 flex items-center justify-center relative">
            <svg className="w-full h-full min-h-[400px]" style={{ maxWidth: '500px', maxHeight: '400px' }}>
              {/* Drawing Edges (Roads) */}
              {mockGraph.edges.map((edge) => {
                const sourceNode = mockGraph.nodes.find(n => n.id === edge.source);
                const targetNode = mockGraph.nodes.find(n => n.id === edge.target);
                return (
                  <line
                    key={edge.id}
                    x1={sourceNode.lng}
                    y1={sourceNode.lat}
                    x2={targetNode.lng}
                    y2={targetNode.lat}
                    stroke="#334155"
                    strokeWidth="3"
                  />
                );
              })}

              {/* Drawing Nodes (Intersections) */}
              {mockGraph.nodes.map((node) => {
                const isCritical = analysisData?.single_points_of_failure.includes(node.id);
                return (
                  <g key={node.id}>
                    <circle
                      cx={node.lng}
                      cy={node.lat}
                      r={isCritical ? "10" : "7"}
                      className={isCritical ? "fill-red-500 animate-pulse" : "fill-emerald-400"}
                    />
                    <text x={node.lng + 12} y={node.lat + 4} className="fill-slate-500 text-[10px] font-mono">
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}