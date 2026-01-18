from fastapi import FastAPI, APIRouter, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone
import json
import shutil
import mimetypes

from models import (
    Project, ProjectCreate, ProjectUpdate,
    AtmosphericState, AtmosphericStateCreate,
    VariationConfig, VariationConfigCreate,
    ExportConfig, ExportResult, ExportFormat,
    ContinuityConfig, CognitiveZeroConfig,
    VisualLayerConfig, AudioLayerConfig, TempoRulesConfig,
    PWAManifestConfig, Asset, AssetMetadata, AssetType,
    generate_id, utc_now
)
from asset_utils import (
    extract_color_palette, get_image_dimensions, 
    get_asset_type, ensure_asset_directory, generate_thumbnail
)
from pwa_bundle import create_pwa_bundle

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
projects_collection = db.projects
exports_collection = db.exports
assets_collection = db.assets

# Create the main app
app = FastAPI(title="Project Chimera API", version="1.0.0")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Helper functions
def serialize_datetime(obj):
    """Convert datetime to ISO string for MongoDB storage"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: serialize_datetime(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_datetime(item) for item in obj]
    return obj


def deserialize_datetime(obj, datetime_fields):
    """Convert ISO strings back to datetime objects"""
    if isinstance(obj, dict):
        for field in datetime_fields:
            if field in obj and isinstance(obj[field], str):
                try:
                    obj[field] = datetime.fromisoformat(obj[field])
                except ValueError:
                    pass
        # Recursively handle nested objects
        for key, value in obj.items():
            if isinstance(value, dict):
                deserialize_datetime(value, datetime_fields)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        deserialize_datetime(item, datetime_fields)
    return obj


# ============== Health Check ==============
@api_router.get("/")
async def root():
    return {"message": "Project Chimera API", "version": "1.0.0"}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": utc_now().isoformat()}


# ============== Projects ==============
@api_router.post("/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(project_data: ProjectCreate):
    """Create a new PWA project or fork from existing"""
    
    if project_data.fork_from_id:
        # Fork from existing project
        source = await projects_collection.find_one(
            {"id": project_data.fork_from_id},
            {"_id": 0}
        )
        if not source:
            raise HTTPException(status_code=404, detail="Source project not found")
        
        deserialize_datetime(source, ["created_at", "updated_at", "last_opened_at"])
        
        # Create forked project
        project = Project(
            name=project_data.name,
            description=project_data.description or f"Forked from {source['name']}",
            states=[AtmosphericState(**s) for s in source.get("states", [])],
            variations=[VariationConfig(**v) for v in source.get("variations", [])],
            continuity=ContinuityConfig(**source.get("continuity", {})),
            cognitive_zero=CognitiveZeroConfig(**source.get("cognitive_zero", {})),
            pwa_manifest=PWAManifestConfig(**source.get("pwa_manifest", {"name": project_data.name, "short_name": project_data.name})),
            assets=source.get("assets", []),
            color_palette=source.get("color_palette", []),
            forked_from=project_data.fork_from_id
        )
        # Update manifest name
        project.pwa_manifest.name = project_data.name
        project.pwa_manifest.short_name = project_data.name[:12]
    else:
        # Create new project
        manifest = project_data.pwa_manifest or PWAManifestConfig(
            name=project_data.name,
            short_name=project_data.name[:12]
        )
        project = Project(
            name=project_data.name,
            description=project_data.description,
            pwa_manifest=manifest
        )
    
    # Serialize and store
    doc = serialize_datetime(project.model_dump())
    await projects_collection.insert_one(doc)
    
    return project


@api_router.get("/projects", response_model=List[Project])
async def list_projects(include_templates: bool = False):
    """List all projects"""
    query = {} if include_templates else {"is_template": {"$ne": True}}
    cursor = projects_collection.find(query, {"_id": 0}).sort("updated_at", -1)
    projects = await cursor.to_list(100)
    
    for p in projects:
        deserialize_datetime(p, ["created_at", "updated_at", "last_opened_at"])
    
    return projects


@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a specific project"""
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    deserialize_datetime(project, ["created_at", "updated_at", "last_opened_at"])
    
    # Update last opened
    await projects_collection.update_one(
        {"id": project_id},
        {"$set": {"last_opened_at": utc_now().isoformat()}}
    )
    
    return project


