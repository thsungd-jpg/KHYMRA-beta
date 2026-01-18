import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Panel } from '../layout/PageLayout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { 
  Brain, 
  Clock, 
  Moon, 
  Sun, 
  Timer,
  Ghost,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

export function ContinuitySettings({ project, onSave }) {
  const [continuity, setContinuity] = useState(project?.continuity || {
    remember_last_state: true,
    remember_audio_position: true,
    remember_visual_progress: true,
    remember_session_duration: true,
    session_ghost_enabled: true,
    session_ghost_duration_ms: 3000,
    time_aware_adaptation: true,
    night_mode_enabled: true,
    night_start_hour: 22,
    night_end_hour: 6,
    long_session_adaptation: true,
    long_session_threshold_minutes: 45,
    fatigue_desaturation_percent: 0.02,
  });

  const [cognitiveZero, setCognitiveZero] = useState(project?.cognitive_zero || {
    enabled: true,
    min_duration_minutes: 20,
    max_duration_minutes: 60,
    auto_advance_interval_seconds: 120,
    nav_auto_hide_delay_ms: 300000,
    session_arc_enabled: true,
    opening_intensity: 0.8,
    middle_intensity: 0.5,
    closing_intensity: 0.3,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ continuity, cognitive_zero: cognitiveZero });
      toast.success('Continuity settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="continuity-settings">
      {/* Memory Settings */}
      <Panel title="Persistent Memory" actions={
        <Brain className="w-4 h-4 text-amber-500/50" />
      }>
        <p className="text-sm text-muted-foreground mb-6">
          Configure what the PWA remembers between sessions. Re-entry should feel like "returning," not "reloading."
        </p>

        <div className="space-y-3">
          {[
            { key: 'remember_last_state', label: 'Remember Last State', desc: 'Return to the same atmospheric state' },
            { key: 'remember_audio_position', label: 'Remember Audio Position', desc: 'Resume audio from where it stopped' },
            { key: 'remember_visual_progress', label: 'Remember Visual Progress', desc: 'Restore transition progress' },
            { key: 'remember_session_duration', label: 'Track Session Duration', desc: 'Accumulate time for adaptation' },
          ].map(item => (
            <div 
              key={item.key}
              className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5"
            >
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={continuity[item.key]}
                onCheckedChange={(v) => setContinuity(prev => ({ ...prev, [item.key]: v }))}
              />
            </div>
          ))}
        </div>

        {/* Session Ghost */}
        <div className="mt-6 p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Ghost className="w-4 h-4 text-amber-500" />
              <div>
                <p className="font-medium text-sm">Session Ghost</p>
                <p className="text-xs text-muted-foreground">Show phantom preview of previous state on return</p>
              </div>
            </div>
            <Switch
              checked={continuity.session_ghost_enabled}
              onCheckedChange={(v) => setContinuity(prev => ({ ...prev, session_ghost_enabled: v }))}
            />
          </div>
          {continuity.session_ghost_enabled && (
            <div className="space-y-2 pl-7">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Ghost Duration
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[continuity.session_ghost_duration_ms]}
                  onValueChange={([v]) => setContinuity(prev => ({ ...prev, session_ghost_duration_ms: v }))}
                  min={1000}
                  max={10000}
                  step={500}
                  className="flex-1"
                />
                <span className="text-sm font-mono text-muted-foreground w-14">
                  {(continuity.session_ghost_duration_ms / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Time-Aware Adaptation */}
      <Panel title="Time-Aware Adaptation" actions={
        <Clock className="w-4 h-4 text-amber-500/50" />
      }>
        <p className="text-sm text-muted-foreground mb-6">
          Automatically adjust the atmosphere based on time of day and session length.
        </p>

        <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5 mb-4">
          <div>
            <p className="font-medium text-sm">Enable Time Adaptation</p>
            <p className="text-xs text-muted-foreground">Adjust behavior based on local time</p>
          </div>
          <Switch
            checked={continuity.time_aware_adaptation}
            onCheckedChange={(v) => setContinuity(prev => ({ ...prev, time_aware_adaptation: v }))}
          />
        </div>

        {continuity.time_aware_adaptation && (
          <>
            {/* Night Mode */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="font-medium text-sm">Night Mode</p>
                    <p className="text-xs text-muted-foreground">Softer visuals and slower pacing at night</p>
                  </div>
                </div>
                <Switch
                  checked={continuity.night_mode_enabled}
                  onCheckedChange={(v) => setContinuity(prev => ({ ...prev, night_mode_enabled: v }))}
                />
              </div>
              {continuity.night_mode_enabled && (
                <div className="grid gap-4 md:grid-cols-2 pl-7">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Moon className="w-3 h-3" /> Night Starts
                    </Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[continuity.night_start_hour]}
                        onValueChange={([v]) => setContinuity(prev => ({ ...prev, night_start_hour: v }))}
                        min={18}
                        max={23}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono text-muted-foreground w-12">
                        {continuity.night_start_hour}:00
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Sun className="w-3 h-3" /> Night Ends
                    </Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[continuity.night_end_hour]}
                        onValueChange={([v]) => setContinuity(prev => ({ ...prev, night_end_hour: v }))}
                        min={4}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono text-muted-foreground w-12">
                        {continuity.night_end_hour}:00
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Long Session Adaptation */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Timer className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-medium text-sm">Session Fatigue Detection</p>
                    <p className="text-xs text-muted-foreground">Gradually reduce intensity during long sessions</p>
                  </div>
                </div>
                <Switch
                  checked={continuity.long_session_adaptation}
                  onCheckedChange={(v) => setContinuity(prev => ({ ...prev, long_session_adaptation: v }))}
                />
              </div>
              {continuity.long_session_adaptation && (
                <div className="grid gap-4 md:grid-cols-2 pl-7">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Threshold (minutes)
                    </Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[continuity.long_session_threshold_minutes]}
                        onValueChange={([v]) => setContinuity(prev => ({ ...prev, long_session_threshold_minutes: v }))}
                        min={15}
                        max={180}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono text-muted-foreground w-14">
                        {continuity.long_session_threshold_minutes}m
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Desaturation Amount
                    </Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[continuity.fatigue_desaturation_percent * 100]}
                        onValueChange={([v]) => setContinuity(prev => ({ ...prev, fatigue_desaturation_percent: v / 100 }))}
                        min={0}
                        max={10}
                        step={0.5}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono text-muted-foreground w-12">
                        {(continuity.fatigue_desaturation_percent * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Panel>

      {/* Cognitive Zero Mode */}
      <Panel title="Cognitive Zero Mode" actions={
        <span className="text-xs font-mono text-amber-500/50">LET IT RUN</span>
      }>
        <p className="text-sm text-muted-foreground mb-6">
          Configure autonomous operation mode - the system self-directs for extended periods without interaction.
        </p>

        <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-4">
          <div>
            <p className="font-medium text-sm text-amber-500">Enable Cognitive Zero</p>
            <p className="text-xs text-muted-foreground">Allow 20-60 minutes of autonomous operation</p>
          </div>
          <Switch
            checked={cognitiveZero.enabled}
            onCheckedChange={(v) => setCognitiveZero(prev => ({ ...prev, enabled: v }))}
          />
        </div>

        {cognitiveZero.enabled && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Min Duration (minutes)
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[cognitiveZero.min_duration_minutes]}
                    onValueChange={([v]) => setCognitiveZero(prev => ({ ...prev, min_duration_minutes: v }))}
                    min={5}
                    max={60}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-muted-foreground w-12">
                    {cognitiveZero.min_duration_minutes}m
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Max Duration (minutes)
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[cognitiveZero.max_duration_minutes]}
                    onValueChange={([v]) => setCognitiveZero(prev => ({ ...prev, max_duration_minutes: v }))}
                    min={20}
                    max={180}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-muted-foreground w-12">
                    {cognitiveZero.max_duration_minutes}m
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Auto-Advance Interval (seconds)
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[cognitiveZero.auto_advance_interval_seconds]}
                  onValueChange={([v]) => setCognitiveZero(prev => ({ ...prev, auto_advance_interval_seconds: v }))}
                  min={30}
                  max={600}
                  step={30}
                  className="flex-1"
                />
                <span className="text-sm font-mono text-muted-foreground w-14">
                  {cognitiveZero.auto_advance_interval_seconds}s
                </span>
              </div>
            </div>

            {/* Session Arc */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-sm">Session Arc</p>
                  <p className="text-xs text-muted-foreground">Create beginning → middle → end intensity curve</p>
                </div>
                <Switch
                  checked={cognitiveZero.session_arc_enabled}
                  onCheckedChange={(v) => setCognitiveZero(prev => ({ ...prev, session_arc_enabled: v }))}
                />
              </div>
              {cognitiveZero.session_arc_enabled && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Opening</Label>
                    <Slider
                      value={[cognitiveZero.opening_intensity]}
                      onValueChange={([v]) => setCognitiveZero(prev => ({ ...prev, opening_intensity: v }))}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <span className="text-xs font-mono text-amber-500/70">
                      {(cognitiveZero.opening_intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Middle</Label>
                    <Slider
                      value={[cognitiveZero.middle_intensity]}
                      onValueChange={([v]) => setCognitiveZero(prev => ({ ...prev, middle_intensity: v }))}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <span className="text-xs font-mono text-amber-500/70">
                      {(cognitiveZero.middle_intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Closing</Label>
                    <Slider
                      value={[cognitiveZero.closing_intensity]}
                      onValueChange={([v]) => setCognitiveZero(prev => ({ ...prev, closing_intensity: v }))}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <span className="text-xs font-mono text-amber-500/70">
                      {(cognitiveZero.closing_intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Panel>

      {/* Save Button */}
      <Button
        data-testid="save-continuity-btn"
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 uppercase tracking-widest text-xs font-bold"
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Saving...' : 'Save Continuity Settings'}
      </Button>
    </div>
  );
}

export default ContinuitySettings;
