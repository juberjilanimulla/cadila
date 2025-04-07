import "dotenv/config";

const config = {
  PORT: process.env.PORT,
  MONGODB_URL: process.env.MONGODB_URL,
  // PRODDEV: process.env.PRODDEV || "prod",
  FRONTEND_PATH: process.env.FRONTEND_PATH,
  MAILJET_API_KEY: process.env.MAILJET_API_KEY,
  MAILJET_SECRET_KEY: process.env.MAILJET_SECRET_KEY,
  MAILJET_SENDER: process.env.MAILJET_SENDER,
};

export default config;
