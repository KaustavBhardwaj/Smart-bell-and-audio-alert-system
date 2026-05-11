const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const app = require("./app");
const { PORT, PUBLIC_BASE_URL } = require("./config/env");
const { initializeSchedules } = require("./services/scheduleService");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Announcement server running on http://0.0.0.0:${PORT}`);
  console.log(`Public URL: ${PUBLIC_BASE_URL}`);

  initializeSchedules();
});