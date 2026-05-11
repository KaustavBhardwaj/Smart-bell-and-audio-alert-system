const path = require("path");
const connectDB = require("./config/db");


require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const app = require("./app");
const { PORT, PUBLIC_BASE_URL } = require("./config/env");
const { initializeSchedules } = require("./services/scheduleService");

async function startServer() {
  await connectDB();

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on port ${PORT}`);

    if (typeof initializeSchedules === "function") {
      await initializeSchedules();
    }
  });
}

startServer();