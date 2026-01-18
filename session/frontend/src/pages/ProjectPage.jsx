import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageLayout, PageHeader, PageContent, Panel } from '../components/layout/PageLayout';
import { StateEditor } from '../components/editors/StateEditor';
import { VariationEditor } from '../components/editors/VariationEditor';
import { PreviewPortal } from '../components/preview/PreviewPortal';
import { ExportPanel } from '../components/export/ExportPanel';
import { ContinuitySettings } from '../components/settings/ContinuitySettings';
import { useProject } from '../hooks/useProjects';
import { Button } from '../components/ui/button';
import { cn, formatRelativeTime } from '../lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Layers,
  Sliders,
  Eye,
  Download,
  Settings,
  Trash2,
  Edit,
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react';

export function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    project, 
    loading, 
    updateProject,
    addState,
    updateState,
    deleteState,
    addVariation,
    deleteVariation
  } = useProject(projectId);

  const [activeTab, setActiveTab] = useState('states');
  const [editingState, setEditingState] = useState(null);
  const [editingVariation, setEditingVariation] = useState(null);
  const [isCreatingState, setIsCreatingState] = useState(false);
  const [isCreatingVariation, setIsCreatingVariation] = useState(false);

  // Determine active section from URL
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/states')) setActiveTab('states');
    else if (path.includes('/variations')) setActiveTab('variations');
    else if (path.includes('/preview')) setActiveTab('preview');
    else if (path.includes('/export')) setActiveTab('export');
    else if (path.includes('/settings')) setActiveTab('settings');
    else setActiveTab('states');
  }, [location]);

  const handleSaveState = async (stateData) => {
    try {
      if (editingState) {
        await updateState(editingState.id, stateData);
        toast.success('State updated');
      } else {
        await addState(stateData);
        toast.success('State created');
      }
      setEditingState(null);
      setIsCreatingState(false);
    } catch (error) {
      toast.error('Failed to save state');
    }
  };

  const handleDeleteState = async (stateId) => {
    try {
      await deleteState(stateId);
      toast.success('State deleted');
    } catch (error) {
      toast.error('Failed to delete state');
    }
  };

  const handleSaveVariation = async (variationData) => {
    try {
      await addVariation(variationData);
      toast.success('Variation created');
      setIsCreatingVariation(false);
      setEditingVariation(null);
    } catch (error) {
      toast.error('Failed to save variation');
    }
  };

  const handleDeleteVariation = async (variationId) => {
    try {
      await deleteVariation(variationId);
      toast.success('Variation deleted');
    } catch (error) {
      toast.error('Failed to delete variation');
    }
  };

  const handleSaveContinuity = async (data) => {
    await updateProject(data);
  };

  if (loading) {
    return (
      <PageLayout showNav={false}>
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </PageLayout>
    );
  }

  if (!project) {
    return (
      <PageLayout>
        <div className="h-screen flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button onClick={() => navigate('/')}>Return to Canvas</Button>
        </div>
      </PageLayout>
    );
  }

  // Editing state view
  if (editingState || isCreatingState) {
    return (
      <PageLayout projectId={projectId}>
        <PageContent>
          <StateEditor
            state={editingState}
            isNew={isCreatingState}
            onSave={handleSaveState}
            onCancel={() => {
              setEditingState(null);
              setIsCreatingState(false);
            }}
          />
        </PageContent>
      </PageLayout>
    );
  }

  // Editing variation view
  if (editingVariation || isCreatingVariation) {
    return (
      <PageLayout projectId={projectId}>
        <PageContent>
          <VariationEditor
            variation={editingVariation}
            states={project.states || []}
            isNew={isCreatingVariation}
            onSave={handleSaveVariation}
            onCancel={() => {
              setEditingVariation(null);
              setIsCreatingVariation(false);
            }}
          />
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout projectId={projectId}>
      <PageHeader
        title={project.name}
        subtitle={project.description || 'A digital atmosphere'}
        backButton={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        }
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Updated {formatRelativeTime(project.updated_at)}</span>
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="px-8 mb-6">
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 w-fit">
          {[
            { id: 'states', icon: Layers, label: 'States' },
            { id: 'variations', icon: Sliders, label: 'Variations' },
            { id: 'preview', icon: Eye, label: 'Preview' },
            { id: 'export', icon: Download, label: 'Export' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors',
                  activeTab === tab.id
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <PageContent>
        {/* States Tab */}
        {activeTab === 'states' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl text-foreground">Atmospheric States</h2>
                <p className="text-sm text-muted-foreground">
                  Each state is a complete experiential configuration
                </p>
              </div>
              <Button
                data-testid="add-state-btn"
                onClick={() => setIsCreatingState(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add State
              </Button>
            </div>

            {project.states?.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                <Sparkles className="w-12 h-12 text-amber-500/30 mx-auto mb-4" />
                <h3 className="font-heading text-lg text-foreground mb-2">No States Yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  States define the visual, audio, and tempo layers of your atmosphere
                </p>
                <Button
                  onClick={() => setIsCreatingState(true)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First State
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {project.states.map(state => (
                  <div
                    key={state.id}
                    data-testid={`state-card-${state.id}`}
                    className="state-card group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-foreground">{state.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {state.time_condition === 'always' ? 'Always available' : state.time_condition}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingState(state)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteState(state.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {state.mood_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {state.mood_tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded bg-white/[0.02]">
                        <span className="text-muted-foreground">Transition</span>
                        <p className="font-mono text-amber-500/70">{state.visual?.transition_type || 'crossfade'}</p>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02]">
                        <span className="text-muted-foreground">Pacing</span>
                        <p className="font-mono text-amber-500/70">{state.tempo?.transition_pacing_seconds || 14}s</p>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02]">
                        <span className="text-muted-foreground">Weight</span>
                        <p className="font-mono text-amber-500/70">{state.weight?.toFixed(1) || '1.0'}</p>
                      </div>
                    </div>

                    {state.is_ephemeral && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-500/70">
                        <Sparkles className="w-3 h-3" />
                        One-time experience
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Variations Tab */}
        {activeTab === 'variations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl text-foreground">Variations</h2>
                <p className="text-sm text-muted-foreground">
                  Behavioral mutations that create distinct experiences
                </p>
              </div>
              <Button
                data-testid="add-variation-btn"
                onClick={() => setIsCreatingVariation(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Variation
              </Button>
            </div>

            {project.variations?.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                <Sliders className="w-12 h-12 text-amber-500/30 mx-auto mb-4" />
                <h3 className="font-heading text-lg text-foreground mb-2">No Variations Yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Variations mutate the base PWA behavior to create distinct experiences
                </p>
                <Button
                  onClick={() => setIsCreatingVariation(true)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Variation
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {project.variations.map(variation => (
                  <div
                    key={variation.id}
                    data-testid={`variation-card-${variation.id}`}
                    className="state-card group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-foreground">{variation.name}</h3>
                        {variation.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {variation.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVariation(variation.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded bg-white/[0.02] text-center">
                        <span className="text-muted-foreground block mb-1">Mood</span>
                        <p className="font-mono text-emerald-400">{(variation.seed?.mood_bias || 0).toFixed(1)}</p>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] text-center">
                        <span className="text-muted-foreground block mb-1">Pace</span>
                        <p className="font-mono text-emerald-400">{(variation.seed?.pacing_bias || 0).toFixed(1)}</p>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] text-center">
                        <span className="text-muted-foreground block mb-1">Scarcity</span>
                        <p className="font-mono text-emerald-400">{(variation.seed?.scarcity_bias || 0).toFixed(1)}</p>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] text-center">
                        <span className="text-muted-foreground block mb-1">Entropy</span>
                        <p className="font-mono text-emerald-400">{(variation.seed?.entropy_bias || 0).toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="h-[calc(100vh-200px)] -mx-8 -mb-6">
            <PreviewPortal project={project} />
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <ExportPanel project={project} variations={project.variations || []} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <ContinuitySettings project={project} onSave={handleSaveContinuity} />
        )}
      </PageContent>
    </PageLayout>
  );
}

export default ProjectPage;
