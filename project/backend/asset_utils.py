"""Asset processing utilities for PWA Genesis Engine"""
import os
from pathlib import Path
from typing import List, Tuple, Optional
from PIL import Image
import io


def extract_color_palette(image_data: bytes, num_colors: int = 5) -> List[str]:
    """Extract dominant colors from image using simple algorithm"""
    try:
        img = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize for faster processing
        img.thumbnail((150, 150))
        
        # Get colors
        pixels = list(img.getdata())
        
        # Simple clustering by binning
        color_bins = {}
        for r, g, b in pixels:
            # Bin to 32 levels per channel for clustering
            key = (r // 32 * 32, g // 32 * 32, b // 32 * 32)
            color_bins[key] = color_bins.get(key, 0) + 1
        
        # Sort by frequency
        sorted_colors = sorted(color_bins.items(), key=lambda x: x[1], reverse=True)
        
        # Return top N colors as hex
        palette = []
        for (r, g, b), count in sorted_colors[:num_colors]:
            palette.append(f"#{r:02x}{g:02x}{b:02x}")
        
        return palette
    except Exception as e:
        print(f"Error extracting palette: {e}")
        return []


def get_image_dimensions(image_data: bytes) -> Optional[Tuple[int, int]]:
    """Get image width and height"""
    try:
        img = Image.open(io.BytesIO(image_data))
        return img.size
    except Exception as e:
        print(f"Error getting dimensions: {e}")
        return None


def get_asset_type(mime_type: str) -> str:
    """Determine asset type from MIME type"""
    if mime_type.startswith('image/'):
        return 'image'
    elif mime_type.startswith('audio/'):
        return 'audio'
    elif mime_type.startswith('video/'):
        return 'video'
    else:
        return 'other'


def ensure_asset_directory(project_id: str, base_dir: Path) -> Path:
    """Ensure project asset directory exists"""
    asset_dir = base_dir / "static" / "assets" / project_id
    asset_dir.mkdir(parents=True, exist_ok=True)
    return asset_dir


def generate_thumbnail(image_data: bytes, size: Tuple[int, int] = (300, 300)) -> bytes:
    """Generate thumbnail from image"""
    try:
        img = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Create thumbnail
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=85)
        return output.getvalue()
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return image_data
