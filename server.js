const mongoose = require("mongoose");
const { port } = require("./config/env");
const connectDB = require("./config/database");
const createApp = require("./app");

const clientPromise = connectDB();

clientPromise.catch((err) => {
  console.error("Could not connect to MongoDB:", err.message);
  process.exit(1);
});

const server = createApp(clientPromise).listen(port, () => {
  console.log(`Events Blog running on http://localhost:${port}`);
});

const shutdown = () => {
  server.close(() => mongoose.connection.close(false).then(() => process.exit(0)));
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
