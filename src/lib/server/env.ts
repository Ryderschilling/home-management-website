// src/lib/server/env.ts

const requiredEnvVars = [
  "DATABASE_URL",
  "DEFAULT_ORGANIZATION_ID",
  "ADMIN_PASSWORD",

  // Email sending (Resend + template absolute URLs)
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "APP_URL",
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

type ServerEnv = {
  [K in RequiredEnvVar]: string;
} & {
  // Optional-ish but useful
  REPLY_TO_EMAIL?: string;
  GBP_REVIEW_URL?: string;
  UPSELL_URL?: string;

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

    RESEND_API_KEY: process.env.RESEND_API_KEY as string,
    FROM_EMAIL: process.env.FROM_EMAIL as string,
    APP_URL: process.env.APP_URL as string,

    REPLY_TO_EMAIL: process.env.REPLY_TO_EMAIL?.trim() || process.env.REPLY_TO_EMAIL?.trim() || undefined,
    GBP_REVIEW_URL: process.env.GBP_REVIEW_URL?.trim() || undefined,
    UPSELL_URL: process.env.UPSELL_URL?.trim() || undefined,

    JOB_PHOTO_MAX_BYTES:
      Number.isFinite(parsedJobPhotoMaxBytes) && parsedJobPhotoMaxBytes > 0
        ? parsedJobPhotoMaxBytes
        : 7 * 1024 * 1024,
  };
}

export const env = loadServerEnv();