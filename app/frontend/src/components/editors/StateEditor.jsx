import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Panel } from '../layout/PageLayout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BLEND_MODES, 
  TRANSITION_TYPES, 
  TIME_CONDITIONS, 
  PLAYLIST_MODES,
  DAYS_OF_WEEK,
  formatDuration 
} from '../../lib/utils';
import { 
  Image, 
  Music, 
  Clock, 
  Sparkles,
  Eye,
  Volume2,
  Sun,
  Moon,
  Save,
  X 
} from 'lucide-react';

export function StateEditor({ 
  state, 
  onSave, 
  onCancel,
  isNew = false 
}) {
  const [formData, setFormData] = useState({
    name: state?.name || '',
    description: state?.description || '',
    mood_tags: state?.mood_tags || [],
    weight: state?.weight || 1.0,
    time_condition: state?.time_condition || 'always',
    specific_days: state?.specific_days || [],
    absence_hours_required: state?.absence_hours_required || 72,
    is_ephemeral: state?.is_ephemeral || false,
    visual: {
      background_stack: state?.visual?.background_stack || [],
      blend_modes: state?.visual?.blend_modes || ['normal'],
      transition_type: state?.visual?.transition_type || 'crossfade',
      transition_duration_ms: state?.visual?.transition_duration_ms || 2000,
      max_entropy: state?.visual?.max_entropy || 0.7,
      night_reduction_factor: state?.visual?.night_reduction_factor || 0.5,
      opacity: state?.visual?.opacity || 1.0,
      tint_color: state?.visual?.tint_color || null,
      tint_opacity: state?.visual?.tint_opacity || 0,
    },
    audio: {
      playlist: state?.audio?.playlist || [],
      playlist_mode: state?.audio?.playlist_mode || 'weighted-random',
      initial_volume: state?.audio?.initial_volume || 0.7,
      crossfade_duration_ms: state?.audio?.crossfade_duration_ms || 3000,
      adaptive_softening: state?.audio?.adaptive_softening ?? true,
      session_fade_threshold_minutes: state?.audio?.session_fade_threshold_minutes || 30,
    },
    tempo: {
      transition_pacing_seconds: state?.tempo?.transition_pacing_seconds || 14,
      time_of_day_modifier: state?.tempo?.time_of_day_modifier ?? true,
      session_length_modifier: state?.tempo?.session_length_modifier ?? true,
      device_type_modifier: state?.tempo?.device_type_modifier ?? true,
      night_pacing_multiplier: state?.tempo?.night_pacing_multiplier || 1.5,
      long_session_multiplier: state?.tempo?.long_session_multiplier || 1.3,
    },
  });

  const [newTag, setNewTag] = useState('');

  const updateVisual = (key, value) => {
    setFormData(prev => ({
      ...prev,
      visual: { ...prev.visual, [key]: value }
    }));
  };

  const updateAudio = (key, value) => {
    setFormData(prev => ({
      ...prev,
      audio: { ...prev.audio, [key]: value }
    }));
  };

  const updateTempo = (key, value) => {
    setFormData(prev => ({
      ...prev,
      tempo: { ...prev.tempo, [key]: value }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.mood_tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        mood_tags: [...prev.mood_tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      mood_tags: prev.mood_tags.filter(t => t !== tag)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <div className="space-y-6" data-testid="state-editor">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {isNew ? 'Create State' : 'Edit State'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the experiential parameters for this atmospheric state
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            data-testid="save-state-btn"
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50"
          >
            <Save className="w-4 h-4 mr-2" />
            Save State
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Panel title="Identity">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              State Name
            </Label>
            <Input
              data-testid="state-name-input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Serene Evening"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Weight (Selection Probability)
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                data-testid="state-weight-slider"
                value={[formData.weight]}
                onValueChange={([v]) => setFormData(prev => ({ ...prev, weight: v }))}
                min={0.1}
                max={10}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm font-mono text-muted-foreground w-12">
                {formData.weight.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Description
          </Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="A calm atmosphere for..."
            className="bg-white/5 border-white/10"
          />
        </div>

        <div className="mt-4 space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Mood Tags
          </Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.mood_tags.map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs flex items-center gap-1"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-amber-300">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag..."
              className="bg-white/5 border-white/10 flex-1"
            />
            <Button variant="outline" onClick={addTag} size="sm">Add</Button>
          </div>
        </div>
      </Panel>

      {/* Configuration Tabs */}
      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="glass border-white/10 w-full justify-start">
          <TabsTrigger value="visual" className="data-[state=active]:text-amber-500">
            <Image className="w-4 h-4 mr-2" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="audio" className="data-[state=active]:text-amber-500">
            <Music className="w-4 h-4 mr-2" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="tempo" className="data-[state=active]:text-amber-500">
            <Clock className="w-4 h-4 mr-2" />
            Tempo
          </TabsTrigger>
          <TabsTrigger value="scarcity" className="data-[state=active]:text-amber-500">
            <Sparkles className="w-4 h-4 mr-2" />
            Scarcity
          </TabsTrigger>
        </TabsList>

        {/* Visual Tab */}
        <TabsContent value="visual" className="mt-4">
          <Panel title="Visual Layer">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Transition Type
                  </Label>
                  <Select
                    value={formData.visual.transition_type}
                    onValueChange={(v) => updateVisual('transition_type', v)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSITION_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Transition Duration
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.visual.transition_duration_ms]}
                      onValueChange={([v]) => updateVisual('transition_duration_ms', v)}
                      min={100}
                      max={10000}
                      step={100}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono text-muted-foreground w-16">
                      {formatDuration(formData.visual.transition_duration_ms)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Max Entropy
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.visual.max_entropy]}
                      onValueChange={([v]) => updateVisual('max_entropy', v)}
                      min={0}
                      max={1}
                      step={0.05}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono text-muted-foreground w-12">
                      {(formData.visual.max_entropy * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Opacity
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.visual.opacity]}
                      onValueChange={([v]) => updateVisual('opacity', v)}
                      min={0}
                      max={1}
                      step={0.05}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono text-muted-foreground w-12">
                      {(formData.visual.opacity * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Night Mode Reduction
                </Label>
                <div className="flex items-center gap-4">
                  <Moon className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[formData.visual.night_reduction_factor]}
                    onValueChange={([v]) => updateVisual('night_reduction_factor', v)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-muted-foreground w-12">
                    {(formData.visual.night_reduction_factor * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* Audio Tab */}
        <TabsContent value="audio" className="mt-4">
          <Panel title="Audio Layer">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Playlist Mode
                  </Label>
                  <Select
                    value={formData.audio.playlist_mode}
                    onValueChange={(v) => updateAudio('playlist_mode', v)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAYLIST_MODES.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Initial Volume
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.audio.initial_volume]}
                      onValueChange={([v]) => updateAudio('initial_volume', v)}
                      min={0}
                      max={1}
                      step={0.05}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono text-muted-foreground w-12">
                      {(formData.audio.initial_volume * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Crossfade Duration
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[formData.audio.crossfade_duration_ms]}
                    onValueChange={([v]) => updateAudio('crossfade_duration_ms', v)}
                    min={0}
                    max={10000}
                    step={500}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-muted-foreground w-16">
                    {formatDuration(formData.audio.crossfade_duration_ms)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <p className="font-medium text-sm">Adaptive Softening</p>
                  <p className="text-xs text-muted-foreground">Gradually reduce volume during long sessions</p>
                </div>
                <Switch
                  checked={formData.audio.adaptive_softening}
                  onCheckedChange={(v) => updateAudio('adaptive_softening', v)}
                />
              </div>

              {formData.audio.adaptive_softening && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Fade Threshold (minutes)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.audio.session_fade_threshold_minutes]}
                      onValueChange={([v]) => updateAudio('session_fade_threshold_minutes', v)}
                      min={5}
                      max={120}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono text-muted-foreground w-16">
                      {formData.audio.session_fade_threshold_minutes}m
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </TabsContent>

        {/* Tempo Tab */}
        <TabsContent value="tempo" className="mt-4">
          <Panel title="Tempo Rules">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Base Transition Pacing (seconds)
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[formData.tempo.transition_pacing_seconds]}
                    onValueChange={([v]) => updateTempo('transition_pacing_seconds', v)}
                    min={1}
                    max={300}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-muted-foreground w-16">
                    {formData.tempo.transition_pacing_seconds}s
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="font-medium text-sm">Time of Day Modifier</p>
                      <p className="text-xs text-muted-foreground">Adjust pacing based on local time</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.tempo.time_of_day_modifier}
                    onCheckedChange={(v) => updateTempo('time_of_day_modifier', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="font-medium text-sm">Session Length Modifier</p>
                      <p className="text-xs text-muted-foreground">Slow down during long sessions</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.tempo.session_length_modifier}
                    onCheckedChange={(v) => updateTempo('session_length_modifier', v)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Night Pacing Multiplier
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.tempo.night_pacing_multiplier]}
                      onValueChange={([v]) => updateTempo('night_pacing_multiplier', v)}
                      min={1}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono text-muted-foreground w-12">
                      {formData.tempo.night_pacing_multiplier.toFixed(1)}x
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Long Session Multiplier
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.tempo.long_session_multiplier]}
                      onValueChange={([v]) => updateTempo('long_session_multiplier', v)}
                      min={1}
                      max={2}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono text-muted-foreground w-12">
                      {formData.tempo.long_session_multiplier.toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* Scarcity Tab */}
        <TabsContent value="scarcity" className="mt-4">
          <Panel title="Temporal Scarcity">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Availability Condition
                </Label>
                <Select
                  value={formData.time_condition}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, time_condition: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_CONDITIONS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.time_condition === 'specific-days' && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Available Days
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        onClick={() => {
                          const days = formData.specific_days.includes(day.value)
                            ? formData.specific_days.filter(d => d !== day.value)
                            : [...formData.specific_days, day.value];
                          setFormData(prev => ({ ...prev, specific_days: days }));
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                          formData.specific_days.includes(day.value)
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50'
                            : 'bg-white/5 text-muted-foreground border border-white/10 hover:border-white/20'
                        )}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.time_condition === 'post-absence' && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Required Absence (hours)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.absence_hours_required]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, absence_hours_required: v }))}
                      min={1}
                      max={720}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono text-muted-foreground w-16">
                      {formData.absence_hours_required}h
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <p className="font-medium text-sm text-amber-500">Ephemeral State</p>
                  <p className="text-xs text-muted-foreground">This state can only be experienced once, ever</p>
                </div>
                <Switch
                  checked={formData.is_ephemeral}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_ephemeral: v }))}
                />
              </div>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StateEditor;
