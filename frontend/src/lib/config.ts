// Frontend Configuration Management

interface Config {
  apiUrl: string;
  appName: string;
  appDescription: string;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
}

// Validate required environment variables
const validateConfig = (): Config => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is required');
  }

  return {
    apiUrl,
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Sanket - Masked Calling Parking Alert System',
    appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Secure communication system for vehicle owners and concerned parties',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableErrorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
  };
};

// Export validated configuration
export const config = validateConfig();

// Helper functions
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';