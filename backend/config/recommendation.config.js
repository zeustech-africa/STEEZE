// AUDIT: Environment validation - will crash early if misconfigured
const validateConfig = () => {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  
  return {
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV || 'development',
    rateLimitWindow: parseInt(process.env.RECOMMENDATION_RATE_LIMIT_WINDOW) || 60000,
    rateLimitMax: parseInt(process.env.RECOMMENDATION_RATE_LIMIT_MAX) || 30,
    batchUpdateDelay: parseInt(process.env.PREFERENCE_BATCH_DELAY) || 5000,
    maxCandidates: parseInt(process.env.MAX_FEED_CANDIDATES) || 500
  };
};

export const config = validateConfig();
export default config;