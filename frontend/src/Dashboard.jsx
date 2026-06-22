import { useState, useCallback } from 'react';
import { Activity, ShieldAlert, Map, RefreshCw, Play } from 'lucide-react';
import UploadPanel from './components/UploadPanel';
import { analyzeGraph } from './utils/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [graph, setGraph] = useState(null);

  const runResilienceAnalysis = useCallback(async () => {
    if (!graph) return;
    setLoading(true);
    try {
      const result = await analyzeGraph(graph);
      if (result) {
        setAnalysisData(result.data || result.metrics);
      }
    } catch (error) {
      console.error("Failed to communicate with mathematical backend:", error);
    }
    setLoading(false);
  }, [graph]);

  async function handleGraphLoaded(graphData) {
    setGraph(graphData);
    setAnalysisData(null);
    setLoading(true);
    try {
      const result = await analyzeGraph(graphData);
      if (result) {
        setAnalysisData(result.data || result.metrics);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    }
    setLoading(false);
  }

  function getCriticalityColor(score) {
    if (score < 0.3) return '#1D9E75';
    if (score < 0.6) return '#BA7517';
    return '#E24B4A';
  }

  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex justify-between items-center backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-wider text-emerald-400">TERRAGRAPH OS</h1>
        </div>
        <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
          Domain: Track 2 - Route Resilience
        </span>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 p-6 gap-6">
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur">
            <UploadPanel onGraphLoaded={handleGraphLoaded} />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" /> System Controls
            </h2>
            <button
              onClick={runResilienceAnalysis}
              disabled={loading || !graph}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              {loading ? "Calculating Matrix..." : "Execute Criticality Engine"}
            </button>
          </div>

          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur flex flex-col">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" /> Criticality Insights
            </h2>

            {analysisData ? (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1 text-sm">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-500 mb-1">Network Density Score</div>
                  <div className="text-xl font-mono text-emerald-400">
                    {(analysisData.network_density * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-500 mb-1">Nodes</div>
                  <div className="text-xl font-mono text-emerald-400">{nodes.length}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-500 mb-1">Edges</div>
                  <div className="text-xl font-mono text-emerald-400">{edges.length}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-amber-900/50">
                  <div className="text-xs text-amber-500 mb-1">Single Points of Failure (Articulation Nodes)</div>
                  <div className="text-sm font-mono text-amber-300">
                    {analysisData.single_points_of_failure?.length > 0
                      ? analysisData.single_points_of_failure.join(", ")
                      : "None Detected"}
                  </div>
                </div>
              </div>
            ) : graph ? (
              <div className="flex-1 flex items-center justify-center text-slate-600 text-center px-4">
                <p>Graph loaded. Click Execute to run analysis.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center px-4">
                <p>Awaiting ingestion telemetry matrix.</p>
                <p className="text-xs mt-1">Drop a satellite image or JSON file to begin.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden relative flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-md border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Map className="h-3 w-3 text-emerald-400" /> Vector Mesh Canvas View
          </div>

          <div className="flex-1 bg-slate-950 flex items-center justify-center relative">
            {nodes.length === 0 ? (
              <div className="text-slate-700 text-center px-8">
                <Map className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No graph data</p>
                <p className="text-xs mt-1">Upload a satellite image or JSON to visualize the road network</p>
              </div>
            ) : (
              <svg className="w-full h-full min-h-[400px]" style={{ maxWidth: '800px', maxHeight: '600px' }} viewBox="0 0 800 600">
                {edges.map((edge, i) => {
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  const targetNode = nodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;
                  const opacity = edge.guessed ? Math.max(0.15, edge.confidence) : 1.0;
                  const strokeColor = edge.guessed ? '#378ADD' : '#334155';
                  const dashPattern = edge.guessed ? '6,4' : '';
                  return (
                    <line
                      key={`e${i}`}
                      x1={sourceNode.x} y1={sourceNode.y}
                      x2={targetNode.x} y2={targetNode.y}
                      stroke={strokeColor}
                      strokeWidth={edge.guessed ? 1.5 : 1.5}
                      strokeOpacity={opacity}
                      strokeDasharray={dashPattern}
                    />
                  );
                })}

                {nodes.map((node) => {
                  let fillColor = '#1D9E75';
                  let strokeColor = 'none';
                  let r = 7;
                  if (analysisData?.node_scores?.[node.id]) {
                    const score = analysisData.node_scores[node.id];
                    fillColor = getCriticalityColor(score.criticality);
                    if (score.is_articulation) {
                      strokeColor = '#ffffff';
                      r = 10;
                    }
                  }
                  return (
                    <g key={node.id}>
                      <circle
                        cx={node.x} cy={node.y}
                        r={r}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={strokeColor !== 'none' ? 3 : 0}
                      />
                      <text x={node.x + 10} y={node.y + 4} className="fill-slate-500 text-[10px] font-mono">
                        {node.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
