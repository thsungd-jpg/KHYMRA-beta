# Project Chimera - PWA Genesis Engine

## Original Problem Statement
Build a meta-application that creates Progressive Web Apps (PWAs) functioning as persistent digital environments. The system creates installable, offline-capable PWAs where each output is a self-contained digital place with atmospheric states, behavioral intelligence, and calm UX.

## Core Requirements (Static)
- **Philosophy**: State over screens, Behavior over configuration, Continuity over interaction, Atmosphere over content
- **Stack**: React frontend + FastAPI backend + MongoDB
- **Theme**: Dark matte with amber/gold bioluminescent accents
- **UX**: Calm technology - progressive disclosure, hidden complexity, intent-based interaction

## User Personas
1. **Primary**: Media artists and experiential designers who understand immersive aesthetics but fear terminal windows
2. **Secondary**: Full-stack developers seeking rapid PWA prototyping without sacrificing architectural purity
3. **Tertiary**: Content strategists needing to A/B test media delivery frameworks

## What's Been Implemented (January 18, 2026)

### Backend (FastAPI + MongoDB)
- Complete data models: Project, AtmosphericState, VariationConfig, ContinuityConfig, CognitiveZeroConfig
- Full CRUD API endpoints for Projects, States, Variations
- PWA scaffold generation (manifest.json, service-worker.js, config.json, index.html)
- Template system with base Sun God template seeding
- Project forking functionality

### Frontend (React)
- **Infinite Canvas** - Spatial metaphor for project navigation with pan/zoom
- **Project Nodes** - Solar system visualization with orbital state indicators
- **Project Genesis** - Create/fork project dialog with multiple methods
- **State Editor** - Full configuration for Visual, Audio, Tempo, and Scarcity layers
- **Variation Editor** - DNA mutation controls with bias sliders
- **Preview Portal** - Multi-device simulation with playback controls
- **Export Panel** - PWA scaffold generation with copyable output
- **Continuity Settings** - Memory persistence, time-aware adaptation, Cognitive Zero mode
- **HUD Navigation** - Intent-based bottom nav that hides on inactivity

### Key Features
- ✅ Project Genesis (create/fork PWA universes)
- ✅ Atmospheric States (visual/audio/tempo configurations)
- ✅ Variation Engine (DNA mutation sliders)
- ✅ Continuity Sanctum (memory persistence settings)
- ✅ Cognitive Zero Mode (autonomous operation config)
- ✅ Temporal Scarcity Engine (time-locked states)
- ✅ Preview Portal (device simulation)
- ✅ Export System (PWA scaffold generation)

## Prioritized Backlog

### P0 - Critical
- [x] Core CRUD operations for projects, states, variations
- [x] Basic export functionality
- [x] State/variation editors

### P1 - High Priority
- [ ] Asset upload and management (images, audio)
- [ ] Real-time preview with actual transitions
- [ ] PWA manifest icon generation

### P2 - Medium Priority
- [ ] Project forking from templates in UI
- [ ] Collaborative editing via WebRTC
- [ ] Advanced blend mode visual editor

### P3 - Future
- [ ] WebXR spatial preview
- [ ] Docker container export
- [ ] Plugin SDK for custom transitions

## Next Tasks
1. Add asset upload functionality with drag-drop to canvas
2. Implement real-time transition preview in Preview Portal
3. Add color palette extraction from uploaded images
4. Create downloadable PWA zip bundle from scaffold
