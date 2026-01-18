from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


def generate_id():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class BlendMode(str, Enum):
    NORMAL = "normal"
    MULTIPLY = "multiply"
    SCREEN = "screen"
    OVERLAY = "overlay"
    DARKEN = "darken"
    LIGHTEN = "lighten"
    COLOR_DODGE = "color-dodge"
    COLOR_BURN = "color-burn"
    DIFFERENCE = "difference"
    EXCLUSION = "exclusion"
    HUE = "hue"
    SATURATION = "saturation"
    COLOR = "color"
    LUMINOSITY = "luminosity"


class TransitionType(str, Enum):
    CROSSFADE = "crossfade"
    WIPE = "wipe"
    ENTROPY_BLEND = "entropy-blend"
    SLIDE = "slide"
    ZOOM = "zoom"
    DISSOLVE = "dissolve"


class PlaylistMode(str, Enum):
    LINEAR = "linear"
    WEIGHTED_RANDOM = "weighted-random"
    NON_REPEATING = "non-repeating"
    SHUFFLE = "shuffle"


class TimeCondition(str, Enum):
    ALWAYS = "always"
    NIGHT_ONLY = "night-only"
    DAY_ONLY = "day-only"
    GOLDEN_HOUR = "golden-hour"
    SPECIFIC_DAYS = "specific-days"
    POST_ABSENCE = "post-absence"
    ONCE_ONLY = "once-only"


# Visual Layer Configuration
class VisualLayerConfig(BaseModel):
    background_stack: List[str] = Field(default_factory=list, description="Asset URLs for background layers")
    blend_modes: List[BlendMode] = Field(default_factory=lambda: [BlendMode.NORMAL])
    transition_type: TransitionType = TransitionType.CROSSFADE
    transition_duration_ms: int = Field(default=2000, ge=100, le=30000)
    max_entropy: float = Field(default=0.7, ge=0.0, le=1.0)
    night_reduction_factor: float = Field(default=0.5, ge=0.0, le=1.0)
    opacity: float = Field(default=1.0, ge=0.0, le=1.0)
    tint_color: Optional[str] = None
    tint_opacity: float = Field(default=0.0, ge=0.0, le=1.0)


# Audio Layer Configuration
class AudioLayerConfig(BaseModel):
    playlist: List[str] = Field(default_factory=list, description="Audio asset URLs")
    playlist_mode: PlaylistMode = PlaylistMode.WEIGHTED_RANDOM
    initial_volume: float = Field(default=0.7, ge=0.0, le=1.0)
    crossfade_duration_ms: int = Field(default=3000, ge=0, le=10000)
    adaptive_softening: bool = True
    session_fade_threshold_minutes: int = Field(default=30, ge=5, le=120)


# Tempo Rules Configuration
class TempoRulesConfig(BaseModel):
    transition_pacing_seconds: int = Field(default=14, ge=1, le=300)
    time_of_day_modifier: bool = True
    session_length_modifier: bool = True
    device_type_modifier: bool = True
    night_pacing_multiplier: float = Field(default=1.5, ge=1.0, le=3.0)
    long_session_multiplier: float = Field(default=1.3, ge=1.0, le=2.0)


# Atmospheric State - Complete experiential configuration
class AtmosphericState(BaseModel):
    id: str = Field(default_factory=generate_id)
    name: str
    description: Optional[str] = None
    visual: VisualLayerConfig = Field(default_factory=VisualLayerConfig)
    audio: AudioLayerConfig = Field(default_factory=AudioLayerConfig)
    tempo: TempoRulesConfig = Field(default_factory=TempoRulesConfig)
    time_condition: TimeCondition = TimeCondition.ALWAYS
    specific_days: List[int] = Field(default_factory=list, description="0=Sunday, 6=Saturday")
    absence_hours_required: int = Field(default=72, ge=1, le=720)
    is_ephemeral: bool = Field(default=False, description="One-time experience that cannot be repeated")
    ephemeral_triggered: bool = Field(default=False)
    mood_tags: List[str] = Field(default_factory=list)
    weight: float = Field(default=1.0, ge=0.1, le=10.0, description="Selection probability weight")
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class AtmosphericStateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    visual: Optional[VisualLayerConfig] = None
    audio: Optional[AudioLayerConfig] = None
    tempo: Optional[TempoRulesConfig] = None
    time_condition: TimeCondition = TimeCondition.ALWAYS
    specific_days: List[int] = Field(default_factory=list)
    absence_hours_required: int = 72
    is_ephemeral: bool = False
    mood_tags: List[str] = Field(default_factory=list)
    weight: float = 1.0


# Variation Seed Configuration
class VariationSeed(BaseModel):
    mood_bias: float = Field(default=0.0, ge=-1.0, le=1.0, description="-1=calm, 1=energetic")
    pacing_bias: float = Field(default=0.0, ge=-1.0, le=1.0, description="-1=slow, 1=fast")
    scarcity_bias: float = Field(default=0.0, ge=-1.0, le=1.0, description="-1=abundant, 1=rare")
    entropy_bias: float = Field(default=0.0, ge=-1.0, le=1.0, description="-1=ordered, 1=chaotic")


