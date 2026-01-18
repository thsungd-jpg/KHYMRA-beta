import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export function useAssets(projectId) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssets = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}/assets`);
      setAssets(response.data.assets || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const deleteAsset = useCallback(async (assetId) => {
    await api.delete(`/projects/${projectId}/assets/${assetId}`);
    setAssets(prev => prev.filter(a => a.id !== assetId));
  }, [projectId]);

  const refetch = fetchAssets;

  return {
    assets,
    loading,
    error,
    deleteAsset,
    refetch
  };
}
