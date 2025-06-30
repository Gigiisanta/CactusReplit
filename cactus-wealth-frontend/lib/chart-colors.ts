/**
 * Cactus Wealth Chart Color Palette
 * 
 * Custom color palette derived from the Cactus Wealth brand theme
 * for use in charts and data visualizations
 */

// Primary Cactus Wealth color palette for charts
export const CACTUS_CHART_COLORS = [
  '#5cb35c',  // cactus-400 - Primary green
  '#8fd08f',  // cactus-300 - Light green  
  '#d4b896',  // sand-500 - Warm beige
  '#5f6b5f',  // sage-500 - Sage green
  '#bce5bc',  // cactus-200 - Very light green
  '#a1aba1',  // sage-300 - Light sage
  '#c09f7a',  // sand-600 - Darker beige
  '#2d8f2d',  // cactus-500 - Dark green
  '#e2d0b7',  // sand-400 - Light beige
  '#7a877a',  // sage-400 - Medium sage
  '#dcf2dc',  // cactus-100 - Very light green
  '#ede2d1',  // sand-300 - Pale beige
  '#237a23',  // cactus-600 - Darker green
  '#c7cdc7',  // sage-200 - Pale sage
  '#f5efe4',  // sand-200 - Very light beige
];

// Sector-specific color mapping for better consistency
export const SECTOR_COLOR_MAP: Record<string, string> = {
  'Tecnología': '#5cb35c',
  'Servicios Financieros': '#8fd08f', 
  'Salud': '#d4b896',
  'Consumo Discrecional': '#5f6b5f',
  'Consumo Básico': '#bce5bc',
  'Energía': '#a1aba1',
  'Industriales': '#c09f7a',
  'Materiales': '#2d8f2d',
  'Servicios Públicos': '#e2d0b7',
  'Inmobiliario': '#7a877a',
  'Telecomunicaciones': '#dcf2dc',
  'ETF Diversificado': '#ede2d1',
  'Sin Clasificar': '#c7cdc7',
  'Otro': '#f5efe4',
};

/**
 * Get color for a specific sector with fallback
 */
export const getSectorColor = (sector: string): string => {
  return SECTOR_COLOR_MAP[sector] || CACTUS_CHART_COLORS[0];
};

/**
 * Get chart colors in a cyclical manner
 */
export const getChartColor = (index: number): string => {
  return CACTUS_CHART_COLORS[index % CACTUS_CHART_COLORS.length];
}; 