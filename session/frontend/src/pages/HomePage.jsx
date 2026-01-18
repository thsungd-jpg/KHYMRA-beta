import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { InfiniteCanvas } from '../components/canvas/InfiniteCanvas';
import { useProjects, useTemplates } from '../hooks/useProjects';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const { projects, loading, createProject, deleteProject, forkProject } = useProjects();
  const { templates, seedBaseTemplate } = useTemplates();

  const handleProjectClick = (project) => {
    navigate(`/project/${project.id}`);
  };

  const handleCreateProject = async (data) => {
    try {
      // If forking from template and no templates exist, seed the base first
      if (data.fork_from_id === undefined && templates.length === 0) {
        await seedBaseTemplate();
      }
      
      const project = await createProject(data);
      toast.success(`Project "${project.name}" created!`);
      navigate(`/project/${project.id}`);
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const handleForkProject = async (project) => {
    const name = `${project.name} (Fork)`;
    try {
      const forked = await forkProject(project.id, name);
      toast.success(`Forked "${project.name}"!`);
      navigate(`/project/${forked.id}`);
    } catch (error) {
      toast.error('Failed to fork project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProject(projectId);
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <PageLayout showNav={false} fullScreen>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your universes...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullScreen>
      <InfiniteCanvas
        projects={projects}
        onProjectClick={handleProjectClick}
        onCreateProject={handleCreateProject}
        onForkProject={handleForkProject}
        onDeleteProject={handleDeleteProject}
      />
    </PageLayout>
  );
}

export default HomePage;
