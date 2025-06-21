# Image Storage and Management Guide

## Directory Structure

```
public/
├── images/
│   ├── items/           # Satisfactory item icons (64x64, 128x128)
│   │   ├── iron-ore.png
│   │   ├── copper-sheet.png
│   │   └── ai-limiter.png
│   ├── recipes/         # Recipe/building icons (64x64, 128x128)
│   │   ├── assembler.png
│   │   ├── constructor.png
│   │   └── manufacturer.png
│   ├── buildings/       # Factory building images (256x256+)
│   │   ├── factory-exterior.jpg
│   │   └── production-line.jpg
│   ├── ui/             # UI elements, backgrounds
│   │   ├── bg-gradient.jpg
│   │   ├── pattern.svg
│   │   └── divider.png
│   └── logos/          # App logos, branding
│       ├── logo.png
│       ├── logo-dark.png
│       └── favicon.ico
├── icons/              # App icons, favicons
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── android-chrome-*.png
├── screenshots/        # App screenshots for documentation
│   ├── factory-view.png
│   └── production-planning.png
└── [existing files]    # file.svg, globe.svg, etc.
```

## Usage in Components

### Next.js Image Component (Recommended)

```tsx
import Image from 'next/image';

// Item icons
<Image 
  src="/images/items/iron-ore.png" 
  alt="Iron Ore" 
  width={64} 
  height={64} 
  className="rounded"
/>

// With optimization
<Image 
  src="/images/ui/bg-gradient.jpg" 
  alt="Background" 
  fill
  className="object-cover"
  priority={true} // For above-fold images
/>
```

### Static Import (For smaller images)

```tsx
import ironOreIcon from '/public/images/items/iron-ore.png';

<Image 
  src={ironOreIcon} 
  alt="Iron Ore" 
  width={64} 
  height={64} 
/>
```

### CSS Background Images

```css
.hero-section {
  background-image: url('/images/ui/bg-gradient.jpg');
  background-size: cover;
  background-position: center;
}
```

## Image Optimization Guidelines

### File Formats
- **PNG**: Item icons, UI elements with transparency
- **JPEG**: Photos, complex images, backgrounds
- **SVG**: Simple icons, logos, scalable graphics
- **WebP**: Modern format for better compression (Next.js auto-converts)

### Size Recommendations
- **Item Icons**: 64x64px, 128x128px (for retina)
- **Building Images**: 256x256px, 512x512px
- **Backgrounds**: 1920x1080px max
- **Logos**: Multiple sizes (32x32, 64x64, 128x128, 256x256)

### Optimization Tools
- **TinyPNG**: For PNG compression
- **ImageOptim**: Mac tool for various formats
- **Squoosh**: Web-based optimization tool
- **Next.js**: Automatic optimization with Image component

## Satisfactory Game Assets

### Item Icons
Store Satisfactory item icons in `/public/images/items/`:
- Use consistent naming: `iron-ore.png`, `copper-sheet.png`
- Size: 64x64px or 128x128px
- Format: PNG with transparency

### Building Icons
Store building/machine icons in `/public/images/recipes/`:
- Constructor, Assembler, Manufacturer icons
- Size: 64x64px
- Format: PNG with transparency

### Integration with Database
Update your Item and Recipe models to reference these paths:

```typescript
// In Item model
interface IItem {
  // ...existing fields
  iconPath: string; // "/images/items/iron-ore.png"
}

// In Recipe model  
interface IRecipe {
  // ...existing fields
  buildingIconPath?: string; // "/images/recipes/assembler.png"
}
```

## Dynamic Image Loading

### For Satisfactory Items
```tsx
const ItemIcon = ({ item }: { item: Item }) => {
  const iconPath = item.iconPath || '/images/items/default.png';
  
  return (
    <Image
      src={iconPath}
      alt={item.name}
      width={64}
      height={64}
      onError={(e) => {
        // Fallback to default icon
        e.currentTarget.src = '/images/items/default.png';
      }}
    />
  );
};
```

### Lazy Loading for Performance
```tsx
<Image
  src="/images/buildings/factory.jpg"
  alt="Factory"
  width={512}
  height={512}
  loading="lazy" // Lazy load off-screen images
  placeholder="blur" // Show blur while loading
  blurDataURL="data:image/jpeg;base64,..." // Base64 blur placeholder
/>
```

## Asset Management Best Practices

### 1. Naming Conventions
- Use kebab-case: `iron-ore.png`, `ai-limiter.png`
- Be descriptive: `assembler-mk1.png`, `constructor-icon.png`
- Include size suffix if multiple: `logo-64.png`, `logo-128.png`

### 2. Version Control
- Commit optimized images only
- Use `.gitignore` for source/unoptimized images if needed
- Keep file sizes reasonable (<500KB for most images)

### 3. Performance
- Use Next.js Image component for automatic optimization
- Provide `width` and `height` to prevent layout shift
- Use `priority={true}` for above-fold images
- Consider lazy loading for below-fold content

### 4. Accessibility
- Always provide meaningful `alt` text
- Use empty `alt=""` for decorative images
- Ensure sufficient color contrast for text over images

## CDN Considerations (Future)

For production scaling, consider moving images to a CDN:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-cdn-domain.com'],
    loader: 'custom',
    loaderFile: './image-loader.js'
  }
};
```

But for now, the `public/images/` structure is perfect for development and small-to-medium production deployments.

## Example Component Integration

```tsx
// components/ItemCard.tsx
import Image from 'next/image';

interface ItemCardProps {
  item: {
    name: string;
    iconPath?: string;
    description: string;
  };
}

export const ItemCard = ({ item }: ItemCardProps) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg">
      <Image
        src={item.iconPath || '/images/items/default.png'}
        alt={item.name}
        width={48}
        height={48}
        className="rounded"
      />
      <div>
        <h3 className="font-semibold text-white">{item.name}</h3>
        <p className="text-slate-400 text-sm">{item.description}</p>
      </div>
    </div>
  );
};
```
