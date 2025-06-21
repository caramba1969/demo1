# Factory Navigation with Drag and Drop

This document describes the implementation of factory navigation cards in the sidebar with drag-and-drop reordering functionality.

## Overview

The factory navigation system provides:
- Visual factory cards in the sidebar
- Active factory highlighting
- Drag-and-drop reordering
- Factory selection and management
- Persistent factory order

## Components

### FactoryNavigationCard

A draggable card component that represents a factory in the sidebar.

**Features:**
- Drag handle for reordering
- Factory icon with status color
- Factory name and order number
- Action buttons (edit, delete)
- Active state highlighting
- Hover effects and animations

**Props:**
```typescript
interface FactoryNavigationCardProps {
  factory: {
    id: string;
    name: string;
    order?: number;
  };
  isActive?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}
```

### Sidebar Updates

The sidebar now includes:
- Factory navigation section with counter
- Drag-and-drop context
- Empty state messaging
- Factory list management

**New Props:**
```typescript
interface SidebarProps {
  factories: Factory[];
  activeFactoryId?: string;
  onAddFactory: () => void;
  onSelectFactory: (id: string) => void;
  onDeleteFactory: (id: string) => void;
  onReorderFactories: (factories: Factory[]) => void;
  onEditFactory?: (id: string) => void;
}
```

## Database Changes

### Factory Model

Added `order` field to the Factory schema:

```typescript
const FactorySchema = new Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 0 }, // New field
  // ...existing fields
});
```

### API Endpoints

#### GET /api/factories
- Now sorts by `order` first, then `createdAt`
- Returns factories in user-defined order

#### POST /api/factories
- Automatically assigns the next order value
- Places new factories at the end of the list

#### PUT /api/factories/reorder
- New endpoint for updating factory order
- Bulk updates multiple factory orders

```typescript
// Request body
{
  factories: [
    { id: "factory1", order: 0 },
    { id: "factory2", order: 1 }
  ]
}
```

## User Experience

### Factory Selection
- Single factory view (no longer showing all factories at once)
- Active factory highlighted in sidebar
- Automatic selection of first factory on load
- Clear selection state management

### Drag and Drop
- Smooth drag animations using CSS transforms
- Visual feedback during drag operations
- Optimistic UI updates
- Error handling with fallback to reload

### Visual Design
- Modern card-based layout
- Color-coded factory status
- Hover effects and micro-interactions
- Consistent spacing and typography

## Implementation Details

### Dependencies
```json
{
  "@dnd-kit/core": "^6.0.0",
  "@dnd-kit/sortable": "^7.0.0",
  "@dnd-kit/utilities": "^3.2.0"
}
```

### State Management
- Factory list with order persistence
- Active factory tracking
- Optimistic updates for smooth UX
- Error recovery mechanisms

### Error Handling
- Network failure recovery
- Invalid state protection
- User feedback for failed operations
- Graceful degradation

## Usage Examples

### Basic Factory Navigation
```tsx
<Sidebar 
  factories={factories}
  activeFactoryId={activeFactoryId}
  onAddFactory={handleAddFactory}
  onSelectFactory={handleSelectFactory}
  onDeleteFactory={handleFactoryDelete}
  onReorderFactories={handleReorderFactories}
/>
```

### Factory Card Interaction
```tsx
<FactoryNavigationCard
  factory={factory}
  isActive={factory.id === activeFactoryId}
  onSelect={onSelectFactory}
  onDelete={onDeleteFactory}
  onEdit={onEditFactory}
/>
```

## Benefits

1. **Improved Organization**: Users can organize factories in their preferred order
2. **Better UX**: Single-factory view reduces cognitive load
3. **Visual Clarity**: Clear active state and navigation
4. **Persistent Order**: Factory arrangement is saved and restored
5. **Intuitive Controls**: Drag-and-drop is familiar and efficient

## Future Enhancements

- Factory grouping/folders
- Search and filtering
- Factory templates
- Bulk operations
- Keyboard navigation shortcuts
- Factory thumbnails/previews
