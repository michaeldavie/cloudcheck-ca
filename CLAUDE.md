# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CloudCheck.ca is a static website that displays cloud services assessed by CCCS (Canadian Centre for Cyber Security). It's a client-side only application with no build process or dependencies.

## Development Commands

This is a static website served directly from files:

- **Local development**: Open `index.html` in a browser or use a simple HTTP server:
  ```bash
  python3 -m http.server 8000
  # or
  npx serve .
  ```

- **No build process**: Files are served directly without compilation or bundling

## Architecture

### File Structure
- `index.html` - Main page with search interface and service grid
- `script.js` - All JavaScript functionality for data loading and UI interactions  
- `styles.css` - Complete styling with responsive design
- `data/` - JSON data files for cloud providers and services
  - `providers.json` - List of provider data files to load
  - `[provider].json` - Individual provider service data (aws.json, google.json, etc.)

### Data Architecture

**Provider JSON Schema:**
- `name`: Display name (e.g., "Amazon Web Services (AWS)")
- `provider`: Company name (e.g., "Amazon") 
- `type`: Either "CSP" (Cloud Service Provider) or "SaaS" (Software as a Service)
- `underlyingCSP`: Array of CSPs that SaaS providers use (optional)
- `servicesInScope`: Object mapping service names to assessment levels (["Medium"], ["HVA"], or ["Medium", "HVA"])
- `references`: Optional object with `assessmentReport` and `providerReference` URLs

### JavaScript Architecture

**Main Functions:**
- `loadProviderData()`: Fetches providers.json then loads all individual provider files
- `renderSummaryView()`: Creates provider cards grouped by CSP/SaaS type with service counts
- `showDetailView(service)`: Displays detailed service table for a specific provider
- `filterServices(searchTerm)`: Handles search in both summary and detail views

**State Management:**
- `cloudServices`: Array of all loaded provider data
- `currentView`: Either 'summary' (provider cards) or 'detail' (service table)
- `selectedService`: Currently viewed provider in detail mode

**UI Components:**
- Provider cards show service counts (Medium vs HVA services)
- Detail view shows sortable table of services with Medium/HVA checkmarks  
- Search filters providers by name in summary, services by name in detail
- Back button returns from detail to summary view

### Styling Notes

- Responsive grid layout (4→3→2→1 columns based on screen size)
- CSS Grid for service cards, Flexbox for internal card layout
- Hover effects on cards with transform/shadow animations
- Purple gradient theme (#667eea to #764ba2)