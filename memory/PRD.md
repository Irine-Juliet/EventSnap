# EventSnap - Product Requirements Document

## Original Problem Statement
EVENTSNAP (Calendar Integration Tool) - an app that converts event flyers into structured calendar invites, reducing manual entry and helping students manage recruiting, club, and social events. Allows uploading and taking pictures of event flyers.

## User Personas
1. **College Students** - Managing recruiting events, club meetings, social gatherings
2. **Club Leaders** - Promoting and organizing campus events
3. **Social Organizers** - Planning social activities and parties

## Core Requirements (Static)
- Image upload functionality (drag & drop, file picker)
- Camera capture for taking photos of physical flyers
- AI-powered extraction of event details using GPT-5.2 vision
- Editable form for reviewing/modifying extracted data
- ICS file generation for universal calendar compatibility
- No authentication required (simple, fast tool)

## Architecture
- **Frontend**: React with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (for event logging)
- **AI Integration**: OpenAI GPT-5.2 via Emergent LLM key

## What's Been Implemented
- [x] Drag and drop image upload zone (2025-01-11)
- [x] Upload button for file selection (2025-01-11)
- [x] Camera button for mobile capture (2025-01-11)
- [x] GPT-5.2 vision integration for event extraction (2025-01-11)
- [x] Event details form with editable fields (2025-01-11)
- [x] ICS file generation and download (2025-01-11)
- [x] Dark theme modern UI (2025-01-11)
- [x] Toast notifications for success/error states (2025-01-11)
- [x] Image preview with clear button (2025-01-11)

## Prioritized Backlog

### P0 (Critical) - DONE
- Core image upload flow
- AI event extraction
- ICS file generation

### P1 (High Priority)
- [ ] Add loading/scanning animation during AI processing
- [ ] Improve date/time parsing for various formats
- [ ] Add validation for required fields before download

### P2 (Medium Priority)
- [ ] Recent scans history (using localStorage)
- [ ] Demo flyers for first-time users
- [ ] Share calendar invite via link

### P3 (Low Priority)
- [ ] Multiple image upload support
- [ ] Batch event processing
- [ ] Direct Google Calendar integration

## Next Tasks List
1. Add input validation with clearer error messages
2. Implement localStorage for recent scans history
3. Add demo flyer carousel for new users
4. Enhance date parsing to handle more formats
