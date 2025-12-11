# Copilot Instructions for The Living Gallery

## Project Overview

**The Living Gallery** is a web project that combines a landing page (in `src/`) for a Brooklyn-based gallery space with an interactive 3D gallery visualization (in `src/gallery/`). It's built with Vite for fast development and uses Three.js for 3D rendering.

## Technology Stack & Key Dependencies

- **Build Tool**: Vite 7.1.11 - configured for multi-page app with entry points in `vite.config.js`
- **3D Graphics**: Three.js 0.180.0 - used only in `src/gallery/index.js`
- **Animation**: GSAP 3.13.0 - enables smooth animations on 3D objects and properties
- **Performance Monitoring**: Stats.js 0.17.0 - displays FPS counter in 3D gallery
- **CSS Framework**: None - custom CSS with Space Mono monospace font; uses CSS Grid and flexbox

## Project Architecture

### Multi-Page Structure
The Vite config defines multiple entry points (primitives, materials, textures, groups, exercise) in addition to main and gallery. Current active files are:
- **`src/index.html`** - Landing page with gallery info, links, and embedded Google Calendar
- **`src/gallery/index.js`** - 3D visualization with Three.js scene, OrbitControls, GSAP animations

### Three.js Scene Pattern (src/gallery/index.js)
1. **Initialization**: Renderer → Scene → Camera → Lights → Controls
2. **Scene Setup**: White scene background with RectAreaLight and OrbitControls (dampening enabled)
3. **Objects**: Floor (BoxGeometry), Cone, TorusKnot - all using MeshStandardMaterial
4. **Animation Loop**: Uses `renderer.setAnimationLoop()` (not requestAnimationFrame)
5. **GSAP Animations**: Two parallel tweens animate TorusKnot rotation and light color with infinite loop

### Key Conventions

**DOM Query Pattern**: Uses `document.querySelector()` to get root element (`#app`) before renderer initialization

**Responsive Design**: 
- Landing page uses `dvw` (dynamic viewport width) and `dvh` (dynamic viewport height) units
- Gallery handles window resize with dedicated `onResize()` listener that updates camera and renderer

**Animation Integration**: GSAP targets object properties directly (e.g., `torusKnotMesh.rotation`, `rectLight.color`)

## Developer Workflows

### Setup & Running
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server on http://localhost:3000 (auto-opens)
npm run build        # Build to `dist/` directory
npm run preview      # Preview production build locally
```

### Adding New Pages
Update `vite.config.js` rollupOptions.input with new entry point:
```javascript
input: {
  main: resolve(__dirname, "src/index.html"),
  newpage: resolve(__dirname, "src/newpage/index.html"),
  // ...
}
```
Then create `src/newpage/index.html` and `src/newpage/index.js`

### Modifying 3D Gallery
- Geometry changes in `src/gallery/index.js`: Update geometry constructors (ConeGeometry, TorusKnotGeometry, etc.)
- Material properties: Modify `MeshStandardMaterial` parameters (color, roughness, metalness)
- GSAP animations: All tweens at bottom of file use `repeatRefresh: true` for randomized values
- Camera/controls: Adjust in the "control" and "camera" sections; maxPolarAngle limits vertical rotation

## Critical Integration Points

1. **Three.js + Vite**: Make sure to import Three.js addons explicitly (e.g., `from "three/addons/controls/OrbitControls"`)
2. **Landing Page + External Links**: `src/index.html` embeds Google Calendar and links to external galleries (alttextselfies.net)
3. **Static Assets**: Public folder referenced via `./public/` paths (e.g., dino-logo.jpg)

## Testing & Performance

- Stats.js is mounted in DOM (`stats.dom`) to monitor FPS in 3D gallery
- Renderer uses antialias: true and devicePixelRatio for quality
- Dev server runs on port 3000 with auto-open enabled

## Notes for AI Agents

- The main landing page structure suggests this is a placeholder/project template - custom styling in progress
- The 3D gallery demonstrates core Three.js + GSAP patterns suitable for expansion
- No unit tests or CI/CD pipeline detected - focus on manual testing
- The vite.config references multiple pages (primitives, materials, etc.) that aren't in current workspace - these may be historical or will be added
