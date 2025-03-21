# Command History

This file documents useful commands used throughout the project, organized by task and purpose.

## Add Three.js from CDN with TypeScript Support (2025-03-21)

### Git Commands
```bash
# Create a new branch for the Three.js implementation
git checkout -b add-threejs
```

### NPM Commands
```bash
# Install Three.js type definitions without the library itself
npm install --save-dev @types/three

# Run the development server
npm run dev
```

### File Management
```bash
# Create directories
mkdir -p memory-bank
mkdir -p src/types

# Remove files
rm src/three.d.ts
```

## General Purpose Commands

### Directory Operations
```bash
# Create a directory (and parent directories if they don't exist)
mkdir -p directory/subdirectory

# List files in a directory
ls -la directory
```

### Development Servers
```bash
# Start a Vite development server
npm run dev

# Build the project
npm run build

# Preview the built project
npm run preview
```
