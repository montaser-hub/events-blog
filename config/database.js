const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "MONGO_URI_REDACTED"
    );
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
};

module.exports = connectDB;
