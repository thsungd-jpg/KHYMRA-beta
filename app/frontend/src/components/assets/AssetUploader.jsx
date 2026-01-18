import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { Upload, X, Loader2, Image as ImageIcon, Music, Video } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function AssetUploader({ projectId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    const progress = acceptedFiles.map(file => ({
      name: file.name,
      status: 'uploading',
      progress: 0
    }));
    setUploadProgress(progress);

    // Upload files in parallel using Promise.all for better performance
    const uploadPromises = acceptedFiles.map(async (file, index) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        const response = await fetch(`${backendUrl}/api/projects/${projectId}/assets/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        
        // Update progress
        progress[index].status = 'complete';
        progress[index].progress = 100;
        setUploadProgress([...progress]);

        toast.success(`Uploaded ${file.name}`);
        return { success: true, file: file.name };
      } catch (error) {
        progress[index].status = 'error';
        setUploadProgress([...progress]);
        toast.error(`Failed to upload ${file.name}`);
        return { success: false, file: file.name, error };
      }
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    setUploading(false);
    
    // Wait a moment then clear progress and notify parent
    setTimeout(() => {
      setUploadProgress([]);
      if (onUploadComplete) {
        onUploadComplete();
      }
    }, 1000);
  }, [projectId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    disabled: uploading
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
          "hover:border-amber-500/50 hover:bg-amber-500/5",
          isDragActive && "border-amber-500 bg-amber-500/10",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Upload className="w-8 h-8 text-amber-500" />
          </div>
          
          {isDragActive ? (
            <p className="text-lg">Drop files here...</p>
          ) : (
            <>
              <p className="text-lg">Drag & drop assets here</p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Images
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Music className="w-3 h-3" />
                  Audio
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  Video
                </span>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Max size: 2GB per file
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
            >
              {item.status === 'uploading' && (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              )}
              {item.status === 'complete' && (
                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              )}
              {item.status === 'error' && (
                <X className="w-4 h-4 text-red-500" />
              )}
              
              <span className="flex-1 text-sm truncate">{item.name}</span>
              
              <span className="text-xs text-muted-foreground">
                {item.status === 'uploading' && 'Uploading...'}
                {item.status === 'complete' && 'Complete'}
                {item.status === 'error' && 'Failed'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
