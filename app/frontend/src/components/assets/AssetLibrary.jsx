import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { 
  Image as ImageIcon, 
  Music, 
  Video, 
  Trash2, 
  Loader2,
  Eye,
  Download
} from 'lucide-react';
import { cn, formatBytes } from '../../lib/utils';
import { toast } from 'sonner';

export function AssetLibrary({ projectId, onAssetSelect, selectionMode = false }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filter, setFilter] = useState('all'); // all, images, audio, video

  useEffect(() => {
    loadAssets();
  }, [projectId]);

  const loadAssets = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/projects/${projectId}/assets`);
      const data = await response.json();
      setAssets(data.assets || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId, assetName) => {
    if (!window.confirm(`Delete ${assetName}?`)) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(
        `${backendUrl}/api/projects/${projectId}/assets/${assetId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Delete failed');

      toast.success('Asset deleted');
      loadAssets();
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const handleSelect = (asset) => {
    if (selectionMode && onAssetSelect) {
      onAssetSelect(asset);
    } else {
      setSelectedAsset(selectedAsset?.id === asset.id ? null : asset);
    }
  };

  const filteredAssets = assets.filter(asset => {
    if (filter === 'all') return true;
    return asset.type === filter;
  });

  const getAssetIcon = (type) => {
    switch (type) {
      case 'images': return ImageIcon;
      case 'audio': return Music;
      case 'video': return Video;
      default: return ImageIcon;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'images', 'audio', 'video'].map(type => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
            className={cn(
              filter === type && 'bg-amber-500 hover:bg-amber-600'
            )}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No assets uploaded yet</p>
          <p className="text-sm mt-1">Upload some assets to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map(asset => {
            const Icon = getAssetIcon(asset.type);
            const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
            const assetUrl = `${backendUrl}${asset.url}`;

            return (
              <div
                key={asset.id}
                onClick={() => handleSelect(asset)}
                className={cn(
                  "group relative aspect-square rounded-lg overflow-hidden",
                  "bg-white/5 border-2 transition-all cursor-pointer",
                  "hover:border-amber-500/50",
                  selectedAsset?.id === asset.id && "border-amber-500 ring-2 ring-amber-500/20"
                )}
              >
                {/* Preview */}
                {asset.type === 'images' ? (
                  <img
                    src={assetUrl}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <p className="text-xs font-medium text-center px-2 truncate w-full">
                    {asset.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(asset.size)}
                  </p>
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    {asset.type === 'images' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(assetUrl, '_blank');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset.id, asset.filename);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Color palette indicator for images */}
                {asset.type === 'images' && asset.colors && asset.colors.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-2 flex">
                    {asset.colors.slice(0, 5).map((color, idx) => (
                      <div
                        key={idx}
                        className="flex-1"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}

                {/* Audio duration */}
                {asset.type === 'audio' && asset.duration && (
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                    {Math.floor(asset.duration / 60)}:{String(Math.floor(asset.duration % 60)).padStart(2, '0')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
