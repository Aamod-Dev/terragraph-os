from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import networkx as nx
import numpy as np
import json
import os
import subprocess
import tempfile

app = FastAPI(title="TerraGraph OS Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Node(BaseModel):
    id: str
    x: int
    y: int

class Edge(BaseModel):
    source: str
    target: str
    weight: float = 1.0
    guessed: bool = False
    confidence: float = 1.0

class GraphData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

@app.get("/")
def read_root():
    return {"status": "ok"}

@app.post("/api/analyze-resilience")
async def analyze_resilience(data: GraphData):
    try:
        G = nx.Graph()
        for node in data.nodes:
            G.add_node(node.id, x=node.x, y=node.y)
        for edge in data.edges:
            if not edge.guessed:
                G.add_edge(edge.source, edge.target, weight=edge.weight)

        if G.number_of_nodes() == 0:
            return {
                "metrics": {"node_scores": {}, "network": {}},
                "node_count": 0,
                "edge_count": 0
            }

        betweenness = nx.betweenness_centrality(G)
        degree = nx.degree_centrality(G)
        closeness = nx.closeness_centrality(G)
        articulation = list(nx.articulation_points(G))

        node_scores = {}
        for node_id in G.nodes():
            b = betweenness.get(node_id, 0.0)
            d = degree.get(node_id, 0.0)
            c = closeness.get(node_id, 0.0)
            is_art = node_id in articulation
            criticality = (b * 0.5) + (d * 0.2) + (c * 0.2) + (0.1 if is_art else 0.0)
            node_scores[node_id] = {
                "betweenness": round(b, 4),
                "degree": round(d, 4),
                "closeness": round(c, 4),
                "criticality": round(criticality, 4),
                "is_articulation": is_art
            }

        components = list(nx.connected_components(G))
        largest = max(components, key=len) if components else set()
        num_components = len(components)
        total_nodes = G.number_of_nodes()

        try:
            avg_path = nx.average_shortest_path_length(G)
        except nx.NetworkXError:
            avg_path = 0.0

        network = {
            "density": round(nx.density(G), 4),
            "num_components": num_components,
            "largest_component_size": len(largest),
            "largest_component_ratio": round(len(largest) / total_nodes, 4) if total_nodes > 0 else 0.0,
            "avg_path_length": round(avg_path, 4),
            "articulation_count": len(articulation)
        }

        return {
            "metrics": {"node_scores": node_scores, "network": network},
            "node_count": total_nodes,
            "edge_count": G.number_of_edges()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-mask")
async def upload_mask(file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(file.filename)[1] or ".png"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_in:
            content = await file.read()
            tmp_in.write(content)
            tmp_in_path = tmp_in.name

        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp_out:
            tmp_out_path = tmp_out.name

        notebook_path = os.path.join(os.path.dirname(__file__), "..", "..", "colab", "pipeline.ipynb")
        notebook_path = os.path.abspath(notebook_path)

        if not os.path.exists(notebook_path):
            raise HTTPException(status_code=500, detail="Pipeline notebook not found")

        script_path = tmp_out_path.replace(".json", "_script.py")
        convert = subprocess.run(
            ["jupyter", "nbconvert", "--to", "script", notebook_path, "--output", script_path.replace(".py", "")],
            capture_output=True, text=True, timeout=30
        )
        if convert.returncode != 0:
            raise HTTPException(status_code=500, detail=f"nbconvert error: {convert.stderr}")

        result = subprocess.run(
            ["python", script_path, "--image", tmp_in_path, "--output", tmp_out_path, "--grid", "15"],
            capture_output=True, text=True, timeout=120
        )

        if os.path.exists(script_path):
            os.unlink(script_path)

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Pipeline error: {result.stderr}")

        with open(tmp_out_path, "r") as f:
            graph_json = json.load(f)

        os.unlink(tmp_in_path)
        os.unlink(tmp_out_path)

        return graph_json

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Pipeline timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
