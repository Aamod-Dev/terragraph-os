from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import networkx as nx

app = FastAPI(title="TerraGraph OS Engine")

# Allow your React frontend to communicate with this backend securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data structures defining what a map looks like to our system
class Node(BaseModel):
    id: str
    lat: float
    lng: float

class Edge(BaseModel):
    id: str
    source: str
    target: str
    weight: float = 1.0  # Represents road length or travel time

class GraphData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

@app.post("/api/analyze-resilience")
async def analyze_resilience(data: GraphData):
    try:
        # 1. Initialize an empty NetworkX Graph state
        G = nx.Graph()
        
        # 2. Reconstruct the physical map into a pure mathematical state
        for node in data.nodes:
            G.add_node(node.id, lat=node.lat, lng=node.lng)
            
        for edge in data.edges:
            G.add_edge(edge.source, edge.target, weight=edge.weight, id=edge.id)
            
        # 3. Algorithm A: Calculate Betweenness Centrality (Chokepoint Detection)
        # Higher score means a road/intersection handles a higher share of city traffic
        centrality = nx.betweenness_centrality(G)
        
        # 4. Algorithm B: Identify Articulation Points (Tarjan's Bridge Logic)
        # Intersections whose destruction splits the city into isolated fragments
        critical_nodes = list(nx.articulation_points(G))
        
        # 5. Format the mathematical findings to send back to the frontend UI
        analysis_result = {
            "chokepoints": [
                {"node_id": node_id, "vulnerability_score": float(score)}
                for node_id, score in centrality.items()
            ],
            "single_points_of_failure": critical_nodes,
            "network_density": float(nx.density(G))
        }
        
        return {"status": "success", "data": analysis_result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "TerraGraph OS mathematical backend is operational."}