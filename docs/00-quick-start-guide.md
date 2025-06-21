# Quick Start Guide

## Getting Started

### Prerequisites
- **Node.js 18+** (Latest LTS recommended)
- **MongoDB** (Local instance or MongoDB Atlas)
- **Git** for version control
- **VS Code** (Recommended editor)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd demo1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/satisfactory-planner
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/satisfactory-planner
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000` (or next available port)

### First Steps

1. **Import Game Data** (Required)
   - Navigate to `http://localhost:3000/admin`
   - Click "Import Satisfactory Data"
   - Wait for the import to complete (imports 3000+ items and recipes)

2. **Create Your First Factory**
   - Click "New Factory" on the main page
   - Add a name and description
   - Start adding production lines

3. **Add Production Lines**
   - Select an item to produce
   - Choose the recipe
   - Set target quantity per minute
   - View calculated building requirements and power consumption

## Development Scripts

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin interface
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── FactorySection.tsx
│   ├── ProductionLineCard.tsx
│   └── ...
└── lib/                  # Utilities and models
    ├── models/           # MongoDB/Mongoose models
    ├── mongodb.ts        # Database connection
    └── utils.ts          # Utility functions

public/
├── images/               # Static images
│   ├── items/           # Item images (3000+ files)
│   ├── recipes/         # Recipe images
│   └── ...
└── icons/               # UI icons

docs/                    # Documentation
├── README.md           # Main documentation
├── 01-database-models.md
├── 02-api-endpoints.md
└── ...
```

## Key Components

### `ProductionLineCard`
The main component for displaying production line information with:
- Item images and names
- Recipe details with ingredients
- Building calculations
- Power consumption
- Collapsible interface

### `FactorySection`
Manages the overall factory view with:
- Factory CRUD operations
- Production line management
- Task and note handling

### `ItemRecipeSelector`
Provides interface for:
- Item selection with search
- Recipe selection for chosen items
- Real-time filtering and suggestions

## Database Models

- **Factory** - Main factory container
- **ProductionLine** - Individual production configurations
- **Task** - Factory-related tasks and todos
- **Item** - Satisfactory game items (3000+)
- **Recipe** - Crafting recipes with ingredients/products

## API Endpoints

- `GET/POST /api/factories` - Factory management
- `GET/POST /api/factories/[id]/production-lines` - Production line management
- `PATCH/DELETE /api/factories/[id]/production-lines/[lineId]` - Individual production line operations
- `GET /api/items` - Item data with search
- `GET /api/recipes` - Recipe data with filtering
- `POST /api/admin/import-data` - Import Satisfactory game data

## Common Tasks

### Adding New Features
1. Create components in `src/components/`
2. Add API routes in `src/app/api/`
3. Update database models in `src/lib/models/`
4. Add documentation in `docs/`

### Styling Guidelines
- Use TailwindCSS utility classes
- Follow the dark theme pattern (slate-900, slate-800, etc.)
- Use shadcn/ui components for consistency
- Implement responsive design with mobile-first approach

### Data Management
- Use Mongoose models for type safety
- Implement proper error handling in API routes
- Follow RESTful API conventions
- Add input validation and sanitization

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify MongoDB is running
   - Check MONGODB_URI in .env.local
   - Ensure database permissions are correct

2. **Images Not Loading**
   - Verify images exist in `public/images/items/`
   - Check image naming convention (lowercase, hyphens)
   - Ensure Next.js static file serving is working

3. **Build Errors**
   - Run `npm run lint` to check for issues
   - Verify all imports are correct
   - Check TypeScript types are properly defined

4. **Performance Issues**
   - Use React DevTools to identify re-renders
   - Check for proper memoization of expensive calculations
   - Verify database queries are optimized

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new code
3. Update documentation for new features
4. Test thoroughly on different screen sizes
5. Ensure accessibility standards are met

## Deployment

The app is ready for deployment on:
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **Railway** (Full-stack with MongoDB)
- **Any Node.js hosting platform**

Ensure environment variables are configured in your hosting platform before deployment.

---

**Need help?** Check the detailed documentation in the `docs/` folder or refer to the specific feature documentation files.
