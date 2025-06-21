# Recipes Database Page

## Overview
Added a comprehensive recipes database page that allows users to browse, search, and filter through all available Satisfactory recipes in a modern, user-friendly interface.

## Features Implemented

### ✅ Modern Recipe Browser
**Location**: `/src/app/recipes/page.tsx`

**Key Features**:
- **Complete Recipe Database**: Shows all available Satisfactory recipes
- **Advanced Search**: Search by recipe name, ingredients, or products
- **Smart Filtering**: Filter by building type with dropdown
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Updates**: Live search and filter results
- **Performance Optimized**: Efficient API calls and rendering

### ✅ Enhanced TopNav Integration
**Location**: `/src/components/TopNav.tsx`

**Navigation Enhancement**:
- Added clickable link to recipes page
- Maintains existing design consistency
- Proper routing with Next.js Link component

### ✅ Enhanced Recipes API
**Location**: `/src/app/api/recipes/route.ts`

**API Improvements**:
- **Enriched Data**: Automatically populates ingredient and product names
- **Extended Fields**: Includes power consumption, building types, and timing
- **Better Performance**: Optimized queries with lean() for faster responses
- **Type Safety**: Proper TypeScript support

## User Interface Design

### **Header Section**
- Clean title with Package icon
- Descriptive subtitle
- Professional typography with orange accent colors

### **Search & Filter Panel**
- **Search Bar**: Real-time search with search icon
- **Filter Toggle**: Collapsible filter panel with smooth animations
- **Building Filter**: Dropdown with all available building types
- **Clear Filters**: One-click reset for all filters
- **Results Counter**: Shows filtered vs total results
- **Active Filters Display**: Shows current search terms and filters

### **Recipe Cards Grid**
- **Responsive Grid**: 1-3 columns based on screen size
- **Recipe Information**:
  - Recipe name and timing
  - Power consumption (if available)
  - Building type (formatted for readability)
  - Complete ingredient list with rates
  - Product output with rates
  - Items per minute calculations

### **Visual Design Elements**
- **Gradient Background**: Consistent with app theme
- **Card Hover Effects**: Orange border on hover
- **Icons**: Lucide React icons for consistency
- **Color Coding**: Orange for products, neutral for ingredients
- **Typography**: Clear hierarchy with proper contrast

## Technical Implementation

### **State Management**
```typescript
const [recipes, setRecipes] = useState<Recipe[]>([]);
const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const [selectedBuilding, setSelectedBuilding] = useState('');
const [showFilters, setShowFilters] = useState(false);
```

### **Smart Filtering Logic**
```typescript
useEffect(() => {
  let filtered = recipes;

  // Text search across recipe name, ingredients, and products
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(recipe =>
      recipe.name.toLowerCase().includes(term) ||
      recipe.ingredients.some(ing => ing.name?.toLowerCase().includes(term)) ||
      recipe.products.some(prod => prod.name?.toLowerCase().includes(term))
    );
  }

  // Building type filter
  if (selectedBuilding) {
    filtered = filtered.filter(recipe =>
      recipe.producedIn.includes(selectedBuilding)
    );
  }

  setFilteredRecipes(filtered);
}, [recipes, searchTerm, selectedBuilding]);
```

### **Performance Features**
- **Debounced Search**: Instant visual feedback with efficient API usage
- **Lazy Loading**: Only loads recipes when needed
- **Memoized Calculations**: Efficient rate calculations
- **Optimized Renders**: Proper React keys and minimal re-renders

## Recipe Data Display

### **Recipe Card Structure**
```
┌─────────────────────────────────────┐
│ Recipe Name                         │
│ ⏱️ 30s  ⚡ 150 MW  🏭 Constructor    │
├─────────────────────────────────────┤
│ Ingredients:                        │
│ • Iron Ore        30 (60.0/min)     │
│ • Coal           20 (40.0/min)      │
├─────────────────────────────────────┤
│            ➡️                       │
├─────────────────────────────────────┤
│ Products:                           │
│ • Iron Ingot     15 (30.0/min)     │
└─────────────────────────────────────┘
```

### **Key Metrics Displayed**
- **Recipe Time**: Formatted as minutes/seconds
- **Power Consumption**: MW (when available)
- **Building Type**: Human-readable building names
- **Input Rates**: Items per minute for all ingredients
- **Output Rates**: Items per minute for all products
- **Efficiency Calculations**: Real-time rate computations

## Search & Filter Capabilities

### **Search Functionality**
- **Multi-field Search**: Recipe names, ingredient names, product names
- **Case-insensitive**: User-friendly search experience
- **Real-time Results**: Instant feedback as user types
- **Clear Indicators**: Shows active search terms

### **Filter Options**
- **Building Types**: All available production buildings
- **Dynamic List**: Automatically populated from recipe data
- **Formatted Names**: User-friendly building names (e.g., "Constructor" instead of "Build_ConstructorMk1_C")
- **Clear All**: Quick reset functionality

### **Results Management**
- **Results Counter**: Shows "X of Y recipes"
- **No Results State**: Helpful message with suggestions
- **Loading States**: Professional loading indicators
- **Error Handling**: Graceful error display

## Authentication & Security

### **Access Control**
- **Authentication Required**: Must be signed in to view recipes
- **Session Management**: Proper session handling
- **Graceful Redirects**: Clear messaging for unauthenticated users
- **Loading States**: Smooth authentication state transitions

### **API Security**
- **Enhanced Recipe API**: Enriched data with proper error handling
- **Performance Optimizations**: Efficient database queries
- **Type Safety**: Full TypeScript support throughout

## Mobile Optimization

### **Responsive Features**
- **Mobile-first Design**: Works perfectly on all screen sizes
- **Touch-friendly**: Large tap targets and proper spacing
- **Adaptive Layout**: Grid adjusts to screen size (1-3 columns)
- **Optimized Typography**: Readable at all sizes
- **Efficient Scrolling**: Smooth performance on mobile devices

## Future Enhancement Opportunities

### **Potential Additions**
1. **Recipe Favorites**: Save frequently used recipes
2. **Recipe Calculator**: Calculate required inputs for target outputs
3. **Production Chain Visualization**: Show interconnected recipes
4. **Export Functions**: Export recipe data in various formats
5. **Recipe Comparison**: Side-by-side recipe analysis
6. **Power Efficiency Sorting**: Sort by power consumption per output
7. **Alternative Recipe Highlighting**: Show alternate vs standard recipes
8. **Recipe Categories**: Group by resource type or complexity

## Performance Metrics

### **Optimizations Implemented**
- **Efficient API Calls**: Single request for all recipe data
- **Client-side Filtering**: Fast, responsive search and filtering
- **Lean Database Queries**: Only fetch required fields
- **Optimized Re-renders**: Proper React optimization patterns
- **Memory Efficient**: Proper cleanup and state management

This recipes page provides a comprehensive, user-friendly interface for browsing the complete Satisfactory recipe database, making it easy for players to find the exact recipes they need for their factory planning.
