# 🌍 TerraGraph OS
**Bhartiya Antariksh Hackathon 2026 — Track 2: Route Resilience & Criticality Analysis**

TerraGraph OS is a full-stack geospatial analytics pipeline that transforms raw satellite imagery into mathematical graph networks to identify critical infrastructure chokepoints and single points of failure.

---

## Onboarding & Local Setup

Ensure you have **Python 3.x** and **Node.js** installed on your machine before beginning.

### 1. Mathematical Engine (Backend Setup)
*The backend runs the FastAPI server and NetworkX graph algorithms.*

Open a terminal, navigate to the project root, and initialize the environment:

**For Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
# If that fails, try: py -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

**For Mac/Linux:**

```Bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
The backend is now live at http://127.0.0.1:8000.

#⚠️ Critical Note: You must run the activate command every time you open a new terminal to work on the backend.

