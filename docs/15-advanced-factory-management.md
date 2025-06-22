# Advanced Factory Management Features

## Overview

This document covers the advanced factory management features including authentication, dependency tracking, import/export systems, and factory exports display.

## Authentication System

### NextAuth Integration
- **Provider**: Google OAuth for secure sign-in
- **Session Management**: Persistent user sessions with automatic refresh
- **User Isolation**: All factories and production lines are user-specific
- **API Protection**: All API routes require authentication

### User Experience
- Clean sign-in/sign-up interface
- User profile display in top navigation
- Secure sign-out functionality
- Session persistence across browser sessions

## Dependency Tracking System

### Missing Ingredients Analysis
The dependency tracker automatically analyzes all production lines in a factory to identify missing ingredients:

- **Real-time Analysis**: Updates when production lines change
- **Smart Filtering**: Excludes ingredients already produced in the same factory
- **Import Consideration**: Accounts for existing imports from other factories
- **Visual Indicators**: Clear display of missing dependencies with quantities

### Import/Export Management

#### Import System
- **Source Selection**: Choose which factory to import from
- **Capacity Checking**: Validates available production capacity
- **Duplicate Prevention**: Prevents importing the same item multiple times from the same factory
- **Dynamic Updates**: Real-time updates when production capacity changes

#### Export System
- **Automatic Tracking**: Tracks what each factory is exporting to others
- **Factory Grouping**: Groups exports by destination factory
- **Item Breakdown**: Shows specific items and quantities being exported
- **Total Calculations**: Displays total export rates per factory

### Visual Features
- **Expandable Interface**: Click to show/hide detailed dependency information
- **Color-coded Status**: Green for satisfied, yellow for missing dependencies
- **Interactive Buttons**: Direct actions to create production lines or imports
- **Auto-refresh**: Configurable automatic updates for monitoring imports

## Factory Exports Display

### New ExportsList Component
A dedicated component that shows which other factories are importing from the current factory:

#### Features
- **Destination Factories**: Shows which factories are receiving items
- **Item Details**: Specific items and quantities being exported
- **Real-time Updates**: Refreshes when production lines change
- **Visual Organization**: Clean, grouped display by destination factory
- **Export Totals**: Shows total export rate in items/min

#### Technical Implementation
- **Component**: `ExportsList.tsx`
- **API Integration**: Uses `/api/factories/[id]/exports` endpoint
- **State Management**: Integrated with factory refresh triggers
- **TypeScript**: Fully typed interfaces for export data

### Display Location
The ExportsList appears in each factory section, providing a complete supply chain view:
1. **What this factory imports** (ImportsList)
2. **What this factory exports** (ExportsList) ← New Feature
3. **What this factory produces** (Production Lines)

## User Interface Enhancements

### Navigation Updates
- **User Info**: Display current user information in top navigation
- **Recipes Link**: Direct access to recipes database page
- **Sign Out**: Convenient sign-out option

### Notification System
- **Dismissible Notifications**: Welcome notifications with auto-dismiss
- **Local Storage**: Remembers dismissed notifications
- **Keyboard Support**: Accessible via keyboard navigation

### Recipes Database Page
- **Search & Filter**: Find recipes by name or ingredient
- **Visual Grid**: Recipe cards with ingredient images
- **Detailed View**: Complete ingredient and product information
- **Image Integration**: Item images for better visual identification

## Technical Architecture

### Database Models
- **User Integration**: All models include userId for data isolation
- **Import Relationships**: Tracks source/target factory relationships
- **Export Tracking**: Automatic calculation of export flows

### API Endpoints
- **Authentication**: Protected routes with user validation
- **Imports**: CRUD operations for import relationships
- **Exports**: Read operations for export tracking
- **User Isolation**: All data filtered by authenticated user

### State Management
- **Refresh Triggers**: Coordinated updates across components
- **Real-time Updates**: Immediate response to production line changes
- **Auto-refresh**: Background monitoring for import/export changes

## Migration Tools

### Legacy Data Support
- **Migration Page**: Administrative interface for data migration
- **Debug Endpoints**: Tools for validating data integrity
- **User Assignment**: Assign legacy factories to specific users

## Performance Optimizations

### Efficient Updates
- **Targeted Refreshes**: Only update necessary components
- **Debounced Searches**: Optimized search functionality
- **Background Monitoring**: Non-blocking auto-refresh for imports

### User Experience
- **Loading States**: Clear feedback during operations
- **Error Handling**: Graceful error handling with user feedback
- **Responsive Design**: Works across all device sizes

## Security Features

### Data Protection
- **User Isolation**: Users can only access their own data
- **API Authentication**: All endpoints require valid sessions
- **Input Validation**: Comprehensive validation on all inputs

### Session Management
- **Secure Cookies**: HttpOnly, secure session cookies
- **Automatic Refresh**: Seamless session renewal
- **Timeout Handling**: Graceful handling of expired sessions

## Future Enhancements

### Planned Features
- **Factory Templates**: Save and reuse factory configurations
- **Collaboration**: Share factories between users
- **Analytics**: Production efficiency metrics and charts
- **Notifications**: Real-time alerts for capacity changes

### Technical Improvements
- **Caching**: Redis caching for improved performance
- **Real-time Updates**: WebSocket integration for live updates
- **Mobile App**: React Native companion application

## Conclusion

The advanced factory management system provides a comprehensive solution for planning and monitoring complex production chains in Satisfactory. With robust authentication, intelligent dependency tracking, and clear visualization of import/export relationships, users can efficiently manage multi-factory operations with confidence.
