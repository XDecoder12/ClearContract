const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'GEMINI_API_KEY'
];

export const validateEnvironment = () => {
  const missingVariables = REQUIRED_ENV_VARS.filter(
    (variableName) =>
      typeof process.env[variableName] !== 'string' ||
      process.env[variableName].trim() === ''
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(', ')}`
    );
  }
};