@api_router.patch("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, updates: ProjectUpdate):
    """Update project settings"""
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    update_data["updated_at"] = utc_now().isoformat()
    
    # Serialize nested objects
    update_data = serialize_datetime(update_data)
    
    await projects_collection.update_one(
        {"id": project_id},
        {"$set": update_data}
    )
    
    updated = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    deserialize_datetime(updated, ["created_at", "updated_at", "last_opened_at"])
    
    return updated


@api_router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str):
    """Delete a project"""
    result = await projects_collection.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return None


# ============== Atmospheric States ==============
@api_router.post("/projects/{project_id}/states", response_model=AtmosphericState, status_code=status.HTTP_201_CREATED)
async def create_state(project_id: str, state_data: AtmosphericStateCreate):
    """Add a new atmospheric state to a project"""
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create state with defaults for None fields
    state = AtmosphericState(
        name=state_data.name,
        description=state_data.description,
        visual=state_data.visual or VisualLayerConfig(),
        audio=state_data.audio or AudioLayerConfig(),
        tempo=state_data.tempo or TempoRulesConfig(),
        time_condition=state_data.time_condition,
        specific_days=state_data.specific_days,
        absence_hours_required=state_data.absence_hours_required,
        is_ephemeral=state_data.is_ephemeral,
        mood_tags=state_data.mood_tags,
        weight=state_data.weight
    )
    
    state_doc = serialize_datetime(state.model_dump())
    
    await projects_collection.update_one(
        {"id": project_id},
        {
            "$push": {"states": state_doc},
            "$set": {"updated_at": utc_now().isoformat()}
        }
    )
    
    return state


@api_router.get("/projects/{project_id}/states", response_model=List[AtmosphericState])
async def list_states(project_id: str):
    """List all states in a project"""
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0, "states": 1})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    states = project.get("states", [])
    for s in states:
        deserialize_datetime(s, ["created_at", "updated_at"])
    
    return states


@api_router.get("/projects/{project_id}/states/{state_id}", response_model=AtmosphericState)
async def get_state(project_id: str, state_id: str):
    """Get a specific state"""
    project = await projects_collection.find_one(
        {"id": project_id, "states.id": state_id},
        {"_id": 0, "states.$": 1}
    )
    if not project or not project.get("states"):
        raise HTTPException(status_code=404, detail="State not found")
    
    state = project["states"][0]
    deserialize_datetime(state, ["created_at", "updated_at"])
    
    return state


