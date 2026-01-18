from fastapi import FastAPI, APIRouter, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json
import shutil
import mimetypes
from PIL import Image
from colorthief import ColorThief
import io
from mutagen import File as MutagenFile


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
projects_collection = db.projects

# Helper functions
def generate_id() -> str:
    """Generate a unique ID"""
    return str(uuid.uuid4())

def utc_now() -> datetime:
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============== Asset Management ==============
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024  # 2GB

def get_project_upload_dir(project_id: str) -> Path:
    """Get or create upload directory for a project"""
    project_dir = UPLOAD_DIR / project_id
    project_dir.mkdir(exist_ok=True)
    (project_dir / "images").mkdir(exist_ok=True)
    (project_dir / "audio").mkdir(exist_ok=True)
    (project_dir / "video").mkdir(exist_ok=True)
    return project_dir


def optimize_image(image_path: Path, max_width: int = 1920, max_height: int = 1080) -> None:
    """Optimize image file - resize if too large and save as WebP"""
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if too large
            if img.width > max_width or img.height > max_height:
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save as WebP for better compression
            webp_path = image_path.with_suffix('.webp')
            img.save(webp_path, 'WEBP', quality=85, method=6)
            
            # If saved as webp, remove original if it's not webp
            if webp_path != image_path:
                image_path.unlink()
                return webp_path
            
            return image_path
    except Exception as e:
        logger.error(f"Error optimizing image {image_path}: {e}")
        return image_path


def extract_color_palette(image_path: Path, num_colors: int = 5) -> List[str]:
    """Extract dominant colors from an image"""
    try:
        color_thief = ColorThief(str(image_path))
        palette = color_thief.get_palette(color_count=num_colors, quality=1)
        # Convert RGB tuples to hex
        hex_colors = ['#%02x%02x%02x' % color for color in palette]
        return hex_colors
    except Exception as e:
        logger.error(f"Error extracting palette from {image_path}: {e}")
        return []


def get_audio_metadata(audio_path: Path) -> dict:
    """Extract metadata from audio file"""
    try:
        audio = MutagenFile(str(audio_path))
        if audio is None:
            return {}
        
        metadata = {
            "duration": getattr(audio.info, 'length', 0),
            "bitrate": getattr(audio.info, 'bitrate', 0),
            "sample_rate": getattr(audio.info, 'sample_rate', 0),
            "channels": getattr(audio.info, 'channels', 0)
        }
        return metadata
    except Exception as e:
        logger.error(f"Error extracting audio metadata from {audio_path}: {e}")
        return {}


@api_router.post("/projects/{project_id}/assets/upload")
async def upload_asset(project_id: str, file: UploadFile = File(...)):
    """Upload an asset (image, audio, video) to a project"""
    # Verify project exists
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024**3):.1f}GB"
        )
    
    # Determine file type
    content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or ''
    
    if content_type.startswith('image/'):
        file_category = 'images'
    elif content_type.startswith('audio/'):
        file_category = 'audio'
    elif content_type.startswith('video/'):
        file_category = 'video'
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    # Save file
    project_dir = get_project_upload_dir(project_id)
    safe_filename = f"{generate_id()}_{file.filename.replace(' ', '_')}"
    file_path = project_dir / file_category / safe_filename
    
    try:
        with open(file_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file")
    
    # Process based on file type
    asset_metadata = {
        "id": generate_id(),
        "filename": file.filename,
        "stored_filename": safe_filename,
        "type": file_category,
        "content_type": content_type,
        "size": file_size,
        "url": f"/api/assets/{project_id}/{file_category}/{safe_filename}",
        "uploaded_at": utc_now().isoformat()
    }
    
    # Process images
    if file_category == 'images':
        try:
            optimized_path = optimize_image(file_path)
            if optimized_path != file_path:
                # Update stored filename and URL if converted to webp
                asset_metadata["stored_filename"] = optimized_path.name
                asset_metadata["url"] = f"/api/assets/{project_id}/{file_category}/{optimized_path.name}"
                file_path = optimized_path
            
            # Extract dimensions
            with Image.open(file_path) as img:
                asset_metadata["width"] = img.width
                asset_metadata["height"] = img.height
            
            # Extract color palette
            colors = extract_color_palette(file_path)
            asset_metadata["colors"] = colors
            
            # Update project color palette
            if colors:
                current_palette = project.get("color_palette", [])
                # Add new colors that aren't already in palette
                new_palette = current_palette + [c for c in colors if c not in current_palette]
                await projects_collection.update_one(
                    {"id": project_id},
                    {"$set": {"color_palette": new_palette[:20]}}  # Keep max 20 colors
                )
        except Exception as e:
            logger.error(f"Error processing image: {e}")
    
    # Process audio
    elif file_category == 'audio':
        metadata = get_audio_metadata(file_path)
        asset_metadata.update(metadata)
    
    # Add asset to project
    await projects_collection.update_one(
        {"id": project_id},
        {
            "$push": {"assets": asset_metadata},
            "$set": {"updated_at": utc_now().isoformat()}
        }
    )
    
    return asset_metadata


@api_router.get("/projects/{project_id}/assets")
async def list_assets(project_id: str):
    """List all assets for a project"""
    project = await projects_collection.find_one(
        {"id": project_id},
        {"_id": 0, "assets": 1}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"assets": project.get("assets", [])}


@api_router.delete("/projects/{project_id}/assets/{asset_id}")
async def delete_asset(project_id: str, asset_id: str):
    """Delete an asset from a project"""
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Find asset
    assets = project.get("assets", [])
    asset = next((a for a in assets if a.get("id") == asset_id), None)
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Delete file from disk
    project_dir = get_project_upload_dir(project_id)
    file_path = project_dir / asset["type"] / asset["stored_filename"]
    
    try:
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
    
    # Remove from project
    await projects_collection.update_one(
        {"id": project_id},
        {
            "$pull": {"assets": {"id": asset_id}},
            "$set": {"updated_at": utc_now().isoformat()}
        }
    )
    
    return {"message": "Asset deleted"}


@api_router.get("/assets/{project_id}/{file_category}/{filename}")
async def serve_asset(project_id: str, file_category: str, filename: str):
    """Serve an uploaded asset file"""
    file_path = UPLOAD_DIR / project_id / file_category / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return FileResponse(file_path)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()