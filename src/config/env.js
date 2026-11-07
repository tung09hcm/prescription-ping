import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 8080,

  isProduction: process.env.NODE_ENV === "production",

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  selfPing: {
    enabled: process.env.SELF_PING_ENABLED === "true",
    publicOrigin: process.env.PUBLIC_ORIGIN,
    interval: Number(process.env.SELF_PING_INTERVAL_MS) || 300000,
  },
};

if (!config.gemini.apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}
