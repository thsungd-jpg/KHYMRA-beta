import { useState, useEffect, useCallback } from 'react';
import { projectsApi, statesApi, variationsApi, templatesApi } from '../lib/api';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectsApi.list();
      setProjects(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data) => {
    const response = await projectsApi.create(data);
    setProjects((prev) => [response.data, ...prev]);
    return response.data;
  };

  const updateProject = async (id, data) => {
    const response = await projectsApi.update(id, data);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? response.data : p))
    );
    return response.data;
  };

  const deleteProject = async (id) => {
    await projectsApi.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const forkProject = async (sourceId, name) => {
    const response = await projectsApi.fork(sourceId, name);
    setProjects((prev) => [response.data, ...prev]);
    return response.data;
  };

  return {
    projects,
    loading,
    error,
    refresh: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    forkProject,
  };
}

export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await projectsApi.get(projectId);
      setProject(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateProject = async (data) => {
    const response = await projectsApi.update(projectId, data);
    setProject(response.data);
    return response.data;
  };

  // States
  const addState = async (stateData) => {
    const response = await statesApi.create(projectId, stateData);
    setProject((prev) => ({
      ...prev,
      states: [...(prev?.states || []), response.data],
    }));
    return response.data;
  };

  const updateState = async (stateId, stateData) => {
    const response = await statesApi.update(projectId, stateId, stateData);
    setProject((prev) => ({
      ...prev,
      states: prev?.states?.map((s) => (s.id === stateId ? response.data : s)) || [],
    }));
    return response.data;
  };

  const deleteState = async (stateId) => {
    await statesApi.delete(projectId, stateId);
    setProject((prev) => ({
      ...prev,
      states: prev?.states?.filter((s) => s.id !== stateId) || [],
    }));
  };

  // Variations
  const addVariation = async (variationData) => {
    const response = await variationsApi.create(projectId, variationData);
    setProject((prev) => ({
      ...prev,
      variations: [...(prev?.variations || []), response.data],
    }));
    return response.data;
  };

  const deleteVariation = async (variationId) => {
    await variationsApi.delete(projectId, variationId);
    setProject((prev) => ({
      ...prev,
      variations: prev?.variations?.filter((v) => v.id !== variationId) || [],
    }));
  };

  return {
    project,
    loading,
    error,
    refresh: fetchProject,
    updateProject,
    addState,
    updateState,
    deleteState,
    addVariation,
    deleteVariation,
  };
}

export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await templatesApi.list();
      setTemplates(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const seedBaseTemplate = async () => {
    const response = await templatesApi.seedBase();
    await fetchTemplates();
    return response.data;
  };

  return {
    templates,
    loading,
    error,
    refresh: fetchTemplates,
    seedBaseTemplate,
  };
}
