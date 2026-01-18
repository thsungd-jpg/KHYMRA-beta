import React from 'react';
import { cn } from '../../lib/utils';
import Navigation from './Navigation';

export function PageLayout({ 
  children, 
  projectId,
  className,
  showNav = true,
  fullScreen = false 
}) {
  return (
    <div 
      className={cn(
        'min-h-screen bg-chimera-dark',
        'bg-nebula bg-grid noise-overlay',
        className
      )}
    >
      <div className={cn(
        fullScreen ? 'h-screen' : 'min-h-screen',
        'relative z-10'
      )}>
        {children}
      </div>
      
      {showNav && <Navigation projectId={projectId} />}
    </div>
  );
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions,
  backButton 
}) {
  return (
    <header className="px-8 pt-8 pb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {backButton}
          <div>
            <h1 
              className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground"
              data-testid="page-title"
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export function PageContent({ children, className }) {
  return (
    <main className={cn('px-8 py-6', className)}>
      {children}
    </main>
  );
}

export function Panel({ 
  title, 
  children, 
  actions,
  className,
  collapsible = false,
  defaultCollapsed = false 
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <div className={cn('chimera-panel', className)}>
      <div className="panel-header">
        <div className="flex items-center gap-3">
          {collapsible && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className={cn(
                  'w-4 h-4 transition-transform',
                  collapsed ? '-rotate-90' : 'rotate-0'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <span className="panel-title">{title}</span>
        </div>
        {actions}
      </div>
      {!collapsed && (
        <div className="panel-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default PageLayout;
