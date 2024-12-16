export const theme = {
    colors: {
        primary: '#007AFF',        // Blue (used for primary buttons, links, etc.)
        secondary: '#4CD964',      // Green (used for secondary actions, success states)
        accent: '#FF9500',         // Orange (used for highlights, calls to action)
        background: '#F8F8F8',    // Light gray (used for the main background)
        backgroundDark: '#EEEEEE', // Slightly darker gray for other background elements
        text: '#333333',          // Dark gray (used for main text content)
        textLight: '#666666',     // Lighter gray (used for less important text)
        error: '#FF3B30',         // Red (used for error messages, destructive actions)
        warning: '#FFCC00',       // Yellow (used for warning messages)
        success: '#4CD964',       // Green (used for success messages)
        info: '#007AFF',          // Blue (used for informational messages)
        gray: '#CCCCCC',          // Light gray (used for borders, dividers, inactive elements)
        grayMedium: '#999999',    // Medium gray (used for placeholder text, secondary labels)
        grayDark: '#666666',      // Dark gray (used for less prominent text or icons)
        white: '#FFFFFF',         // White (used for text on dark backgrounds, backgrounds of cards)
        black: '#000000',         // Black (used for high contrast text, strong borders)
    },
    fonts: {
        main: 'Helvetica Neue, Helvetica, Arial, sans-serif', // Example main font family
        heading: 'Georgia, Times New Roman, serif',         // Example heading font family
        monospace: 'Courier New, Courier, monospace',        // Example monospace font family
        size: {
            xs: 12,           // Extra small font size
            sm: 14,           // Small font size
            base: 16,         // Base font size (default)
            md: 18,          // Medium font size
            lg: 20,          // Large font size
            xl: 24,          // Extra large font size
            xxl: 30,         // Extra extra large font size
            xxxl: 36,        // Extra extra extra large font size
        }
    },
    spacing: {
        xs: 4,             // Extra small spacing
        sm: 8,             // Small spacing
        base: 16,          // Base spacing (default)
        md: 24,            // Medium spacing
        lg: 32,            // Large spacing
        xl: 48,            // Extra large spacing
        xxl: 64,           // Extra extra large spacing
        xxxl: 96           // Extra extra extra large spacing
    },
    breakpoints: {
        xs: 0,             // Extra small screen breakpoint
        sm: 576,           // Small screen breakpoint
        md: 768,           // Medium screen breakpoint
        lg: 992,           // Large screen breakpoint
        xl: 1200,          // Extra large screen breakpoint
        xxl: 1400          // Extra extra large screen breakpoint
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',   // Small shadow (e.g., for buttons)
        base: '0 2px 4px 0 rgba(0, 0, 0, 0.1)', // Base shadow (e.g., for cards)
        md: '0 4px 8px 0 rgba(0, 0, 0, 0.1)',   // Medium shadow
        lg: '0 8px 16px 0 rgba(0, 0, 0, 0.1)',  // Large shadow
    },
    radii: {
        sm: 4,             // Small border radius (e.g., for buttons)
        base: 8,          // Base border radius (e.g., for cards)
        md: 12,           // Medium border radius
        lg: 16,           // Large border radius
        full: 9999,        // Fully rounded (e.g., for circular elements)
    }
};