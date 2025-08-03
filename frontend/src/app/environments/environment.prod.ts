export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'Price Tracker',
  version: '1.0.0',
  features: {
    socialLogin: true,
    notifications: true,
    charts: true,
  },
  // For future social auth integration
  auth: {
    google: {
      clientId: 'your-google-client-id'
    },
    microsoft: {
      clientId: 'your-microsoft-client-id'
    }
  }
};
