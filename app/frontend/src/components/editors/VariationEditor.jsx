import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Panel } from '../layout/PageLayout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { BLEND_MODES } from '../../lib/utils';
import { 
  Dna, 
  Gauge, 
  Timer, 
  Waves, 
  Shuffle,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react';

export function VariationEditor({ 
  variation, 
  states = [],
  onSave, 
  onCancel,
  isNew = false 
}) {
  const [formData, setFormData] = useState({
    name: variation?.name || '',
    description: variation?.description || '',
    seed: {
      mood_bias: variation?.seed?.mood_bias || 0,
      pacing_bias: variation?.seed?.pacing_bias || 0,
      scarcity_bias: variation?.seed?.scarcity_bias || 0,
      entropy_bias: variation?.seed?.entropy_bias || 0,
    },
    state_weight_overrides: variation?.state_weight_overrides || {},
    transition_duration_modifier: variation?.transition_duration_modifier || 1.0,
    audio_spacing_modifier: variation?.audio_spacing_modifier || 1.0,
    blend_mode_sequence: variation?.blend_mode_sequence || [],
  });

  const updateSeed = (key, value) => {
    setFormData(prev => ({
      ...prev,
      seed: { ...prev.seed, [key]: value }
    }));
  };

  const toggleBlendMode = (mode) => {
    setFormData(prev => {
      const sequence = prev.blend_mode_sequence.includes(mode)
        ? prev.blend_mode_sequence.filter(m => m !== mode)
        : [...prev.blend_mode_sequence, mode];
      return { ...prev, blend_mode_sequence: sequence };
    });
  };

  const updateStateWeight = (stateId, weight) => {
    setFormData(prev => ({
      ...prev,
      state_weight_overrides: {
        ...prev.state_weight_overrides,
        [stateId]: weight
      }
    }));
  };

  const removeStateWeight = (stateId) => {
    setFormData(prev => {
      const { [stateId]: _, ...rest } = prev.state_weight_overrides;
      return { ...prev, state_weight_overrides: rest };
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  // Bias visualization helper
  const BiasSlider = ({ label, icon: Icon, value, onChange, leftLabel, rightLabel }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-amber-500" />
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-16">{leftLabel}</span>
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={-1}
          max={1}
          step={0.1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-16 text-right">{rightLabel}</span>
      </div>
      <div className="h-1 rounded-full bg-gradient-to-r from-blue-500 via-gray-500 to-amber-500 opacity-30" />
    </div>
  );

  return (
    <div className="space-y-6" data-testid="variation-editor">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {isNew ? 'Create Variation' : 'Edit Variation'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure behavioral mutations for this PWA variant
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            data-testid="save-variation-btn"
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Variation
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Panel title="Identity">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Variation Name
            </Label>
            <Input
              data-testid="variation-name-input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Nocturnal Drift"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="A slower, more contemplative variant..."
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>
      </Panel>

      {/* Variation Seeds - DNA Controls */}
      <Panel title="Variation DNA">
        <p className="text-sm text-muted-foreground mb-6">
          Adjust the genetic biases that will mutate the base PWA behavior
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <BiasSlider
            label="Mood Bias"
            icon={Waves}
            value={formData.seed.mood_bias}
            onChange={(v) => updateSeed('mood_bias', v)}
            leftLabel="Calm"
            rightLabel="Energetic"
          />
          <BiasSlider
            label="Pacing Bias"
            icon={Timer}
            value={formData.seed.pacing_bias}
            onChange={(v) => updateSeed('pacing_bias', v)}
            leftLabel="Slow"
            rightLabel="Fast"
          />
          <BiasSlider
            label="Scarcity Bias"
            icon={Shuffle}
            value={formData.seed.scarcity_bias}
            onChange={(v) => updateSeed('scarcity_bias', v)}
            leftLabel="Abundant"
            rightLabel="Rare"
          />
          <BiasSlider
            label="Entropy Bias"
            icon={Dna}
            value={formData.seed.entropy_bias}
            onChange={(v) => updateSeed('entropy_bias', v)}
            leftLabel="Ordered"
            rightLabel="Chaotic"
          />
        </div>
      </Panel>

      {/* Modifiers */}
      <Panel title="Behavioral Modifiers">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Transition Duration Modifier
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.transition_duration_modifier]}
                onValueChange={([v]) => setFormData(prev => ({ ...prev, transition_duration_modifier: v }))}
                min={0.5}
                max={2}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm font-mono text-muted-foreground w-12">
                {formData.transition_duration_modifier.toFixed(1)}x
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Multiplier applied to all transition durations
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Audio Spacing Modifier
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.audio_spacing_modifier]}
                onValueChange={([v]) => setFormData(prev => ({ ...prev, audio_spacing_modifier: v }))}
                min={0.5}
                max={2}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm font-mono text-muted-foreground w-12">
                {formData.audio_spacing_modifier.toFixed(1)}x
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Multiplier for spacing between audio tracks
            </p>
          </div>
        </div>
      </Panel>

      {/* Blend Mode Sequence */}
      <Panel title="Blend Mode Chromosome">
        <p className="text-sm text-muted-foreground mb-4">
          Select blend modes to include in the variation's visual DNA
        </p>
        <div className="flex flex-wrap gap-2">
          {BLEND_MODES.map(mode => (
            <button
              key={mode.value}
              onClick={() => toggleBlendMode(mode.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                formData.blend_mode_sequence.includes(mode.value)
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-white/5 text-muted-foreground border border-white/10 hover:border-white/20'
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
        {formData.blend_mode_sequence.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs text-muted-foreground mb-2">Sequence Order:</p>
            <div className="flex flex-wrap gap-1">
              {formData.blend_mode_sequence.map((mode, i) => (
                <span key={i} className="text-xs font-mono text-emerald-400">
                  {mode}{i < formData.blend_mode_sequence.length - 1 && ' → '}
                </span>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {/* State Weight Overrides */}
      {states.length > 0 && (
        <Panel title="State Weight Overrides">
          <p className="text-sm text-muted-foreground mb-4">
            Override the selection weight for specific states in this variation
          </p>
          <div className="space-y-3">
            {states.map(state => {
              const hasOverride = formData.state_weight_overrides.hasOwnProperty(state.id);
              const weight = formData.state_weight_overrides[state.id] ?? state.weight;
              
              return (
                <div 
                  key={state.id}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-lg transition-colors',
                    hasOverride ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-white/[0.02] border border-white/5'
                  )}
                >
                  <span className="text-sm flex-1">{state.name}</span>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[weight]}
                      onValueChange={([v]) => updateStateWeight(state.id, v)}
                      min={0.1}
                      max={10}
                      step={0.1}
                      className="w-32"
                    />
                    <span className="text-sm font-mono text-muted-foreground w-10">
                      {weight.toFixed(1)}
                    </span>
                    {hasOverride && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStateWeight(state.id)}
                        className="text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}

export default VariationEditor;
