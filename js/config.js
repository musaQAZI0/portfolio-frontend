// API Configuration
// For separated frontend and backend deployment

const API_CONFIG = {
    // For local development
    development: {
        API_URL: 'http://localhost:3000/api',
        BASE_URL: 'http://localhost:3000'
    },

    // For production (uses Netlify proxy for API, direct Render URL for images)
    production: {
        API_URL: '/api',
        BASE_URL: 'https://portfolio-backend-cl6s.onrender.com'
    }
};

// Automatically detect environment
const ENV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'development' : 'production';

// Export config
const API_URL = API_CONFIG[ENV].API_URL;
const BASE_URL = API_CONFIG[ENV].BASE_URL;

console.log('Environment:', ENV);
console.log('API URL:', API_URL);
console.log('BASE URL:', BASE_URL);
