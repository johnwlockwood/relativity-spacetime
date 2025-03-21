# Command History

This file documents useful, reusable commands for the project, organized by purpose.

## Package Management

```bash
# Install a package as a development dependency
npm install --save-dev package-name

# Install a package as a runtime dependency
npm install --save package-name

# Install TypeScript type definitions for a package
npm install --save-dev @types/package-name

# Example: Install Three.js type definitions without the library itself
npm install --save-dev @types/three
```

## Project Development

```bash
# Start a Vite development server
npm run dev

# Build the project
npm run build

# Preview the built project
npm run preview
```

## File Management

```bash
# Create a directory (and parent directories if they don't exist)
mkdir -p directory/subdirectory

# Create multiple directories at once
mkdir -p dir1 dir2 dir3

# Remove a file
rm filename

# Remove a directory and its contents
rm -rf directory
```
