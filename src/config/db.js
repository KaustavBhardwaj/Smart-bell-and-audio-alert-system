const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "audio_server",
    });

    console.log("[DB] MongoDB Atlas connected");
  } catch (error) {
    console.error("[DB] MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;