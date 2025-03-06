// src/theme.js
import { createTheme } from '@mui/material/styles';

// Modern dog breeder website color palette
// Warm, friendly colors that convey trust and professionalism
const primaryColor = '#7E57C2'; // Rich purple - distinctive, luxury
const primaryLightColor = '#B085F5';
const primaryDarkColor = '#4D2C91';
const secondaryColor = '#FF9E80'; // Warm peach/coral - friendly, approachable
const secondaryLightColor = '#FFC9A8';
const secondaryDarkColor = '#C96F53';
const neutralColor = '#F5F0EB'; // Warm off-white for backgrounds
const neutralDarkColor = '#E5DED5';
const darkTextColor = '#3E2723'; // Warm dark brown for text
const lightTextColor = '#78665A'; // Lighter brown for secondary text

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: primaryColor,
      light: primaryLightColor,
      dark: primaryDarkColor,
      contrastText: '#fff',
    },
    secondary: {
      main: secondaryColor,
      light: secondaryLightColor,
      dark: secondaryDarkColor,
      contrastText: darkTextColor,
    },
    error: {
      main: '#F44336',
    },
    warning: {
      main: '#FF9800',
    },
    info: {
      main: '#29B6F6',
    },
    success: {
      main: '#66BB6A',
    },
    text: {
      primary: darkTextColor,
      secondary: lightTextColor,
    },
    background: {
      default: neutralColor,
      paper: '#fff',
      neutral: neutralColor,
      neutralDark: neutralDarkColor,
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: [
      'Poppins',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '3rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      '@media (max-width:600px)': {
        fontSize: '2.2rem',
      },
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      '@media (max-width:600px)': {
        fontSize: '1.8rem',
      },
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.3rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.15rem',
      },
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
    subtitle1: {
      fontSize: '1.1rem',
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.9rem',
      fontWeight: 500,
    },
  },
  components: {
    // Button styling
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 500,
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(126, 87, 194, 0.2)',
          },
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.85rem',
        },
        sizeMedium: {
          padding: '8px 22px',
          fontSize: '0.9rem',
        },
        sizeLarge: {
          padding: '10px 26px',
          fontSize: '1rem',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDarkColor} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${primaryColor} 10%, ${primaryDarkColor} 90%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${secondaryDarkColor} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${secondaryColor} 10%, ${secondaryDarkColor} 90%)`,
          },
        },
        outlinedPrimary: {
          borderWidth: 2,
        },
        outlinedSecondary: {
          borderWidth: 2,
        },
      },
    },
    
    // Card styling - more refined with subtle animations
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-5px)',
          },
        },
      },
    },
    
    // CardMedia styling - make images look better
    MuiCardMedia: {
      styleOverrides: {
        root: {
          transition: 'transform 0.6s ease',
          '&:hover': {
            transform: 'scale(1.03)',
          },
        },
      },
    },
    
    // Make text fields more elegant
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
          '& .MuiInputLabel-root': {
            '&.Mui-focused': {
              color: primaryColor,
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },

    // Style selects consistently with text fields    
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    
    // Paper components for backgrounds
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
        },
        elevation2: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    
    // Chip styling for tags
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
          '&.MuiChip-colorPrimary': {
            background: `linear-gradient(135deg, ${primaryLightColor} 0%, ${primaryColor} 100%)`,
          },
          '&.MuiChip-colorSecondary': {
            background: `linear-gradient(135deg, ${secondaryLightColor} 0%, ${secondaryColor} 100%)`,
          },
        },
        label: {
          padding: '0 12px',
        },
      },
    },
    
    // Badge styling
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 500,
          padding: '0 6px',
          minWidth: 20,
          height: 20,
        },
      },
    },
    
    // Divider styling
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.06)',
        },
      },
    },
    
    // AppBar styling for navigation
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          backgroundImage: 'none',
        },
        colorDefault: {
          backgroundColor: '#fff',
        },
      },
    },
    
    // Responsive sizing for different components
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '0 16px',
          },
        },
      },
    },
    
    // Grid spacing on mobile
    MuiGrid: {
      styleOverrides: {
        container: {
          '@media (max-width:600px)': {
            spacing: 2,
          },
        },
      },
    },
    
    // Avatar for team members or testimonials
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid #fff',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    
    // Accordion for FAQ sections
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        },
      },
    },
    
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '0 24px',
          '&.Mui-expanded': {
            minHeight: 56,
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          },
        },
        content: {
          margin: '12px 0',
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
      },
    },
    
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '16px 24px 24px',
        },
      },
    },
  },
  
  // Custom breakpoints for better mobile responsiveness
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  // General spacing 
  spacing: 8,
  shape: {
    borderRadius: 12,
  },
});

export default theme;