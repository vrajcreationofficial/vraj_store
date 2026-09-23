const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGO_URL;

    if (!mongoURL) {
      throw new Error("MONGO_URL is missing in .env file");
    }

    const conn = await mongoose.connect(mongoURL);

    console.log("==========================================");
    console.log("MongoDB Connected Successfully");
    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);
    console.log("==========================================");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;