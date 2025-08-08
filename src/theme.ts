import { Dimensions, I18nManager } from 'react-native';

const { width, height } = Dimensions.get('window');

export const theme = {
  colors: {
    // Primary Colors
    white: '#FFFFFF',
    black: '#000000',
    darkGray: '#231F20',
    mediumGray: '#5D5D5D',
    lightGray: '#EFEFEF',
    red: '#FF3131',
    success: '#4CAF50',
    
    // Status Colors
    pending: '#FF9500',
    processing: '#007AFF',
    shipped: '#34C759',
    delivered: '#30D158',
    cancelled: '#FF3B30',
    failed: '#FF3B30',
    statusDefault: '#8E8E93',
    
    // Additional UI Colors
    lightBorder: '#E5E5E5',
    veryLightGray: '#F5F5F5',
    inputBorder: '#E0E0E0',
    cardBorder: '#F0F0F0',
    searchBackground: '#F8F8F8',
    
    // Legacy aliases for backward compatibility
    primary: '#000000',
    text: '#000000',
    surface: '#FFFFFF',
    border: '#EFEFEF',
    error: '#FF3B30',
    
    // Semantic colors
    background: '#FFFFFF',
    cardBackground: '#FFFFFF',
    buttonPrimary: '#000000',
    buttonSecondary: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#5D5D5D',
    textMuted: '#231F20',
    borderColor: '#EFEFEF',
    divider: '#EFEFEF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 24,
      xxxl: 32,
      xxxxl: 40,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  dimensions: {
    width,
    height,
  },
  
  // Add a utility to check current RTL status
  isRTL: I18nManager.isRTL,
  
  // RTL Support
  rtl: {
    isRTL: false, // Will be updated dynamically
    textAlign: 'left' as 'left' | 'right',
    flexDirection: 'row' as 'row' | 'row-reverse',
  },
}; 