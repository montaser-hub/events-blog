require("dotenv").config();

const required = ["MONGO_URI", "SESSION_SECRET"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `Missing required env vars: ${missing.join(", ")}.\n` +
      "Copy .env.example to .env and fill them in."
  );
  process.exit(1);
}

module.exports = {
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI,
  sessionSecret: process.env.SESSION_SECRET,
};
