const requiredVars = ['POSTGRES_USER', 'POSTGRES_DB', 'POSTGRES_HOST', 'POSTGRES_PORT'];

requiredVars.forEach(key => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  } else {
    console.log(`Environment variable ${key} is set.`);
  }
});
