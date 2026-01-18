import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  Compass,
  Layers,
  Sliders,
  Eye,
  Download,
  Settings,
  Home,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const navItems = [
  { id: 'home', icon: Home, label: 'Canvas', path: '/' },
  { id: 'states', icon: Layers, label: 'States', path: '/states' },
  { id: 'variations', icon: Sliders, label: 'Variations', path: '/variations' },
  { id: 'preview', icon: Eye, label: 'Preview', path: '/preview' },
  { id: 'export', icon: Download, label: 'Export', path: '/export' },
];

export function Navigation({ projectId }) {
  const [visible, setVisible] = useState(false);
  const [lastMove, setLastMove] = useState(Date.now());
  const location = useLocation();
  const navigate = useNavigate();

  // Show nav on mouse movement, hide after inactivity
  useEffect(() => {
    let timeout;
    
    const handleMove = () => {
      setLastMove(Date.now());
      setVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setVisible(false), 3000);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchstart', handleMove);

    // Initial show
    setVisible(true);
    timeout = setTimeout(() => setVisible(false), 3000);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchstart', handleMove);
      clearTimeout(timeout);
    };
  }, []);

  const handleNavigate = (path) => {
    if (projectId && path !== '/') {
      navigate(`/project/${projectId}${path}`);
    } else {
      navigate(path);
    }
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.includes(path);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        data-testid="hud-navigation"
        className={cn(
          'fixed bottom-8 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-2 px-4 py-3',
          'glass rounded-full',
          'transition-all duration-500 ease-out',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          // Only show project-specific routes if we have a project
          if (item.path !== '/' && !projectId) {
            return null;
          }

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  data-testid={`nav-${item.id}`}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    'relative flex items-center justify-center',
                    'w-10 h-10 rounded-full',
                    'transition-all duration-300',
                    active
                      ? 'text-amber-500 bg-amber-500/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-chimera-surface border-white/10">
                <p className="text-xs font-medium">{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Settings - Event Horizon button */}
        <div className="w-px h-6 bg-white/10 mx-1" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              data-testid="nav-settings"
              onClick={() => navigate('/settings')}
              className={cn(
                'relative flex items-center justify-center',
                'w-10 h-10 rounded-full',
                'transition-all duration-300',
                'text-muted-foreground hover:text-amber-500',
                'group'
              )}
            >
              <div className="absolute inset-0 rounded-full border border-amber-500/20 group-hover:border-amber-500/50 transition-colors">
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-[-2px] rounded-full bg-gradient-conic from-transparent via-amber-500/30 to-transparent animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
              <Settings className="w-4 h-4 relative z-10" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-chimera-surface border-white/10">
            <p className="text-xs font-medium">Settings</p>
          </TooltipContent>
        </Tooltip>
      </nav>
    </TooltipProvider>
  );
}

export default Navigation;
