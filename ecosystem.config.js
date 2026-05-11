module.exports = {
  apps: [
    {
      name: "caiena",
      script: ".next/standalone/server.js",
      cwd: "/var/www/caiena",
      env: {
        NODE_ENV: "production",
        PORT: 3007,
        HOSTNAME: "0.0.0.0",
        // PostgreSQL (Neon)
        DATABASE_URL: "postgresql://neondb_owner:npg_laoCiUL2xTZ3@ep-proud-boat-amdq73sr-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        // App
        APP_URL: "https://caienanails.com",
        // Kapso WhatsApp
        KAPSO_API_KEY: "28ccd4e91f522e15092198dfb6c99379e4b838005fe2fc10cfd3b2f05d1a3930",
        KAPSO_PHONE_NUMBER_ID: "937049409503126",
        KAPSO_WEBHOOK_SECRET: "9bac99539300c016d20cdff48bf6f5077ed2e5018eaf20c1fcce06543195355e",
        WHATSAPP_BUSINESS_PHONE: "12057940509",
        // Google OAuth (for WhatsApp user identity) — set these after creating OAuth client
        GOOGLE_OAUTH_CLIENT_ID: "",
        GOOGLE_OAUTH_CLIENT_SECRET: "",
        // Auth.js (Google OAuth)
        AUTH_SECRET: "W6Gw3bacafFb24WbBz5QnYFiSEv6P3FLUeQUqcB3iJ6a",
        AUTH_GOOGLE_ID: "PLACEHOLDER_REPLACE_BEFORE_DEPLOY",
        AUTH_GOOGLE_SECRET: "PLACEHOLDER_REPLACE_BEFORE_DEPLOY",
        AUTH_TRUST_HOST: "true",
        SUPERADMIN_EMAILS: "wjjfernandez@gmail.com",
        LOYALTY_MILESTONE: "10",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
    },
  ],
};
