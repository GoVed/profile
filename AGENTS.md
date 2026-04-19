# AI Agents Guide - Profile Project

This document provides essential context and instructions for AI agents working on this project.

## Project Overview
A minimalist, high-performance portfolio website built with a Rust (Rocket) backend and a vanilla JS frontend featuring a physics-based animation.

## Architecture & Key Files

### Backend (Rust/Rocket)
- `src/lib.rs`: Core server logic, routes, and `rocket_builder()`. Handles extension-less routing for `.js`, `.css`, and `.json`.
- `src/main.rs`: Entry point that launches the Rocket server.
- `Rocket.toml`: Server configuration (address, port).
- `tests/integration_test.rs`: Integration tests for backend routes.

### Frontend (Vanilla JS/CSS)
- `site/layouts/`: HTML templates.
  - `index.html`: Main shell with accessibility (ARIA), PWA registration, SEO meta tags, and **Predictive Peek** hover logic.
  - `manifest.json`: PWA configuration for mobile installation.
  - `skills.html` & `contact.html`: New content sections.
- `site/styles/style.css`: Modern CSS with dark mode, accessibility focus states, and **preview-peek** transitions.
- `site/scripts/`:
  - `sw.js`: Service Worker for offline asset caching (PWA Lite).
  - `contentPage.js`: Handles instant navigation with client-side caching and fade transitions.
  - `profileContent.js`: Manages the gravity ball and "guy" animation, including high-DPI scaling and background task cleanup (`stopProfile`).
  - `ball.js` & `guy.js`: Physics and drawing logic for the animation.
  - `anim.js`: Text and sidebar animation logic.

## Operational Mandates & Security
- **Security**: 
  - Never leak raw IO errors (e.g., `os error 2`) to the client. Use generic "Not Found" messages.
  - Protect the `.git` directory. It MUST be in `.dockerignore`.
  - Prefer `textContent` over `innerHTML` for security and performance unless HTML rendering is explicitly required.
- **Performance**:
  - Always call `stopProfile()` when navigating away from the profile page to save CPU.
  - Use the `cache` in `contentPage.js` for internal navigation.
- **Development**:
  - The project uses a library/binary split to facilitate integration testing.
  - New features should include corresponding integration tests in `tests/`.
  - CI is automated via GitHub Actions (`.github/workflows/ci.yml`) running tests and clippy.

## Working with the Canvas
- The canvas uses a high-DPI scaling system. 
- Always use `virtualWidth` and `virtualHeight` for physics calculations.
- Call `setupCanvas()` if the container dimensions change.
