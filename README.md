# Auris Pro Landing Page

Auris Pro is a premium, single-page product website built to showcase a fictional high-end wireless headphone brand with strong visual storytelling, smooth interactions, and production-ready frontend structure.

## Project Overview

This project focuses on delivering a modern marketing page that balances aesthetics and technical quality:

- Cinematic hero section with an interactive 3D product experience
- Conversion-focused section flow (performance, finishes, specs, purchase, social proof, CTA)
- Smooth motion and hover states with mobile-aware performance tuning
- Clear content hierarchy and scalable styling architecture

The architecture and wireframe foundation for this project were created in Framer, then carried into a production-style frontend implementation.

Framer project link:

- https://framer.com/projects/Outstanding-Network--onqzP5HNMLJcpKnf3agk

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES Modules)
- Three.js (for the 3D product scene)

## Repository Structure

- `index.html` - page structure, content sections, metadata
- `styles.css` - design system tokens, layout, components, responsive styles
- `app.mjs` - interaction logic, navigation behavior, reveal effects, 3D rendering pipeline
- `framer-cms-model.md` - CMS/content model reference for structured content planning

## Section Breakdown

- Sticky header navigation with desktop/mobile behavior
- Hero storytelling section with animated 3D product stage
- Performance highlights card grid
- Finish collection with visual variants
- Engineering specs + purchase/pre-book panel
- Reviews/testimonials
- Final conversion CTA and footer navigation

## Quality and Implementation Notes

- Responsive design — mobile, tablet, desktop, ultrawide
- Semantic structure — correct heading levels, clean layout structure
- SEO basics — metadata + alt tags
- CMS setup — clean, scalable fields
- Clean structure — clear naming, organized hierarchy
- Quality — no bugs, no layout issues

## Running the Project

This is a static frontend project.

1. Open `index.html` directly in a browser, or
2. Serve the project folder with any local static server.

Example (if Python is available):

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Purpose

This repository is designed as a portfolio-quality landing page implementation with strong emphasis on visual polish, performance, and maintainable frontend structure.
