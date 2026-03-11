const requiredEnvVars = ["DATABASE_URL", "DEFAULT_ORGANIZATION_ID", "ADMIN_PASSWORD"] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

type ServerEnv = {
  [K in RequiredEnvVar]: string;
} & {
  JOB_PHOTO_MAX_BYTES: number;
};

function loadServerEnv(): ServerEnv {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key] || process.env[key]?.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }

  const rawJobPhotoMaxBytes = process.env.JOB_PHOTO_MAX_BYTES?.trim();
  const parsedJobPhotoMaxBytes = rawJobPhotoMaxBytes
    ? Number(rawJobPhotoMaxBytes)
    : 7 * 1024 * 1024;

  return {
    DATABASE_URL: process.env.DATABASE_URL as string,
    DEFAULT_ORGANIZATION_ID: process.env.DEFAULT_ORGANIZATION_ID as string,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD as string,
    JOB_PHOTO_MAX_BYTES:
      Number.isFinite(parsedJobPhotoMaxBytes) && parsedJobPhotoMaxBytes > 0
        ? parsedJobPhotoMaxBytes
        : 7 * 1024 * 1024,
  };
}

export const env = loadServerEnv();