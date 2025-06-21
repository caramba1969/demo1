# API Endpoints Development

**Date**: Session 1-2 - API Implementation  
**Files Modified**: `src/app/api/`

## Overview
Developed comprehensive RESTful API endpoints for items, recipes, and production lines with full CRUD operations and advanced querying capabilities.

## API Endpoints Created

### 1. Items API (`/api/items`)

#### GET `/api/items`
**Purpose**: Search, filter, and paginate through Satisfactory items

**Query Parameters**:
- `search` - Text search in name/description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `liquid` - Filter by liquid/solid state
- `category` - Filter by item category

**Response**:
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalPages": 10,
    "totalCount": 500,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### POST `/api/items`
**Purpose**: Create new items (admin function)

### 2. Recipes API (`/api/recipes`)

#### GET `/api/recipes`
**Purpose**: Find recipes with advanced filtering

**Query Parameters**:
- `search` - Text search in recipe names
- `productItem` - Find recipes that produce this item
- `ingredientItem` - Find recipes that use this item
- `alternate` - Filter by alternate recipes
- `inMachine` - Filter by machine production
- `page`, `limit` - Pagination

**Example Usage**:
```
GET /api/recipes?productItem=Desc_CircuitBoardHighSpeed_C&alternate=false
```

#### POST `/api/recipes`
**Purpose**: Create new recipes (admin function)

### 3. Production Lines API (`/api/production-lines`)

#### GET `/api/production-lines`
**Purpose**: Get production lines with calculated metrics

**Features**:
- Automatic calculation of building requirements
- Power consumption estimates
- Production rate calculations
- Item and recipe name resolution

#### POST `/api/production-lines`
**Purpose**: Create new production line with validation

**Validation**:
- Ensures item and recipe exist
- Validates recipe produces the specified item
- Returns enriched data with calculations

### 4. Factory-Specific Production Lines

#### GET `/api/factories/[id]/production-lines`
**Purpose**: Get production lines for a specific factory

**Enhanced Features**:
- Enriched with item and recipe details
- Production metrics calculations
- Sorted by creation date

#### POST `/api/factories/[id]/production-lines`
**Purpose**: Add production line to specific factory

#### PATCH `/api/factories/[id]/production-lines/[lineId]`
**Purpose**: Update production line

#### DELETE `/api/factories/[id]/production-lines/[lineId]`
**Purpose**: Delete production line

### 5. Admin API (`/api/admin/import-data`)

#### POST `/api/admin/import-data`
**Purpose**: Import Satisfactory game data into database

**Process**:
1. Reads `data1.0.json` from project root
2. Parses items and recipes
3. Clears existing data
4. Bulk inserts new data
5. Returns import statistics

## Key Features Implemented

### Production Calculations
All production line APIs include automatic calculation of:

```typescript
// Items per minute calculation
const itemsPerCycle = productInfo.amount;
const cycleTimeInMinutes = recipe.time / 60;
const itemsPerMinute = itemsPerCycle / cycleTimeInMinutes;

// Building requirements
const requiredBuildings = Math.ceil(targetQuantityPerMinute / itemsPerMinute);

// Power consumption
const totalPowerConsumption = requiredBuildings * powerPerBuilding;
```

### Data Enrichment
Production lines are enriched with:
- Item details (name, icon, slug)
- Recipe details (name, time, ingredients, products)
- Building type from recipe
- Calculated metrics

### Error Handling
- Comprehensive try-catch blocks
- Proper HTTP status codes
- Detailed error messages
- MongoDB error handling (duplicate keys, etc.)

### Performance Optimizations
- Lean queries for better performance
- Parallel Promise.all for multiple database operations
- Strategic indexing utilization
- Pagination for large datasets

## API Response Examples

### Enriched Production Line Response
```json
{
  "_id": "...",
  "factoryId": "...",
  "itemClassName": "Desc_CircuitBoardHighSpeed_C",
  "recipeClassName": "Recipe_AILimiter_C",
  "targetQuantityPerMinute": 60,
  "actualQuantityPerMinute": 60,
  "buildingCount": 12,
  "buildingType": "Desc_AssemblerMk1_C",
  "powerConsumption": 12,
  "efficiency": 100,
  "active": true,
  "item": {
    "name": "AI Limiter",
    "icon": "desc-circuitboardhighspeed-c",
    "slug": "ai-limiter"
  },
  "recipe": {
    "name": "AI Limiter",
    "time": 12,
    "ingredients": [...],
    "products": [...]
  }
}
```

## Database Integration
- Proper MongoDB connection handling
- Mongoose model utilization
- Transaction support ready (not yet implemented)
- Connection pooling and caching
