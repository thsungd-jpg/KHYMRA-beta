import React from 'react';
import { AssetUploader, AssetGrid } from '../assets/AssetUploader';
import { useAssets } from '../../hooks/useAssets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Loader2, Image as ImageIcon, Music, Video } from 'lucide-react';

export function AssetsPanel({ projectId }) {
  const { assets, loading, deleteAsset, refetch } = useAssets(projectId);

  const imageAssets = assets.filter(a => a.metadata.asset_type === 'image');
  const audioAssets = assets.filter(a => a.metadata.asset_type === 'audio');
  const videoAssets = assets.filter(a => a.metadata.asset_type === 'video');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/30 border-border">
        <CardHeader>
          <CardTitle className="text-amber-500">Upload Assets</CardTitle>
          <CardDescription>
            Add images, audio, and video files to your atmosphere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssetUploader 
            projectId={projectId} 
            onUploadComplete={refetch}
          />
        </CardContent>
      </Card>

      <Card className="bg-card/30 border-border">
        <CardHeader>
          <CardTitle>Asset Library</CardTitle>
          <CardDescription>
            {assets.length} asset{assets.length !== 1 ? 's' : ''} • 
            {' '}{imageAssets.length} image{imageAssets.length !== 1 ? 's' : ''} • 
            {' '}{audioAssets.length} audio • 
            {' '}{videoAssets.length} video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
              <TabsTrigger value="all">
                All ({assets.length})
              </TabsTrigger>
              <TabsTrigger value="images">
                <ImageIcon className="w-4 h-4 mr-2" />
                Images ({imageAssets.length})
              </TabsTrigger>
              <TabsTrigger value="audio">
                <Music className="w-4 h-4 mr-2" />
                Audio ({audioAssets.length})
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="w-4 h-4 mr-2" />
                Video ({videoAssets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <AssetGrid assets={assets} onDelete={deleteAsset} />
            </TabsContent>

            <TabsContent value="images" className="mt-6">
              <AssetGrid assets={imageAssets} onDelete={deleteAsset} />
            </TabsContent>

            <TabsContent value="audio" className="mt-6">
              <AssetGrid assets={audioAssets} onDelete={deleteAsset} />
            </TabsContent>

            <TabsContent value="video" className="mt-6">
              <AssetGrid assets={videoAssets} onDelete={deleteAsset} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
