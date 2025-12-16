import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorUtilityService {
  
  // Color name to hex code mapping
  private colorMap: { [key: string]: string } = {
    // Basic colors
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#008000',
    'yellow': '#FFFF00',
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#808080',
    'grey': '#808080',
    'purple': '#800080',
    'orange': '#FFA500',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'lime': '#00FF00',
    'navy': '#000080',
    'olive': '#808000',
    'maroon': '#800000',
    'teal': '#008080',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    
    // Extended colors
    'lightblue': '#ADD8E6',
    'lightgreen': '#90EE90',
    'lightgray': '#D3D3D3',
    'lightgrey': '#D3D3D3',
    'darkblue': '#00008B',
    'darkgreen': '#006400',
    'darkgray': '#A9A9A9',
    'darkgrey': '#A9A9A9',
    'darkred': '#8B0000',
    'darkorange': '#FF8C00',
    'darkpurple': '#483D8B',
    'darkpink': '#FF1493',
    'darkbrown': '#654321',
    
    // Fashion colors
    'beige': '#F5F5DC',
    'ivory': '#FFFFF0',
    'cream': '#FFFDD0',
    'tan': '#D2B48C',
    'khaki': '#F0E68C',
    'coral': '#FF7F50',
    'salmon': '#FA8072',
    'peach': '#FFDAB9',
    'lavender': '#E6E6FA',
    'violet': '#EE82EE',
    'indigo': '#4B0082',
    'turquoise': '#40E0D0',
    'aqua': '#00FFFF',
    'azure': '#F0FFFF',
    'mint': '#F5FFFA',
    'rose': '#FFE4E1',
    'wine': '#722F37',
    'burgundy': '#800020',
    'charcoal': '#36454F',
    'slate': '#708090',
    
    // Metallic colors
    'bronze': '#CD7F32',
    'copper': '#B87333',
    'platinum': '#E5E4E2',
    'titanium': '#C0C0C0',
    
    // Common product colors
    'denim': '#1560BD',
    'jeans': '#1560BD',
    'leather': '#8B4513',
    'suede': '#D2B48C',
    'canvas': '#F5F5DC',
    'linen': '#FAF0E6',
    'cotton': '#F8F8FF',
    'wool': '#F5F5F5',
    'silk': '#FFF8DC',
    'satin': '#F0E68C',
    'velvet': '#483D8B',
    'lace': '#FFF5EE',
    'mesh': '#F0F8FF',
    'nylon': '#F0F0F0',
    'polyester': '#F5F5F5',
    'spandex': '#F0F8FF',
    'lycra': '#F0F8FF',
    'elastane': '#F0F8FF',
    
    // Brand colors
    'nike': '#000000',
    'adidas': '#000000',
    'puma': '#000000',
    'reebok': '#000000',
    'converse': '#000000',
    'vans': '#000000',
    'newbalance': '#000000',
    'asics': '#000000',
    'underarmour': '#000000',
    'lululemon': '#000000',
    
    // Seasonal colors
    'spring': '#90EE90',
    'summer': '#FFD700',
    'autumn': '#D2691E',
    'fall': '#D2691E',
    'winter': '#F0F8FF',
    
    // Pattern colors
    'striped': '#D3D3D3',
    'polka': '#D3D3D3',
    'floral': '#FFB6C1',
    'geometric': '#D3D3D3',
    'abstract': '#D3D3D3',
    'solid': '#D3D3D3',
    'print': '#D3D3D3',
    'pattern': '#D3D3D3'
  };

  constructor() { }

  /**
   * Convert color name to hex code
   * @param colorName - The color name to convert
   * @returns Hex code or original value if not found
   */
  getColorHex(colorName: string): string {
    if (!colorName) return '#CCCCCC';
    
    const normalizedName = colorName.toLowerCase().trim();
    
    // Direct match
    if (this.colorMap[normalizedName]) {
      return this.colorMap[normalizedName];
    }
    
    // Check if it's already a hex code
    if (this.isHexCode(normalizedName)) {
      return normalizedName;
    }
    
    // Try to find partial matches
    for (const [key, value] of Object.entries(this.colorMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return value;
      }
    }
    
    // Try common color variations
    const variations = this.getColorVariations(normalizedName);
    for (const variation of variations) {
      if (this.colorMap[variation]) {
        return this.colorMap[variation];
      }
    }
    
    // Default fallback
    return '#CCCCCC';
  }

  /**
   * Check if a string is a valid hex color code
   */
  private isHexCode(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Get common variations of a color name
   */
  private getColorVariations(colorName: string): string[] {
    const variations: string[] = [];
    
    // Remove common suffixes
    const baseColor = colorName
      .replace(/\s*blue\s*$/i, '')
      .replace(/\s*green\s*$/i, '')
      .replace(/\s*red\s*$/i, '')
      .replace(/\s*black\s*$/i, '')
      .replace(/\s*white\s*$/i, '')
      .replace(/\s*gray\s*$/i, '')
      .replace(/\s*grey\s*$/i, '')
      .trim();
    
    if (baseColor && baseColor !== colorName) {
      variations.push(baseColor);
    }
    
    // Add common prefixes
    ['light', 'dark', 'pale', 'deep', 'bright', 'soft', 'vivid', 'muted'].forEach(prefix => {
      variations.push(`${prefix}${colorName}`);
      variations.push(`${prefix} ${colorName}`);
    });
    
    return variations;
  }

  /**
   * Check if an attribute name represents a color
   */
  isColorAttribute(attrName: string): boolean {
    if (!attrName) return false;
    const name = attrName.toLowerCase().trim();
    return ['color', 'colors', 'colour', 'colours', 'hue', 'shade', 'tint'].includes(name);
  }

  /**
   * Get display name for a color
   */
  getColorDisplayName(colorName: string): string {
    if (!colorName) return '';
    
    // If it's a hex code, try to find the color name
    if (this.isHexCode(colorName)) {
      const foundColorName = this.getColorNameFromHex(colorName);
      if (foundColorName) {
        return foundColorName.charAt(0).toUpperCase() + foundColorName.slice(1).toLowerCase();
      }
      return 'Custom Color';
    }
    
    // Return the original name with proper capitalization
    return colorName.charAt(0).toUpperCase() + colorName.slice(1).toLowerCase();
  }

  /**
   * Get color name from hex code (reverse lookup)
   */
  private getColorNameFromHex(hexCode: string): string | null {
    const normalizedHex = hexCode.toUpperCase();
    
    // Find the color name that matches this hex code
    for (const [colorName, hex] of Object.entries(this.colorMap)) {
      if (hex.toUpperCase() === normalizedHex) {
        return colorName;
      }
    }
    
    return null;
  }

  /**
   * Get a list of all available color names
   */
  getAvailableColors(): string[] {
    return Object.keys(this.colorMap);
  }

  /**
   * Add a custom color mapping
   */
  addCustomColor(colorName: string, hexCode: string): void {
    this.colorMap[colorName.toLowerCase()] = hexCode;
  }
} 