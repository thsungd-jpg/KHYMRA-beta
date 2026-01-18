import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Panel } from '../layout/PageLayout';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { exportApi } from '../../lib/api';
import { toast } from 'sonner';
import { 
  Download, 
  Package, 
  Server, 
  Code,
  Check,
  Loader2,
  FileJson,
  FileCode,
  Copy
} from 'lucide-react';

const exportFormats = [
  {
    id: 'static-bundle',
    name: 'Static Bundle',
    description: 'Production-ready dist/ folder with all assets',
    icon: Package,
  },
  {
    id: 'source-code',
    name: 'Source Code',
    description: 'Full source code for customization',
    icon: Code,
  },
  {
    id: 'docker-container',
    name: 'Docker Container',
    description: 'Container config for cloud deployment',
    icon: Server,
    disabled: true,
  },
];

export function ExportPanel({ project, variations = [] }) {
  const [format, setFormat] = useState('static-bundle');
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [includeServiceWorker, setIncludeServiceWorker] = useState(true);
  const [includeTelemetry, setIncludeTelemetry] = useState(false);
  const [minify, setMinify] = useState(true);
  const [generateIcons, setGenerateIcons] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const handleExport = async () => {
    if (!project?.id) return;

    setExporting(true);
    try {
      const response = await exportApi.generate(project.id, {
        format,
        variation_id: selectedVariation,
        include_service_worker: includeServiceWorker,
        include_telemetry: includeTelemetry,
        minify,
        generate_icons: generateIcons,
      });

      // Get the scaffold
      const scaffoldResponse = await exportApi.getScaffold(response.data.id);
      setExportResult(scaffoldResponse.data.scaffold);
      toast.success('PWA scaffold generated successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to generate export');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!project?.id) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const downloadUrl = `${backendUrl}/api/projects/${project.id}/export/download`;
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-bundle.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download bundle');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6" data-testid="export-panel">
      {/* Format Selection */}
      <Panel title="Export Format">
        <div className="grid gap-3 md:grid-cols-3">
          {exportFormats.map(f => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                data-testid={`export-format-${f.id}`}
                disabled={f.disabled}
                onClick={() => setFormat(f.id)}
                className={cn(
                  'flex flex-col items-start p-4 rounded-xl text-left',
                  'border transition-all duration-300',
                  format === f.id
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20',
                  f.disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Icon className={cn(
                  'w-6 h-6 mb-3',
                  format === f.id ? 'text-amber-500' : 'text-muted-foreground'
                )} />
                <h3 className="font-medium text-sm">{f.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                {format === f.id && (
                  <Check className="absolute top-3 right-3 w-4 h-4 text-amber-500" />
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Variation Selection */}
      {variations.length > 0 && (
        <Panel title="Variation">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Export Specific Variation
            </Label>
            <Select
              value={selectedVariation || 'base'}
              onValueChange={(v) => setSelectedVariation(v === 'base' ? null : v)}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Base Project (no variation)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base">Base Project (no variation)</SelectItem>
                {variations.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Panel>
      )}

      {/* Export Options */}
      <Panel title="Options">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="font-medium text-sm">Service Worker</p>
              <p className="text-xs text-muted-foreground">Enable offline capability</p>
            </div>
            <Switch
              checked={includeServiceWorker}
              onCheckedChange={setIncludeServiceWorker}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="font-medium text-sm">Minify Output</p>
              <p className="text-xs text-muted-foreground">Compress for production</p>
            </div>
            <Switch
              checked={minify}
              onCheckedChange={setMinify}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="font-medium text-sm">Generate Icons</p>
              <p className="text-xs text-muted-foreground">Auto-generate PWA icons</p>
            </div>
            <Switch
              checked={generateIcons}
              onCheckedChange={setGenerateIcons}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="font-medium text-sm">Performance Telemetry</p>
              <p className="text-xs text-muted-foreground">Local-only metrics (no network)</p>
            </div>
            <Switch
              checked={includeTelemetry}
              onCheckedChange={setIncludeTelemetry}
            />
          </div>
        </div>
      </Panel>

      {/* Export Button */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          data-testid="export-btn"
          onClick={handleExport}
          disabled={exporting || !project?.id}
          className="h-12 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 uppercase tracking-widest text-xs font-bold"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate PWA
            </>
          )}
        </Button>

        <Button
          data-testid="download-btn"
          onClick={handleDownload}
          disabled={!project?.id}
          className="h-12 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/50 uppercase tracking-widest text-xs font-bold"
        >
          <Package className="w-4 h-4 mr-2" />
          Download Bundle
        </Button>
      </div>

      {/* Export Result */}
      {exportResult && (
        <Panel title="Generated Scaffold">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your PWA scaffold has been generated. Copy the files below to build your atmosphere.
            </p>

            {/* File Structure */}
            <div className="p-4 rounded-lg bg-black/40 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-amber-500">File Structure</span>
              </div>
              <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{Object.entries(exportResult.structure || {}).map(([dir, files]) => (
  `${dir}\n${Array.isArray(files) ? files.map(f => `  └── ${f}`).join('\n') : ''}\n`
)).join('')}
              </pre>
            </div>

            {/* manifest.json */}
            <div className="p-4 rounded-lg bg-black/40 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-amber-500 flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  manifest.json
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(exportResult['manifest.json'], 'manifest.json')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground font-mono overflow-x-auto max-h-48">
                {JSON.stringify(exportResult['manifest.json'], null, 2)}
              </pre>
            </div>

            {/* config.json */}
            <div className="p-4 rounded-lg bg-black/40 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-amber-500 flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  config.json
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(exportResult['config.json'], 'config.json')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground font-mono overflow-x-auto max-h-48">
                {JSON.stringify(exportResult['config.json'], null, 2)}
              </pre>
            </div>

            {/* service-worker.js */}
            <div className="p-4 rounded-lg bg-black/40 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-amber-500 flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  service-worker.js
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(exportResult['service-worker.js'], 'service-worker.js')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
                {exportResult['service-worker.js']}
              </pre>
            </div>

            {/* index.html */}
            <div className="p-4 rounded-lg bg-black/40 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-amber-500 flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  index.html
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(exportResult['index.html'], 'index.html')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
                {exportResult['index.html']}
              </pre>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

export default ExportPanel;
