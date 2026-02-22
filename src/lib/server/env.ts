const requiredEnvVars = ["DATABASE_URL"] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

type ServerEnv = {
  [K in RequiredEnvVar]: string;
};

function loadServerEnv(): ServerEnv {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key] || process.env[key]?.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}`
    );
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL as string,
  };
}

export const env = loadServerEnv();
