# Item Images in Production Lines

## Overview

Enhanced the production line display to show item images for both the main product and ingredients, making the interface more visual and user-friendly.

## Implementation

### Image Utility Function

Created a utility function to generate image URLs from item class names:

```typescript
const getItemImageUrl = (className: string) => {
  if (!className) return null;
  // Convert className to lowercase and replace underscores with hyphens for the image filename
  const imageName = className.toLowerCase().replace(/_/g, '-');
  return `/images/items/${imageName}_64.png`;
};
```

This function:
- Converts class names like `Desc_IronOre_C` to image paths like `/images/items/desc-ironore-c_64.png`
- Uses the 64px version of images for optimal display size
- Returns null for invalid class names

### Main Product Image

Updated the production line header to display the item image:

- Shows a 32x32px item image inside the existing orange circular background
- Falls back to the Package icon if the image fails to load
- Maintains the existing design aesthetic

### Ingredient Images

Enhanced the ingredient display in the recipe details section:

- Shows 16x16px item images next to each ingredient name
- Images are positioned before the "amount x name" text
- Falls back gracefully if images fail to load (hides the img element)

## Visual Improvements

- **Better Recognition**: Users can quickly identify items by their visual appearance
- **Professional Look**: The interface looks more polished and game-like
- **Consistent Branding**: Uses the same images as the Satisfactory game
- **Graceful Degradation**: If images fail to load, the interface still functions with text and icons

## Error Handling

- Images have proper error handling with `onError` events
- Failed images are hidden rather than showing broken image icons
- Fallback icons (Package) are shown when images are unavailable

## Performance Considerations

- Uses 64px images which are reasonably sized for web display
- Images are served from the static `/images/items/` directory for fast loading
- No additional API calls are made for image loading

## File Structure

```
public/
  images/
    items/
      desc-ironore-c_64.png
      desc-copperore-c_64.png
      desc-coal-c_64.png
      ... (hundreds of item images)
```

## Testing

1. View production lines with multiple ingredients
2. Verify that item images appear for both the main product and ingredients
3. Test error handling by temporarily removing an image file
4. Confirm that the layout remains stable with and without images

## Future Enhancements

- Consider adding hover tooltips with larger images
- Add loading states for images
- Implement lazy loading for better performance
- Add support for custom/modded item images

## Files Modified

- `src/components/ProductionLineCard.tsx` - Added image display functionality
- Updated TypeScript interfaces to handle image URLs
- Enhanced error handling and fallback mechanisms
