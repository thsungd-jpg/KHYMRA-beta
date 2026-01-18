import React, { useState } from 'react';
import { cn, formatRelativeTime } from '../../lib/utils';
import { MoreVertical, Copy, Trash2, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function ProjectNode({ 
  project, 
  x, 
  y, 
  onClick,
  onFork,
  onDelete 
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate orbit planets based on states count
  const statesCount = project.states?.length || 0;
  const variationsCount = project.variations?.length || 0;

  return (
    <div
      data-testid={`project-node-${project.id}`}
      className="project-node group"
      style={{ left: x, top: y }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer orbit ring */}
      <div 
        className={cn(
          'project-orbit transition-all duration-500',
          isHovered ? 'opacity-100' : 'opacity-40'
        )}
        style={{ width: 160, height: 160, top: -40, left: -40 }}
      />

      {/* Inner orbit ring */}
      <div 
        className={cn(
          'project-orbit transition-all duration-500',
          isHovered ? 'opacity-100' : 'opacity-30'
        )}
        style={{ width: 120, height: 120, top: -20, left: -20 }}
      />

      {/* Orbiting state indicators */}
      {statesCount > 0 && Array.from({ length: Math.min(statesCount, 5) }).map((_, i) => (
        <div
          key={i}
          className="orbit-planet"
          style={{
            animation: `orbit ${15 + i * 3}s linear infinite`,
            animationDelay: `${i * -3}s`,
            background: i === 0 ? '#10B981' : i === 1 ? '#3B82F6' : '#8B5CF6',
          }}
        />
      ))}

      {/* Main project core */}
      <button
        onClick={onClick}
        className={cn(
          'project-core',
          'transition-all duration-300',
          isHovered && 'scale-110'
        )}
      >
        {/* Glow effect */}
        <div className={cn(
          'absolute inset-0 rounded-full',
          'bg-gradient-to-br from-amber-400 to-amber-600',
          'opacity-0 transition-opacity duration-300',
          isHovered && 'opacity-30 blur-xl'
        )} />
      </button>

      {/* Project info */}
      <div className={cn(
        'mt-4 text-center transition-all duration-300',
        'transform',
        isHovered ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-1'
      )}>
        <h3 className="font-heading text-sm font-semibold text-foreground truncate max-w-[150px]">
          {project.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {statesCount} state{statesCount !== 1 ? 's' : ''} · {variationsCount} var{variationsCount !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          {formatRelativeTime(project.updated_at)}
        </p>
      </div>

      {/* Actions menu */}
      <div className={cn(
        'absolute top-0 right-0 transition-opacity duration-200',
        isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid={`project-menu-${project.id}`}
              className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white/70 hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass border-white/10">
            <DropdownMenuItem
              data-testid={`project-open-${project.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid={`project-fork-${project.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onFork();
              }}
              className="cursor-pointer"
            >
              <Copy className="w-4 h-4 mr-2" />
              Fork
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              data-testid={`project-delete-${project.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="cursor-pointer text-red-400 focus:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Ripple effect on click */}
      <div className="ripple-container absolute inset-0 pointer-events-none" />
    </div>
  );
}

export default ProjectNode;
