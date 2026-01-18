import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Play, 
  Pause, 
  RotateCcw,
  Maximize2,
  Clock,
  Sun,
  Moon
} from 'lucide-react';

const devices = [
  { id: 'desktop', icon: Monitor, label: 'Desktop', width: '100%', aspect: '16/10' },
  { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px', aspect: '4/3' },
  { id: 'phone', icon: Smartphone, label: 'Phone', width: '375px', aspect: '9/16' },
];

export function PreviewPortal({ project, selectedVariation }) {
  const [device, setDevice] = useState('desktop');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [simulatedTime, setSimulatedTime] = useState(12); // 24-hour format
  const [sessionLength, setSessionLength] = useState(0); // minutes

  const states = project?.states || [];
  const currentState = states[currentStateIndex];
  const selectedDevice = devices.find(d => d.id === device);

  // Simulate state cycling when playing
  useEffect(() => {
    if (!isPlaying || states.length === 0) return;

    const interval = setInterval(() => {
      setCurrentStateIndex(prev => (prev + 1) % states.length);
      setSessionLength(prev => prev + 1);
    }, 5000); // Cycle every 5 seconds in preview

    return () => clearInterval(interval);
  }, [isPlaying, states.length]);

  const isNightTime = simulatedTime >= 22 || simulatedTime < 6;

  return (
    <div className="h-full flex flex-col" data-testid="preview-portal">
      {/* Controls Bar */}
      <div className="flex items-center justify-between p-4 glass border-b border-white/5">
        <div className="flex items-center gap-4">
          {/* Device Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
            {devices.map(d => {
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  data-testid={`device-${d.id}`}
                  onClick={() => setDevice(d.id)}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    device === d.id
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              data-testid="preview-play-pause"
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-muted-foreground hover:text-amber-500"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentStateIndex(0);
                setSessionLength(0);
                setIsPlaying(false);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* State Selector */}
          {states.length > 0 && (
            <Select
              value={currentStateIndex.toString()}
              onValueChange={(v) => setCurrentStateIndex(parseInt(v))}
            >
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state, i) => (
                  <SelectItem key={state.id} value={i.toString()}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Time Simulator */}
          <div className="flex items-center gap-3">
            {isNightTime ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <Slider
              value={[simulatedTime]}
              onValueChange={([v]) => setSimulatedTime(v)}
              min={0}
              max={23}
              step={1}
              className="w-24"
            />
            <span className="text-xs font-mono text-muted-foreground w-12">
              {simulatedTime.toString().padStart(2, '0')}:00
            </span>
          </div>

          {/* Session Length */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{sessionLength}m</span>
          </div>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0a0a]">
        <div
          className={cn(
            'preview-frame relative overflow-hidden transition-all duration-300',
            device === 'phone' && 'rounded-[2rem]',
            device === 'tablet' && 'rounded-xl',
            device === 'desktop' && 'rounded-lg'
          )}
          style={{
            width: selectedDevice.width,
            maxWidth: '100%',
            aspectRatio: selectedDevice.aspect,
          }}
        >
          {/* Device Frame Border */}
          <div className="absolute inset-0 border-2 border-white/10 rounded-inherit pointer-events-none z-10" />

          {/* Preview Content */}
          {states.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-chimera-dark">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Play className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Add states to preview your atmosphere
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-chimera-dark">
              {/* Background Layer */}
              <div 
                className={cn(
                  'absolute inset-0 transition-all duration-1000',
                  isNightTime && 'opacity-70'
                )}
                style={{
                  background: `radial-gradient(ellipse at center, 
                    rgba(245, 158, 11, ${currentState?.visual?.opacity * 0.2 || 0.2}) 0%, 
                    transparent 70%)`,
                }}
              />

              {/* State Info Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-amber-500/70 uppercase tracking-wider mb-1">
                      Current State
                    </p>
                    <h3 className="font-heading text-xl text-foreground">
                      {currentState?.name || 'Unknown'}
                    </h3>
                    {currentState?.mood_tags?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {currentState.mood_tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Visual Config Preview */}
                  <div className="text-right text-xs text-white/40">
                    <p>Transition: {currentState?.visual?.transition_type || 'crossfade'}</p>
                    <p>Entropy: {((currentState?.visual?.max_entropy || 0.7) * 100).toFixed(0)}%</p>
                    <p>Pacing: {currentState?.tempo?.transition_pacing_seconds || 14}s</p>
                  </div>
                </div>
              </div>

              {/* Playing Indicator */}
              {isPlaying && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white/60">Live</span>
                </div>
              )}

              {/* Night Mode Indicator */}
              {isNightTime && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-xs">
                  <Moon className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-300">Night Mode</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 glass border-t border-white/5">
        <div className="timeline-track">
          {states.map((state, i) => {
            const width = 100 / states.length;
            return (
              <div
                key={state.id}
                className={cn(
                  'timeline-segment',
                  i === currentStateIndex && 'bg-amber-500/50 border-amber-500'
                )}
                style={{
                  left: `${i * width}%`,
                  width: `${width - 1}%`,
                }}
                onClick={() => setCurrentStateIndex(i)}
              >
                <span className="absolute inset-0 flex items-center justify-center text-xs text-white/60 truncate px-2">
                  {state.name}
                </span>
              </div>
            );
          })}
          {/* Playhead */}
          {states.length > 0 && (
            <div 
              className="timeline-playhead"
              style={{
                left: `${(currentStateIndex / states.length) * 100 + (50 / states.length)}%`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewPortal;
