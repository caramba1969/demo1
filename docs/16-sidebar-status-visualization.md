# Sidebar Status Visualization Feature

## Overview

The sidebar now provides comprehensive factory satisfaction status tracking with visual indicators, filtering capabilities, and real-time updates. This feature gives users an at-a-glance overview of their entire factory network's health.

## Key Features

### 1. Real-time Status Tracking
- **Automatic Updates**: Factory status updates immediately when production lines or imports change
- **Dependency Monitoring**: Tracks missing ingredients across all production lines in each factory
- **Status Persistence**: Maintains status tracking even when switching between factories

### 2. Visual Status Indicators
- **Color-coded Borders**: Red borders indicate factories with missing dependencies
- **Status Dots**: Green/red indicators on factory icons show satisfaction status
- **Summary Badges**: Shows count of satisfied vs unsatisfied factories
- **Tooltip Information**: Hover for detailed missing ingredient counts

### 3. Factory Status Filtering
- **"Show Issues Only" Filter**: Display only factories that need attention
- **Smart Empty States**: Appropriate messages when all factories are satisfied
- **Filter Toggle**: Easy switching between all factories and problem factories
- **Visual Filter Status**: Clear indication when filter is active

### 4. Enhanced Navigation Cards
- **Status Integration**: Each factory card shows its current satisfaction status
- **Missing Ingredient Count**: Quick reference for how many dependencies are missing
- **Visual Hierarchy**: Clear distinction between satisfied and unsatisfied factories
- **Consistent Theming**: Status colors match the main factory view

## User Experience Benefits

### Improved Factory Management
- **Quick Problem Identification**: Instantly see which factories need attention
- **Reduced Cognitive Load**: No need to check each factory individually
- **Prioritized Workflow**: Focus on factories with issues first
- **Comprehensive Overview**: Understand factory network health at a glance

### Enhanced Productivity
- **Faster Navigation**: Filter to problem factories when troubleshooting
- **Visual Clarity**: Color coding makes status immediately apparent
- **Contextual Information**: Tooltips provide details without navigation
- **Efficient Planning**: Prioritize work based on factory satisfaction status

## Technical Implementation

### Status Tracking System
- **Callback Integration**: FactorySection components report status changes
- **State Management**: Main page tracks status for all factories in a Map
- **Clean Architecture**: Status cleanup when factories are deleted
- **Performance Optimized**: Efficient updates without unnecessary re-renders

### Component Integration
- **Sidebar Enhancement**: Added status display and filtering logic
- **Navigation Cards**: Enhanced with status visualization
- **Filter Controls**: Smart showing/hiding based on satisfaction status
- **Status Summary**: Aggregated view in sidebar header

## Future Enhancements

### Potential Improvements
- **Notification System**: Alert when factories become unsatisfied
- **Status History**: Track satisfaction changes over time
- **Priority Levels**: Different severity indicators for different issue types
- **Batch Operations**: Actions on filtered factory sets

### Advanced Features
- **Supply Chain Health**: Overall network satisfaction scoring
- **Predictive Alerts**: Warning when changes might cause issues
- **Performance Metrics**: Track how often factories are satisfied
- **Export Status**: Include export relationship health in status calculations

## Configuration

### Default Behavior
- **All Factories View**: Shows all factories by default
- **Status Calculation**: Based on missing ingredients and import coverage
- **Update Frequency**: Real-time updates when any factory data changes
- **Visual Preferences**: Consistent with existing application theme

### Customization Options
- **Filter Persistence**: Filter state resets when navigating away
- **Status Sensitivity**: Currently tracks any missing ingredient as unsatisfied
- **Visual Styling**: Color scheme follows application design system
- **Information Density**: Compact display for space efficiency

This feature significantly enhances the user experience by providing immediate visibility into factory network health and enabling focused problem-solving workflows.
