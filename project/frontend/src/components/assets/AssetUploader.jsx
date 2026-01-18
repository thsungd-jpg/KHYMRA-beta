import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Music, Video, File } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

const ASSET_TYPE_ICONS = {
  image: ImageIcon,
  audio: Music,
  video: Video,
  other: File
};

export function AssetUploader({ projectId, onUploadComplete, className }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}/assets/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  }, [projectId]);

  const handleFileInput = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    await handleFiles(files);
  }, [projectId]);

  const handleFiles = async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadPromises = files.map(file => uploadFile(file));

    try {
      const results = await Promise.all(uploadPromises);
      toast.success(`Uploaded ${results.length} file(s)`);
      if (onUploadComplete) {
        onUploadComplete(results);
      }
    } catch (error) {
      toast.error('Upload failed');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all",
          isDragging ? "border-amber-500 bg-amber-500/10" : "border-border bg-card/50",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          id="asset-upload"
          multiple
          accept="image/*,audio/*,video/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />
        
        <label
          htmlFor="asset-upload"
          className="flex flex-col items-center justify-center cursor-pointer space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Upload className="w-8 h-8 text-amber-500" />
          </div>
          
          <div className="text-center">
            <p className="text-lg font-medium mb-1">
              {uploading ? 'Uploading...' : 'Drop assets here or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground">
              Images, audio, and video files supported
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

export function AssetGrid({ assets, onDelete, className }) {
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const handleDelete = async (assetId) => {
    if (!window.confirm('Delete this asset?')) return;
    
    try {
      await onDelete(assetId);
      toast.success('Asset deleted');
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  if (!assets || assets.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-muted-foreground">No assets uploaded yet</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
      {assets.map((asset) => {
        const metadata = asset.metadata;
        const Icon = ASSET_TYPE_ICONS[metadata.asset_type] || File;
        const isImage = metadata.asset_type === 'image';
        const assetUrl = `${backendUrl}${metadata.url}`;

        return (
          <Card
            key={asset.id}
            className="group relative overflow-hidden bg-card/50 border-border hover:border-amber-500/50 transition-all"
          >
            <div className="aspect-square relative bg-muted">
              {isImage ? (
                <img
                  src={assetUrl}
                  alt={metadata.original_filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              
              <button
                onClick={() => handleDelete(asset.id)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-3">
              <p className="text-sm font-medium truncate" title={metadata.original_filename}>
                {metadata.original_filename}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span className="capitalize">{metadata.asset_type}</span>
                {metadata.width && metadata.height && (
                  <span>{metadata.width}×{metadata.height}</span>
                )}
              </div>
              {metadata.color_palette && metadata.color_palette.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {metadata.color_palette.slice(0, 5).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
