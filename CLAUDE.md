# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Capstur is a Tauri-based screenshot capture and composition application that allows users to capture regions of their screen using drag-and-drop selection, compose multiple screenshots together, and upload them. The application is built with:

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Rust + Tauri v2
- **Key Libraries**: xcap (screen capture), react-dnd (drag & drop), image processing

## Architecture

### Frontend Structure
- `src/App.tsx` - Main application component managing screenshot state and UI coordination
- `src/components/ScreenshotManager.tsx` - Grid display of screenshots with drag-and-drop reordering
- `src/components/CompositionPanel.tsx` - UI for composing selected screenshots into layouts
- `src/components/UploadPanel.tsx` - Handle uploading composed images

### Backend Structure
- `src-tauri/src/lib.rs` - Main Tauri commands and application state management
- `src-tauri/src/screenshot.rs` - Screen capture functionality using xcap
- `src-tauri/src/image_utils.rs` - Image composition and base64 conversion utilities
- `src-tauri/src/overlay.rs` - Overlay window for region selection UI

### Key Data Flow
1. User triggers region capture → Creates overlay window for selection
2. Region selection → Captures screen area using xcap → Stores as base64 in memory
3. Screenshot selection → Composes images using various layouts
4. Upload functionality for sharing composed images

## Common Commands

### Development
```bash
# Start development server (runs both frontend and Tauri)
npm run dev

# Build for production
npm run build

# Run Tauri commands
npm run tauri dev    # Development with hot reload
npm run tauri build  # Production build
```

### Testing
The application includes test commands accessible via the UI:
- "スクリーンキャプチャテスト" - Tests basic screen capture functionality
- "領域キャプチャテスト" - Tests region capture with fixed coordinates

## Key Features

### Screenshot Capture
- Global shortcut: `Ctrl+Shift+C` (configured in tauri.conf.json)
- Region selection via overlay window with drag-and-drop interface
- Screenshots stored in memory with metadata (timestamp, dimensions, region coordinates)

### Image Composition
- Multiple layout options for combining screenshots
- Drag-and-drop reordering of screenshots before composition
- Real-time preview of composed images

### State Management
- Screenshots stored in Rust HashMap with Mutex for thread safety
- React state manages UI selections and composed images
- Event-driven updates between Rust backend and React frontend

## Configuration

### Tauri Configuration
- App identifier: `com.localladmin.capstur`
- Window title: "Capstur - Screenshot Capture Tool"
- CSP allows `data:` and `https:` image sources for base64 images
- macOS private API enabled for enhanced screen capture

### Global Shortcuts
- Primary capture shortcut: `Ctrl+Shift+C`
- Configurable in `src-tauri/tauri.conf.json`

## Development Notes

- The application uses Japanese UI text ("キャプチャ", "合成", etc.)
- Image data is handled as base64 strings for frontend display
- xcap library handles cross-platform screen capture with fallbacks
- Error handling includes user-friendly Japanese error messages
- All screenshots are stored in memory (not persisted to disk)