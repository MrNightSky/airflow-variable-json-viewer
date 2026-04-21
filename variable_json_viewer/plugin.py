from __future__ import annotations

import os
import json
from typing import List, Optional

from airflow.configuration import conf
from airflow.models.variable import Variable
from airflow.plugins_manager import AirflowPlugin
from airflow.utils.session import create_session
from fastapi import FastAPI, HTTPException
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ----------------------------
# Plugin FastAPI application
# ----------------------------

app = FastAPI(title="Variable JSON Viewer")

# Allow all hosts (ok for dev/standalone)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Path to the package directory and static files
PLUGIN_BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.path.join(PLUGIN_BASE_DIR, "static")

# Mount static files (CSS, JS)
# Note: URL prefix /static will be available inside /variable-json/
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ---------
# Models
# ---------

class VariableDTO(BaseModel):
    key: str
    description: Optional[str] = None
    value: Optional[str] = None
    is_encrypted: Optional[bool] = None


class VariableUpdateDTO(BaseModel):
    description: Optional[str] = None
    value: str


# ------------------------
# Python API endpoints
# ------------------------

@app.get("/api/variables", response_model=List[VariableDTO])
def list_variables() -> List[VariableDTO]:
    """Returns a list of all variables."""
    with create_session() as session:
        rows = session.query(Variable).order_by(Variable.key).all()
        return [
            VariableDTO(
                key=row.key,
                description=getattr(row, "description", None),
                value=row.val,
                is_encrypted=getattr(row, "is_encrypted", False),
            )
            for row in rows
        ]


@app.get("/api/variables/{var_key}", response_model=VariableDTO)
def get_variable(var_key: str) -> VariableDTO:
    """Returns a single variable by key."""
    with create_session() as session:
        row = (
            session.query(Variable)
            .filter(Variable.key == var_key)
            .one_or_none()
        )
        if row is None:
            raise HTTPException(status_code=404, detail="Variable not found")
        return VariableDTO(
            key=row.key,
            description=getattr(row, "description", None),
            value=row.val,
            is_encrypted=getattr(row, "is_encrypted", False),
        )


@app.patch("/api/variables/{var_key}", response_model=VariableDTO)
def update_variable(var_key: str, payload: VariableUpdateDTO) -> VariableDTO:
    """Updates the value/description of a variable (creates it if it doesn't exist)."""
    Variable.set(
        var_key,
        payload.value,
        description=payload.description,
        serialize_json=False,
    )
    with create_session() as session:
        row = (
            session.query(Variable)
            .filter(Variable.key == var_key)
            .one()
        )
        return VariableDTO(
            key=row.key,
            description=getattr(row, "description", None),
            value=row.val,
            is_encrypted=getattr(row, "is_encrypted", False),
        )


@app.delete("/api/variables/{var_key}")
def delete_variable(var_key: str):
    """Deletes a variable by key."""
    with create_session() as session:
        row = (
            session.query(Variable)
            .filter(Variable.key == var_key)
            .one_or_none()
        )
        if row is None:
            raise HTTPException(status_code=404, detail="Variable not found")
        session.delete(row)
    return {"status": "ok"}


@app.post("/api/sync-file")
def sync_variables_from_file():
    """Imports variables from AIRFLOW_HOME/variables.json into the database."""
    airflow_home = conf.get("core", "airflow_home")
    var_file = os.path.join(airflow_home, "variables.json")

    if not os.path.exists(var_file):
        raise HTTPException(status_code=404, detail=f"File {var_file} not found")

    try:
        with open(var_file, "r") as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse JSON: {e}")

    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="JSON must be a dictionary")

    for key, value in data.items():
        if not isinstance(value, str):
            value = json.dumps(value)
        Variable.set(key, value, serialize_json=False)

    return {"status": "ok", "message": f"Successfully imported {len(data)} variables from {var_file}"}


# ------------------------
# HTML UI Page
# ------------------------

@app.get("/", response_class=FileResponse)
async def root():
    """Serves the main UI page."""
    index_path = os.path.join(STATIC_DIR, "index.html")
    return FileResponse(index_path)


# ------------------------
# Plugin registration
# ------------------------

class VariableJsonPlugin(AirflowPlugin):
    name = "variable_json_plugin"

    fastapi_apps = [
        {
            "app": app,
            "url_prefix": "/variable-json",
            "name": "Variable JSON Viewer",
        }
    ]

    external_views = [
        {
            "name": "Variables JSON Viewer",
            "href": "/variable-json/",
            "destination": "nav",
            "category": "admin",
            "qurl_route": "variables-json",
        }
    ]
