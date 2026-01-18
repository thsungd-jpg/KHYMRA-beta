import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Rocket, Sparkles, FolderOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

const creationMethods = [
  {
    id: 'genesis',
    name: 'Genesis',
    description: 'Start fresh with a blank canvas',
    icon: Sparkles,
    color: 'amber',
  },
  {
    id: 'template',
    name: 'From Template',
    description: 'Fork the Sun God base template',
    icon: Rocket,
    color: 'emerald',
  },
  {
    id: 'import',
    name: 'Import',
    description: 'Import from existing config',
    icon: FolderOpen,
    color: 'blue',
    disabled: true,
  },
];

export function CreateProjectDialog({ open, onOpenChange, onCreate, templates = [] }) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        fork_from_id: method === 'template' && templates[0] ? templates[0].id : undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setMethod(null);
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="glass border-white/10 sm:max-w-lg"
        data-testid="create-project-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-amber-500">
            {step === 1 ? 'Choose Creation Method' : 'Project Details'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === 1 
              ? 'How would you like to begin your new universe?'
              : 'Give your project an identity'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid gap-3 py-4">
            {creationMethods.map((m) => {
              const Icon = m.icon;
              const colors = {
                amber: 'border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/5',
                emerald: 'border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/5',
                blue: 'border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/5',
              };
              const iconColors = {
                amber: 'text-amber-500',
                emerald: 'text-emerald-500',
                blue: 'text-blue-500',
              };

              return (
                <button
                  key={m.id}
                  data-testid={`method-${m.id}`}
                  disabled={m.disabled}
                  onClick={() => {
                    setMethod(m.id);
                    setStep(2);
                  }}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl',
                    'border bg-white/[0.02] transition-all duration-300',
                    'text-left',
                    colors[m.color],
                    m.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    'bg-white/5',
                    iconColors[m.color]
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">
                      {m.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {m.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">
                Project Name
              </Label>
              <Input
                id="name"
                data-testid="project-name-input"
                placeholder="e.g., Evening Meditation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-amber-500/50"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                data-testid="project-description-input"
                placeholder="A calm atmosphere for evening wind-down..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-amber-500/50 min-h-[80px] resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                data-testid="create-project-submit"
                onClick={handleCreate}
                disabled={!name.trim() || loading}
                className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50"
              >
                {loading ? 'Creating...' : 'Create Universe'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CreateProjectDialog;
