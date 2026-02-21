export interface ThemeColors {
    // Backgrounds
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;

    // Borders
    borderColor: string;
    borderColorSoft: string;

    // Brand
    brandTeal: string;
    brandTealHover: string;
    brandTealLight: string;
    brandYellow: string;

    // Chat Bubbles
    myBubbleBg: string;
    myBubbleText: string;
    otherBubbleBg: string;
    otherBubbleText: string;
    iaBubbleBg: string;
    iaBubbleText: string;

    // Input
    inputBg: string;
    inputText: string;
    inputBorder: string;
    inputPlaceholder: string;

    // Status
    statusBarStyle: 'light-content' | 'dark-content';
}

export const lightColors: ThemeColors = {
    // Backgrounds
    bgPrimary: '#f5f7fa',
    bgSecondary: '#ffffff',
    bgTertiary: '#e9ecef',

    // Text
    textPrimary: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',

    // Borders
    borderColor: '#dee2e6',
    borderColorSoft: '#eee',

    // Brand
    brandTeal: '#005f73',
    brandTealHover: '#004c5a',
    brandTealLight: '#e0f7ff',
    brandYellow: '#ee9b00',

    // Chat Bubbles
    myBubbleBg: '#005f73',
    myBubbleText: '#ffffff',
    otherBubbleBg: '#f1f3f5',
    otherBubbleText: '#333333',
    iaBubbleBg: '#fffbe6',
    iaBubbleText: '#333333',

    // Input
    inputBg: '#ffffff',
    inputText: '#374151',
    inputBorder: '#e5e7eb',
    inputPlaceholder: '#9ca3af',

    // Status
    statusBarStyle: 'dark-content',
};

export const darkColors: ThemeColors = {
    // Backgrounds
    bgPrimary: '#121212',
    bgSecondary: '#1e1e1e',
    bgTertiary: '#2c2c2c',

    // Text
    textPrimary: '#e9ecef',
    textSecondary: '#adb5bd',
    textTertiary: '#6c757d',

    // Borders
    borderColor: '#404040',
    borderColorSoft: '#2c2c2c',

    // Brand
    brandTeal: '#2a9d8f',
    brandTealHover: '#21867a',
    brandTealLight: 'rgba(42, 157, 143, 0.15)',
    brandYellow: '#ee9b00',

    // Chat Bubbles
    myBubbleBg: '#2a9d8f',
    myBubbleText: '#ffffff',
    otherBubbleBg: '#2c2c2c',
    otherBubbleText: '#e9ecef',
    iaBubbleBg: '#3d3520',
    iaBubbleText: '#e9ecef',

    // Input
    inputBg: '#2c2c2c',
    inputText: '#e9ecef',
    inputBorder: '#404040',
    inputPlaceholder: '#6c757d',

    // Status
    statusBarStyle: 'light-content',
};
