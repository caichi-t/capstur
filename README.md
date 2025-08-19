# Capstur - Screenshot Capture Tool

A Tauri-based screenshot capture and composition application that allows users to capture regions of their screen using drag-and-drop selection, compose multiple screenshots together, and upload them.

## Features

- **Region Selection**: Capture specific screen areas with drag-and-drop interface
- **Image Composition**: Combine multiple screenshots with various layout options
- **Global Shortcuts**: Quick capture with `Ctrl+Shift+C`
- **Cross-platform**: Supports Windows and macOS

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Rust + Tauri v2
- **Key Libraries**: xcap (screen capture), react-dnd (drag & drop)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://rustup.rs/) (latest stable version)
- Platform-specific requirements:
  - **Windows**: Visual Studio Build Tools or Visual Studio with C++ development tools
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)

## Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd capstur
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

## Building for Production

### Windows

1. Ensure all prerequisites are installed
2. Build the application:
   ```bash
   npm run tauri build
   ```
3. The installer will be generated in `src-tauri/target/release/bundle/msi/`

### macOS

1. Ensure Xcode Command Line Tools are installed
2. Build the application:
   ```bash
   npm run tauri build
   ```
3. The app bundle will be generated in `src-tauri/target/release/bundle/macos/`
4. The DMG installer will be in `src-tauri/target/release/bundle/dmg/`

### Build Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build frontend for production
- `npm run tauri dev` - Run Tauri in development mode
- `npm run tauri build` - Create production build and installer

## Usage

1. Launch the application
2. Use the global shortcut `Ctrl+Shift+C` to start region capture
3. Drag to select the screen area you want to capture
4. Compose multiple screenshots using the built-in layout options
5. Upload or save your composed images

## Configuration

The application can be configured through `src-tauri/tauri.conf.json`:
- Global shortcuts
- Window properties
- Security policies
- App metadata

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

[Add your license information here]
