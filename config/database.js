const mongoose = require("mongoose");
const { mongoUri } = require("./env");

// Resolves with the underlying MongoClient so the session store can share
// the same connection.
const connectDB = async () => {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");
  return mongoose.connection.getClient();
};

module.exports = connectDB;