@api_router.put("/projects/{project_id}/states/{state_id}", response_model=AtmosphericState)
async def update_state(project_id: str, state_id: str, state_data: AtmosphericStateCreate):
    """Update a state"""
    state = AtmosphericState(
        id=state_id,
        name=state_data.name,
        description=state_data.description,
        visual=state_data.visual or VisualLayerConfig(),
        audio=state_data.audio or AudioLayerConfig(),
        tempo=state_data.tempo or TempoRulesConfig(),
        time_condition=state_data.time_condition,
        specific_days=state_data.specific_days,
        absence_hours_required=state_data.absence_hours_required,
        is_ephemeral=state_data.is_ephemeral,
        mood_tags=state_data.mood_tags,
        weight=state_data.weight,
        updated_at=utc_now()
    )
    
    state_doc = serialize_datetime(state.model_dump())
    
    result = await projects_collection.update_one(
        {"id": project_id, "states.id": state_id},
        {
            "$set": {
                "states.$": state_doc,
                "updated_at": utc_now().isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="State not found")
    
    return state


@api_router.delete("/projects/{project_id}/states/{state_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_state(project_id: str, state_id: str):
    """Delete a state"""
    result = await projects_collection.update_one(
        {"id": project_id},
        {
            "$pull": {"states": {"id": state_id}},
            "$set": {"updated_at": utc_now().isoformat()}
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return None


# ============== Variations ==============
@api_router.post("/projects/{project_id}/variations", response_model=VariationConfig, status_code=status.HTTP_201_CREATED)
async def create_variation(project_id: str, variation_data: VariationConfigCreate):
    """Add a new variation to a project"""
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    from models import VariationSeed
    
    variation = VariationConfig(
        name=variation_data.name,
        description=variation_data.description,
        seed=variation_data.seed or VariationSeed(),
        state_weight_overrides=variation_data.state_weight_overrides,
        transition_duration_modifier=variation_data.transition_duration_modifier,
        audio_spacing_modifier=variation_data.audio_spacing_modifier,
        blend_mode_sequence=variation_data.blend_mode_sequence
    )
    
    variation_doc = serialize_datetime(variation.model_dump())
    
    await projects_collection.update_one(
        {"id": project_id},
        {
            "$push": {"variations": variation_doc},
            "$set": {"updated_at": utc_now().isoformat()}
        }
    )
    
    return variation


@api_router.get("/projects/{project_id}/variations", response_model=List[VariationConfig])
async def list_variations(project_id: str):
    """List all variations in a project"""
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0, "variations": 1})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    variations = project.get("variations", [])
    for v in variations:
        deserialize_datetime(v, ["created_at"])
    
    return variations


@api_router.delete("/projects/{project_id}/variations/{variation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_variation(project_id: str, variation_id: str):
    """Delete a variation"""
    result = await projects_collection.update_one(
        {"id": project_id},
        {
            "$pull": {"variations": {"id": variation_id}},
            "$set": {"updated_at": utc_now().isoformat()}
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return None


# ============== Export ==============
@api_router.post("/projects/{project_id}/export", response_model=ExportResult)
async def export_project(project_id: str, config: ExportConfig):
    """Generate PWA export"""
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create export record
    export_result = ExportResult(
        project_id=project_id,
        variation_id=config.variation_id,
        format=config.format,
        status="completed"
    )
    
    # For MVP, generate in-memory PWA scaffold
    pwa_scaffold = generate_pwa_scaffold(project, config)
    
    export_doc = serialize_datetime(export_result.model_dump())
    export_doc["scaffold"] = pwa_scaffold
    
    await exports_collection.insert_one(export_doc)
    
    export_result.status = "completed"
    export_result.completed_at = utc_now()
    
    return export_result


@api_router.get("/exports/{export_id}/scaffold")
async def get_export_scaffold(export_id: str):
    """Get the generated PWA scaffold"""
    export_doc = await exports_collection.find_one({"id": export_id}, {"_id": 0})
    if not export_doc:
        raise HTTPException(status_code=404, detail="Export not found")
    
    return {"scaffold": export_doc.get("scaffold", {})}


@api_router.get("/projects/{project_id}/export/download")
async def download_pwa_bundle(project_id: str):
    """Generate and download complete PWA bundle as zip"""
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    deserialize_datetime(project, ["created_at", "updated_at", "last_opened_at"])
    
    # Create exports directory
    exports_dir = ROOT_DIR / "static" / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)
    
    # Get project assets directory
    assets_dir = ROOT_DIR / "static" / "assets" / project_id
    
    try:
        # Generate bundle
        zip_path = create_pwa_bundle(project, exports_dir, assets_dir)
        
        # Return file for download
        return FileResponse(
            path=str(zip_path),
            media_type="application/zip",
            filename=zip_path.name,
            headers={
                "Content-Disposition": f"attachment; filename={zip_path.name}"
            }
        )
    except Exception as e:
        logger.error(f"Failed to create bundle: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create bundle: {str(e)}")


# ============== Assets ==============
@api_router.post("/projects/{project_id}/assets/upload")
async def upload_asset(
    project_id: str,
    file: UploadFile = File(...)
):
    """Upload an asset (image, audio, video) to a project"""
    # Verify project exists
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Read file content
    content = await file.read()
    
    # Determine MIME type
    mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
    asset_type = get_asset_type(mime_type)
    
    # Create asset directory
    asset_dir = ensure_asset_directory(project_id, ROOT_DIR)
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{generate_id()}{file_ext}"
    file_path = asset_dir / unique_filename
    
    # Save file
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Extract metadata
    width, height = None, None
    color_palette = []
    
    if asset_type == 'image':
        dimensions = get_image_dimensions(content)
        if dimensions:
            width, height = dimensions
        color_palette = extract_color_palette(content, num_colors=5)
        
        # Generate thumbnail
        try:
            thumb_data = generate_thumbnail(content)
            thumb_filename = f"{generate_id()}_thumb{file_ext}"
            thumb_path = asset_dir / thumb_filename
            with open(thumb_path, 'wb') as f:
                f.write(thumb_data)
        except Exception as e:
            logger.error(f"Failed to generate thumbnail: {e}")
    
    # Create asset URL
    asset_url = f"/static/assets/{project_id}/{unique_filename}"
    
    # Create asset metadata
    metadata = AssetMetadata(
        filename=unique_filename,
        original_filename=file.filename,
        asset_type=asset_type,
        mime_type=mime_type,
        size_bytes=len(content),
        width=width,
        height=height,
        url=asset_url,
        color_palette=color_palette
    )
    
    # Create asset record
    asset = Asset(
        project_id=project_id,
        metadata=metadata
    )
    
    # Save to database
    asset_doc = serialize_datetime(asset.model_dump())
    await assets_collection.insert_one(asset_doc)
    
    # Update project's asset list and color palette
    await projects_collection.update_one(
        {"id": project_id},
        {
            "$push": {"assets": asset_url},
            "$set": {
                "color_palette": list(set(project.get("color_palette", []) + color_palette)),
                "updated_at": utc_now().isoformat()
            }
        }
    )
    
    return asset


@api_router.get("/projects/{project_id}/assets")
async def list_project_assets(project_id: str):
    """List all assets for a project"""
    cursor = assets_collection.find({"project_id": project_id}, {"_id": 0})
    assets = await cursor.to_list(1000)
    
    for asset in assets:
        deserialize_datetime(asset, ["created_at"])
        if "metadata" in asset and "uploaded_at" in asset["metadata"]:
            asset["metadata"]["uploaded_at"] = datetime.fromisoformat(asset["metadata"]["uploaded_at"]) if isinstance(asset["metadata"]["uploaded_at"], str) else asset["metadata"]["uploaded_at"]
    
    return {"assets": assets}


@api_router.delete("/projects/{project_id}/assets/{asset_id}")
async def delete_asset(project_id: str, asset_id: str):
    """Delete an asset"""
    asset = await assets_collection.find_one({"id": asset_id, "project_id": project_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Delete file from filesystem
    try:
        file_path = ROOT_DIR / "static" / "assets" / project_id / asset["metadata"]["filename"]
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        logger.error(f"Failed to delete file: {e}")
    
    # Remove from database
    await assets_collection.delete_one({"id": asset_id})
    
    # Update project's asset list
    await projects_collection.update_one(
        {"id": project_id},
        {
            "$pull": {"assets": asset["metadata"]["url"]},
            "$set": {"updated_at": utc_now().isoformat()}
        }
    )
    
    return {"message": "Asset deleted"}


def generate_pwa_scaffold(project: dict, config: ExportConfig) -> dict:
    """Generate PWA scaffold structure"""
    manifest = project.get("pwa_manifest", {})
    states = project.get("states", [])
    continuity = project.get("continuity", {})
    cognitive_zero = project.get("cognitive_zero", {})
    
    # Generate manifest.json
    manifest_json = {
        "name": manifest.get("name", "Atmosphere PWA"),
        "short_name": manifest.get("short_name", "Atmosphere"),
        "description": manifest.get("description", "A digital place"),
        "start_url": "/",
        "display": manifest.get("display", "standalone"),
        "orientation": manifest.get("orientation", "any"),
        "theme_color": manifest.get("theme_color", "#050505"),
        "background_color": manifest.get("background_color", "#050505"),
        "icons": [
            {"src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
        ]
    }
    
    # Generate state configuration
    states_config = []
    for state in states:
        states_config.append({
            "id": state.get("id"),
            "name": state.get("name"),
            "visual": state.get("visual", {}),
            "audio": state.get("audio", {}),
            "tempo": state.get("tempo", {}),
            "timeCondition": state.get("time_condition", "always"),
            "isEphemeral": state.get("is_ephemeral", False),
            "weight": state.get("weight", 1.0)
        })
    
    # Generate service worker
    service_worker = """
// Atmosphere PWA Service Worker
const CACHE_NAME = 'atmosphere-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/config.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
"""
    
    # Generate main app config
    app_config = {
        "states": states_config,
        "continuity": continuity,
        "cognitiveZero": cognitive_zero,
        "version": "1.0.0"
    }
    
    # Generate index.html
    index_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="{manifest.get('theme_color', '#050505')}">
  <link rel="manifest" href="/manifest.json">
  <title>{manifest.get('name', 'Atmosphere')}</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ background: #050505; color: #fafafa; font-family: system-ui; overflow: hidden; }}
    #atmosphere {{ position: fixed; inset: 0; }}
  </style>
</head>
<body>
  <div id="atmosphere"></div>
  <script src="/app.js" type="module"></script>
</body>
</html>
"""
    
    return {
        "manifest.json": manifest_json,
        "config.json": app_config,
        "service-worker.js": service_worker,
        "index.html": index_html,
        "structure": {
            "dist/": ["index.html", "manifest.json", "config.json", "service-worker.js", "app.js"],
            "dist/icons/": ["icon-192.png", "icon-512.png"],
            "dist/assets/": ["(user assets)"]
        }
    }


# ============== Templates ==============
@api_router.get("/templates", response_model=List[Project])
async def list_templates():
    """List available project templates"""
    cursor = projects_collection.find({"is_template": True}, {"_id": 0})
    templates = await cursor.to_list(50)
    
    for t in templates:
        deserialize_datetime(t, ["created_at", "updated_at", "last_opened_at"])
    
    return templates


@api_router.post("/templates/seed")
async def seed_base_template():
    """Create the base Sun God template if it doesn't exist"""
    existing = await projects_collection.find_one({"name": "Sun God Base", "is_template": True})
    if existing:
        return {"message": "Base template already exists", "id": existing.get("id")}
    
    # Create base template
    base_template = Project(
        name="Sun God Base",
        description="The foundational atmospheric PWA template. A digital place that remembers, adapts, and respects attention.",
        is_template=True,
        pwa_manifest=PWAManifestConfig(
            name="Atmosphere",
            short_name="Atmosphere",
            description="A persistent digital environment",
            theme_color="#050505",
            background_color="#050505"
        ),
        continuity=ContinuityConfig(),
        cognitive_zero=CognitiveZeroConfig()
    )
    
    # Add a default calm state
    default_state = AtmosphericState(
        name="Serene",
        description="A calm, meditative atmosphere",
        mood_tags=["calm", "peaceful", "meditative"],
        visual=VisualLayerConfig(
            transition_type="crossfade",
            transition_duration_ms=3000,
            max_entropy=0.3
        ),
        audio=AudioLayerConfig(
            playlist_mode="weighted-random",
            initial_volume=0.5,
            adaptive_softening=True
        ),
        tempo=TempoRulesConfig(
            transition_pacing_seconds=20,
            time_of_day_modifier=True
        )
    )
    
    base_template.states.append(default_state)
    
    doc = serialize_datetime(base_template.model_dump())
    await projects_collection.insert_one(doc)
    
    return {"message": "Base template created", "id": base_template.id}


# Include router
app.include_router(api_router)

# Mount static files for assets
app.mount("/static", StaticFiles(directory=str(ROOT_DIR / "static")), name="static")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database indexes"""
    await projects_collection.create_index("id", unique=True)
    await projects_collection.create_index("name")
    await projects_collection.create_index("is_template")
    await exports_collection.create_index("id", unique=True)
    await exports_collection.create_index("project_id")
    await assets_collection.create_index("id", unique=True)
    await assets_collection.create_index("project_id")
    logger.info("Database indexes created")
    
    # Ensure static assets directory exists
    asset_dir = ROOT_DIR / "static" / "assets"
    asset_dir.mkdir(parents=True, exist_ok=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
