import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ProjectNode } from './ProjectNode';
import { CreateProjectDialog } from '../dialogs/CreateProjectDialog';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';

export function InfiniteCanvas({ 
  projects, 
  onProjectClick, 
  onCreateProject,
  onForkProject,
  onDeleteProject 
}) {
  const canvasRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Position projects in a spiral pattern from center
  const getProjectPositions = useCallback(() => {
    const positions = [];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const spacing = 300;
    const spiralFactor = 0.5;

    projects.forEach((project, index) => {
      const angle = index * 0.8;
      const radius = spacing * (1 + spiralFactor * angle);
      positions.push({
        project,
        x: centerX + radius * Math.cos(angle) - 50,
        y: centerY + radius * Math.sin(angle) - 50,
      });
    });

    return positions;
  }, [projects]);

  // Pan handling
  const handleMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-content')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      
      setTransform((prev) => {
        const newScale = Math.min(Math.max(prev.scale * delta, 0.3), 2);
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        return {
          x: x - (x - prev.x) * (newScale / prev.scale),
          y: y - (y - prev.y) * (newScale / prev.scale),
          scale: newScale,
        };
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const projectPositions = getProjectPositions();

  return (
    <>
      <div
        ref={canvasRef}
        data-testid="infinite-canvas"
        className={cn(
          'infinite-canvas',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid background */}
        <div 
          className="absolute inset-0 bg-grid opacity-50"
          style={{
            transform: `translate(${transform.x % 50}px, ${transform.y % 50}px)`,
          }}
        />

        {/* Nebula background effects */}
        <div className="absolute inset-0 bg-nebula pointer-events-none" />
        
        {/* Canvas content */}
        <div
          className="canvas-content"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {/* Project nodes */}
          {projectPositions.map(({ project, x, y }) => (
            <ProjectNode
              key={project.id}
              project={project}
              x={x}
              y={y}
              onClick={() => onProjectClick(project)}
              onFork={() => onForkProject(project)}
              onDelete={() => onDeleteProject(project.id)}
            />
          ))}

          {/* Empty state - Create first project */}
          {projects.length === 0 && (
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <div className="animate-pulse-glow w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center">
                <Plus className="w-12 h-12 text-amber-500/70" />
              </div>
              <h2 className="font-heading text-2xl text-foreground mb-2">
                Create Your First Universe
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Each project is a solar system. Begin your journey through the creative nebula.
              </p>
              <Button
                data-testid="create-first-project-btn"
                onClick={() => setShowCreateDialog(true)}
                className="h-12 px-8 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 transition-all duration-300 hover:shadow-glow-amber uppercase tracking-widest text-xs font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Genesis
              </Button>
            </div>
          )}
        </div>

        {/* Create button (when projects exist) */}
        {projects.length > 0 && (
          <Button
            data-testid="create-project-btn"
            onClick={() => setShowCreateDialog(true)}
            className="fixed top-8 right-8 z-50 h-12 px-6 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 transition-all duration-300 hover:shadow-glow-amber uppercase tracking-widest text-xs font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}

        {/* Zoom indicator */}
        <div className="fixed bottom-24 right-8 z-50 px-3 py-1.5 glass rounded-full text-xs text-muted-foreground font-mono">
          {Math.round(transform.scale * 100)}%
        </div>
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={onCreateProject}
      />
    </>
  );
}

export default InfiniteCanvas;
