# Production Planning System

**Date**: Session 2 - Production Line Implementation  
**Files Created**: `src/components/ItemRecipeSelector.tsx`, `src/components/ProductionLineCard.tsx`  
**Files Modified**: `src/components/FactorySection.tsx`

## Overview
Implemented a complete production planning system that allows users to create, manage, and calculate production lines within factories. The system integrates with the imported Satisfactory data to provide real-time production calculations.

## Components Created

### 1. ItemRecipeSelector Component

**Purpose**: Interactive selector for choosing items and their recipes

**Features**:
- **Item Selection**: Dropdown with search and filtering
- **Recipe Selection**: Automatically shows recipes for selected item
- **Visual Indicators**: Icons and descriptions for items/recipes
- **Type Safety**: Full TypeScript integration
- **Accessibility**: Proper ARIA labels and keyboard navigation

**Key Functions**:
```typescript
export interface ItemRecipeSelectorProps {
  selectedItem: string;
  selectedRecipe: string;
  onItemChange: (itemId: string) => void;
  onRecipeChange: (recipeId: string) => void;
}
```

**UI Features**:
- Modern select dropdowns with shadcn/ui styling
- Item search and filtering capabilities
- Recipe filtering based on selected item
- Loading states and error handling
- Responsive design for mobile/desktop

### 2. ProductionLineCard Component

**Purpose**: Display and manage individual production lines

**Features**:
- **Production Display**: Shows selected item and recipe
- **Quantity Input**: Set desired production rate per minute
- **Live Calculations**: Real-time ingredient calculations
- **Edit Mode**: Toggle between view and edit modes
- **Delete Function**: Remove production lines with confirmation
- **Visual Design**: Card-based layout matching Satisfactory theme

**Key Functions**:
```typescript
export interface ProductionLineCardProps {
  line: ProductionLine;
  onUpdate: (lineId: string, updates: Partial<ProductionLine>) => Promise<void>;
  onDelete: (lineId: string) => Promise<void>;
}
```

**Calculation Logic**:
```typescript
const calculateRequirements = (recipe: Recipe, targetPerMinute: number) => {
  const cycleTime = recipe.time; // seconds per recipe
  const cyclesPerMinute = 60 / cycleTime;
  const recipesNeeded = targetPerMinute / cyclesPerMinute;
  
  return recipe.ingredients.map(ingredient => ({
    item: ingredient.item,
    amount: ingredient.amount * recipesNeeded
  }));
};
```

## Integration with FactorySection

### Enhanced FactorySection Features

**New Capabilities**:
- **Production Line Management**: Full CRUD operations
- **Real-time Updates**: Live calculation updates
- **Factory-specific Lines**: Each factory has its own production lines
- **Bulk Operations**: Add/remove multiple lines efficiently

**Updated State Management**:
```typescript
const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
const [isAddingLine, setIsAddingLine] = useState(false);
const [selectedItem, setSelectedItem] = useState('');
const [selectedRecipe, setSelectedRecipe] = useState('');
const [targetQuantity, setTargetQuantity] = useState(60);
```

## API Integration

### Production Line Endpoints Used

**Factory-specific Lines**:
- `GET /api/factories/{id}/production-lines` - List lines for factory
- `POST /api/factories/{id}/production-lines` - Create new line
- `PATCH /api/factories/{id}/production-lines/{lineId}` - Update line
- `DELETE /api/factories/{id}/production-lines/{lineId}` - Delete line

**Data Enhancement**:
- Lines are enriched with full item and recipe data
- Real-time calculations performed client-side
- Server provides data integrity and persistence

## Production Calculations

### Real-time Requirements Calculation

**Algorithm**:
1. Get recipe cycle time (seconds)
2. Calculate cycles per minute (60 / cycle time)
3. Calculate recipes needed (target per minute / cycles per minute)
4. Calculate ingredient requirements (ingredient amount × recipes needed)

**Example Calculation**:
```typescript
// AI Limiter recipe: 12 seconds, produces 1 AI Limiter
// Target: 5 AI Limiters per minute

const cycleTime = 12; // seconds
const cyclesPerMinute = 60 / 12 = 5;
const recipesNeeded = 5 / 5 = 1;

// Requirements:
// - Copper Sheets: 5 × 1 = 5 per minute
// - High-Speed Wire: 20 × 1 = 20 per minute
```

### Visual Calculation Display

**Requirements Section**:
- Shows all ingredient requirements
- Displays per-minute consumption rates
- Color-coded for different ingredient types
- Updates in real-time as target quantity changes

## User Experience Flow

### Adding a Production Line

1. **Navigate to Factory**: Select a factory from sidebar
2. **Add Line**: Click "Add Production Line" button
3. **Select Item**: Choose target item from dropdown
4. **Select Recipe**: Choose recipe (standard or alternate)
5. **Set Quantity**: Enter desired production rate per minute
6. **Save**: Line is created and calculations are shown
7. **Review**: View requirements and production details

### Managing Existing Lines

1. **View Lines**: See all production lines in factory
2. **Edit Mode**: Toggle edit to modify quantity or recipe
3. **Real-time Updates**: Calculations update immediately
4. **Delete**: Remove lines with confirmation dialog
5. **Persist Changes**: All changes auto-save to database

## Technical Implementation

### Data Flow Architecture

```
User Input → Component State → API Call → Database → UI Update
     ↓              ↓             ↓          ↓         ↓
1. Select Item  2. Update UI  3. Save Data  4. Persist  5. Refresh
2. Set Quantity 3. Calculate  4. Validate   5. Return   6. Display
3. Save Line    4. Submit     5. Store      6. Success  7. Show
```

### Error Handling

**Client-side**:
- Form validation before submission
- Loading states during API calls
- Error messages for failed operations
- Fallback data for missing items/recipes

**Server-side**:
- Data validation on all endpoints
- Error responses with descriptive messages
- Database constraint enforcement
- Transaction rollback on failures

## Performance Optimizations

### Frontend Optimizations

**React Performance**:
- `useState` and `useEffect` for optimal re-renders
- Memoized calculations to prevent unnecessary recalculation
- Efficient state updates with functional updates
- Proper key props for list rendering

**Data Loading**:
- Lazy loading of items and recipes
- Cached API responses where appropriate
- Efficient filtering and search algorithms
- Minimal re-fetching of unchanged data

### Backend Optimizations

**Database Queries**:
- Efficient MongoDB queries with proper indexing
- Populated references for complete data
- Batch operations for multiple updates
- Optimized aggregation pipelines

## UI/UX Design

### Visual Design System

**Color Scheme**:
- Satisfactory-inspired orange/blue theme
- Dark mode with high contrast
- Consistent component styling
- Professional shadcn/ui components

**Layout Structure**:
- Card-based production line display
- Clear visual hierarchy
- Responsive design for all screen sizes
- Intuitive navigation and controls

### Accessibility Features

**ARIA Support**:
- Proper labels for all interactive elements
- Screen reader compatible descriptions
- Keyboard navigation support
- Focus management for modal dialogs

**User Feedback**:
- Loading indicators for async operations
- Success/error messages for all actions
- Confirmation dialogs for destructive operations
- Clear visual feedback for state changes

## Future Enhancements

### Planned Features

**Advanced Calculations**:
- Power consumption calculations
- Building requirement estimates
- Multi-level production chain analysis
- Resource optimization suggestions

**Visualization**:
- Production flow diagrams (Framer Motion)
- Resource consumption charts (Recharts)
- Factory layout visualization
- Efficiency metrics dashboard

**Integration**:
- Import/export production plans
- Save template production lines
- Share factory configurations
- Integration with Satisfactory save files
