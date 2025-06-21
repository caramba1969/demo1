# Factory Planner Development Changelog

## Overview
This document tracks all changes made to the Satisfactory Factory Planner application, organized chronologically by development sessions.

## Table of Contents
1. [01-database-models.md](./01-database-models.md) - Database Models and Schema Design
2. [02-api-endpoints.md](./02-api-endpoints.md) - API Endpoints Development
3. [03-data-import.md](./03-data-import.md) - Satisfactory Data Import System
4. [04-production-planning.md](./04-production-planning.md) - Production Planning System
5. [05-layout-system.md](./05-layout-system.md) - Layout System Refactor
6. [06-bug-fixes.md](./06-bug-fixes.md) - Bug Fixes and Data Enrichment
7. [07-collapsible-production-lines.md](./07-collapsible-production-lines.md) - Collapsible Production Lines with State Persistence
8. [08-image-management.md](./08-image-management.md) - Image Storage and Management Guide

## Project Architecture
- **Frontend**: Next.js 14+ with React 19+, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes with MongoDB
- **Database**: MongoDB with Mongoose ODM
- **UI Library**: shadcn/ui components with Lucide React icons
- **Styling**: TailwindCSS with dark theme

## Key Features Implemented
- ✅ Complete CRUD for factories, tasks, and notes
- ✅ Satisfactory game data integration (3000+ items, recipes)
- ✅ Production line planning with calculations
- ✅ Item and recipe selection system
- ✅ Building count and power consumption calculations
- ✅ Admin interface for data management
- ✅ Responsive design with fixed sidebar navigation
- ✅ Collapsible production lines with state persistence

## Technology Stack
- **Next.js 14+** - App Router, Server Components, Client Components
- **React 19+** - Modern React features and hooks
- **TypeScript** - Full type safety
- **MongoDB** - Document database with Mongoose ODM
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Lucide React** - Icon library
- **Framer Motion** - Ready for animations (not yet implemented)
