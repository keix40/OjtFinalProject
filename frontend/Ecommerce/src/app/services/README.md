# Color Utility Service

The `ColorUtilityService` provides functionality to convert color names to hex codes and identify color attributes in product variants.

## Features

- **Color Name to Hex Conversion**: Converts common color names to their corresponding hex codes
- **Color Attribute Detection**: Identifies if an attribute name represents a color
- **Display Name Generation**: Provides user-friendly display names for colors
- **Extensive Color Support**: Includes basic colors, fashion colors, brand colors, and seasonal colors

## Usage

### Basic Color Conversion

```typescript
// Convert color names to hex codes
this.colorUtilityService.getColorHex('red'); // Returns '#FF0000'
this.colorUtilityService.getColorHex('blue'); // Returns '#0000FF'
this.colorUtilityService.getColorHex('beige'); // Returns '#F5F5DC'
```

### Color Attribute Detection

```typescript
// Check if an attribute name represents a color
this.colorUtilityService.isColorAttribute('color'); // Returns true
this.colorUtilityService.isColorAttribute('size'); // Returns false
```

### Display Name Generation

```typescript
// Get user-friendly display names
this.colorUtilityService.getColorDisplayName('red'); // Returns 'Red'
this.colorUtilityService.getColorDisplayName('#FF0000'); // Returns 'Custom Color'
```

## Supported Color Categories

### Basic Colors
- red, blue, green, yellow, black, white, gray, purple, orange, pink, brown, etc.

### Fashion Colors
- beige, ivory, cream, tan, khaki, coral, salmon, peach, lavender, violet, etc.

### Brand Colors
- nike, adidas, puma, reebok, converse, vans, etc.

### Seasonal Colors
- spring, summer, autumn/fall, winter

### Metallic Colors
- bronze, copper, platinum, titanium

### Product Material Colors
- denim, leather, suede, canvas, linen, cotton, wool, silk, etc.

## Integration with Product Components

The service is integrated into both admin and user product detail components to:

1. **Display Color Swatches**: Show actual colored circles instead of text for color attributes
2. **Tooltips**: Provide color names on hover
3. **Variant Selection**: Enhance variant thumbnails with color indicators

## Adding Custom Colors

You can add custom color mappings:

```typescript
this.colorUtilityService.addCustomColor('mycolor', '#FF5733');
```

## Fallback Behavior

- Unknown color names return `#CCCCCC` (light gray)
- Empty or null values return `#CCCCCC`
- Valid hex codes are returned as-is
- Case-insensitive matching is supported 