# Variation Configuration
class VariationConfig(BaseModel):
    id: str = Field(default_factory=generate_id)
    name: str
    description: Optional[str] = None
    seed: VariationSeed = Field(default_factory=VariationSeed)
    state_weight_overrides: Dict[str, float] = Field(default_factory=dict)
    transition_duration_modifier: float = Field(default=1.0, ge=0.5, le=2.0)
    audio_spacing_modifier: float = Field(default=1.0, ge=0.5, le=2.0)
    blend_mode_sequence: List[BlendMode] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)


class VariationConfigCreate(BaseModel):
    name: str
    description: Optional[str] = None
    seed: Optional[VariationSeed] = None
    state_weight_overrides: Dict[str, float] = Field(default_factory=dict)
    transition_duration_modifier: float = 1.0
    audio_spacing_modifier: float = 1.0
    blend_mode_sequence: List[BlendMode] = Field(default_factory=list)


# Continuity Configuration (Memory & Time-Aware Adaptation)
class ContinuityConfig(BaseModel):
    remember_last_state: bool = True
    remember_audio_position: bool = True
    remember_visual_progress: bool = True
    remember_session_duration: bool = True
    session_ghost_enabled: bool = True
    session_ghost_duration_ms: int = Field(default=3000, ge=1000, le=10000)
    time_aware_adaptation: bool = True
    night_mode_enabled: bool = True
    night_start_hour: int = Field(default=22, ge=0, le=23)
    night_end_hour: int = Field(default=6, ge=0, le=23)
    long_session_adaptation: bool = True
    long_session_threshold_minutes: int = Field(default=45, ge=15, le=180)
    fatigue_desaturation_percent: float = Field(default=0.02, ge=0.0, le=0.1)


# Cognitive Zero Mode Configuration
class CognitiveZeroConfig(BaseModel):
    enabled: bool = True
    min_duration_minutes: int = Field(default=20, ge=5, le=60)
    max_duration_minutes: int = Field(default=60, ge=20, le=180)
    auto_advance_interval_seconds: int = Field(default=120, ge=30, le=600)
    nav_auto_hide_delay_ms: int = Field(default=300000, ge=60000, le=600000)
    session_arc_enabled: bool = True
    opening_intensity: float = Field(default=0.8, ge=0.0, le=1.0)
    middle_intensity: float = Field(default=0.5, ge=0.0, le=1.0)
    closing_intensity: float = Field(default=0.3, ge=0.0, le=1.0)


# PWA Manifest Configuration
class PWAManifestConfig(BaseModel):
    name: str
    short_name: str
    description: Optional[str] = None
    theme_color: str = "#050505"
    background_color: str = "#050505"
    display: str = "standalone"
    orientation: str = "any"
    start_url: str = "/"
    scope: str = "/"


# Complete Project Definition
# Complete Project Definition
class AssetMetadata(BaseModel):
    id: str
    filename: str
    stored_filename: str
    type: str  # 'images', 'audio', 'video'
    content_type: str
    size: int
    url: str
    uploaded_at: str
    # Image-specific
    width: Optional[int] = None
    height: Optional[int] = None
    colors: List[str] = Field(default_factory=list)
    # Audio-specific
    duration: Optional[float] = None
    bitrate: Optional[int] = None
    sample_rate: Optional[int] = None
    channels: Optional[int] = None


class Project(BaseModel):
    id: str = Field(default_factory=generate_id)
    name: str
    description: Optional[str] = None
    states: List[AtmosphericState] = Field(default_factory=list)
    variations: List[VariationConfig] = Field(default_factory=list)
    continuity: ContinuityConfig = Field(default_factory=ContinuityConfig)
    cognitive_zero: CognitiveZeroConfig = Field(default_factory=CognitiveZeroConfig)
    pwa_manifest: PWAManifestConfig = Field(default_factory=lambda: PWAManifestConfig(name="Untitled", short_name="Untitled"))
    assets: List[dict] = Field(default_factory=list, description="Uploaded asset metadata")
    color_palette: List[str] = Field(default_factory=list, description="Extracted color palette")
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    last_opened_at: Optional[datetime] = None
    is_template: bool = False
    forked_from: Optional[str] = None


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    pwa_manifest: Optional[PWAManifestConfig] = None
    fork_from_id: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    continuity: Optional[ContinuityConfig] = None
    cognitive_zero: Optional[CognitiveZeroConfig] = None
    pwa_manifest: Optional[PWAManifestConfig] = None
    assets: Optional[List[str]] = None
    color_palette: Optional[List[str]] = None


# Export Configuration
class ExportFormat(str, Enum):
    STATIC_BUNDLE = "static-bundle"
    DOCKER_CONTAINER = "docker-container"
    SOURCE_CODE = "source-code"


class ExportConfig(BaseModel):
    format: ExportFormat = ExportFormat.STATIC_BUNDLE
    include_service_worker: bool = True
    include_telemetry: bool = False
    minify: bool = True
    generate_icons: bool = True
    variation_id: Optional[str] = None


class ExportResult(BaseModel):
    id: str = Field(default_factory=generate_id)
    project_id: str
    variation_id: Optional[str] = None
    format: ExportFormat
    status: str = "pending"
    download_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    completed_at: Optional[datetime] = None
